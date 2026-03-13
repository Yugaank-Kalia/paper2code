'use server';

import { Ollama } from 'ollama';
import { auth } from '@/lib/auth';
import { randomUUID } from 'crypto';
import { headers } from 'next/headers';
import { embedText } from '@/lib/embeddings';
import { cosineSimilarity } from '@/lib/vector';
import { db } from '@/index';
import { eq, and } from 'drizzle-orm';
import { chunks, generatedCode, notifications, papers } from '@/src/db/schema';

// ── Types ─────────────────────────────────────────────────────────────────────

export type CodeBlock = {
	title: string;
	description: string;
	code: string;
};

export type GenerateCodeResult =
	| { status: 'pending' }
	| { status: 'unauthorized' }
	| { status: 'error'; message: string }
	| { status: 'ok'; codeBlocks: CodeBlock[] };

export type GetGeneratedCodeResult =
	| { status: 'ok'; codeBlocks: CodeBlock[] }
	| { status: 'empty' }
	| { status: 'pending' }
	| { status: 'error'; message: string }
	| { status: 'not_found' }
	| { status: 'unauthorized' };

// ── Cache lookup ──────────────────────────────────────────────────────────────

export async function getGeneratedCode(
	paperId: string,
): Promise<GetGeneratedCodeResult> {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session) return { status: 'unauthorized' };

	const cached = await db
		.select()
		.from(generatedCode)
		.where(
			and(
				eq(generatedCode.paperId, paperId),
				eq(generatedCode.userId, session.user.id),
			),
		)
		.limit(1);

	if (!cached.length) return { status: 'not_found' };

	const row = cached[0];

	if (row.status === 'done') {
		const blocks = row.codeBlocks as CodeBlock[];
		if (blocks && blocks.length > 0) {
			return { status: 'ok', codeBlocks: blocks };
		}
		return { status: 'empty' };
	}

	if (row.status === 'pending') return { status: 'pending' };
	if (row.status === 'error')
		return { status: 'error', message: 'Previous generation failed.' };

	return { status: 'not_found' };
}

// ── Config ────────────────────────────────────────────────────────────────────

const TOP_K = 10;

const QUERY_PROMPT =
	'Extract the core algorithm, mathematical formulation, model architecture, ' +
	'and training procedure described in this paper so it can be implemented in PyTorch.';

// ── Reference-section filter ──────────────────────────────────────────────────

const REFERENCE_LINE_RE = /^\s*\[\d+\]/m;
const INLINE_CITATION_RE = /\[\d+\]/g;
const REFERENCE_KEYWORDS_RE =
	/\b(arXiv|CoRR|abs\/|preprint|Proceedings|ACL|ICLR|NeurIPS|ICML|EMNLP|NAACL)\b/gi;
const MIN_CITATION_ENTRIES = 3;
const MIN_KEYWORD_HITS = 3;

function isReferenceChunk(text: string): boolean {
	const citations = text.match(INLINE_CITATION_RE) ?? [];
	const keywords = text.match(REFERENCE_KEYWORDS_RE) ?? [];
	const isStructuredBiblio =
		REFERENCE_LINE_RE.test(text) &&
		citations.length >= MIN_CITATION_ENTRIES;
	const isKeywordDense = keywords.length >= MIN_KEYWORD_HITS;
	return isStructuredBiblio || isKeywordDense;
}

// ── LLM call ──────────────────────────────────────────────────────────────────

async function callOllama(
	contextChunks: { chunkIndex: number; text: string }[],
): Promise<CodeBlock[]> {
	const model = process.env.QUERY_MODEL!;

	const ollama = new Ollama({
		host: process.env.OLLAMA_URL,
		headers: {
			Authorization: `Bearer ${process.env.OLLAMA_API_KEY}`,
		},
	});

	const context = contextChunks
		.map(
			(c, i) =>
				`--- Chunk ${i + 1} (index ${c.chunkIndex}) ---\n${c.text}`,
		)
		.join('\n\n');

	const prompt = `You are an expert ML engineer. Using ONLY the paper excerpts below, implement the described model and training procedure in clean, well-documented PyTorch.

Requirements:
- Implement all described architectural components (layers, activations, normalization, etc.)
- Match hyperparameters and dimensions exactly as stated in the paper
- Include the full training loop with the described loss function and optimizer
- Add concise docstrings and inline comments referencing the paper equations
- Keep each code block short and focused — split complex components into separate blocks rather than writing one large block
- Do NOT hallucinate details not present in the excerpts

Paper excerpts:
${context}

Respond with ONLY a JSON array of code block objects. Each object must have:
    "title": a short label for this code block (e.g. "Model Architecture", "Training Loop")
    "description": one-sentence summary of what this block implements
    "code": the full Python source code as a string

Example shape (do not copy content, only structure):
[
    { "title": "Model Architecture", "description": "...", "code": "..." },
    { "title": "Training Loop", "description": "...", "code": "..." }
]

JSON array:`;

	const stream = await ollama.chat({
		model,
		stream: true,
		messages: [
			{
				role: 'system',
				content:
					'You are an expert ML engineer. Implement models from paper excerpts in clean, well-documented PyTorch. Match all hyperparameters and dimensions exactly as stated. Do NOT hallucinate details not present in the excerpts. Always respond with a raw JSON array of code block objects — no prose, no markdown fences, just valid JSON.',
			},
			{ role: 'user', content: prompt },
		],
	});

	let rawOutput = '';
	for await (const part of stream) {
		rawOutput += part.message.content;
	}

	const start = rawOutput.indexOf('[');
	const end = rawOutput.lastIndexOf(']');
	if (start === -1 || end === -1) {
		throw new Error('Model did not return a valid JSON array.');
	}

	return JSON.parse(rawOutput.slice(start, end + 1)) as CodeBlock[];
}

// ── Notification helper ───────────────────────────────────────────────────────

async function insertNotification(
	userId: string,
	paperId: string | null,
	title: string,
	description: string,
	status: 'success' | 'error' | 'info',
) {
	await db
		.insert(notifications)
		.values({
			id: randomUUID(),
			userId,
			...(paperId && { paperId }),
			title,
			description,
			status,
		})
		.catch(() => {});
}

// ── Server action ─────────────────────────────────────────────────────────────

export async function generateCode(
	paperId: string,
): Promise<GenerateCodeResult> {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session) return { status: 'unauthorized' };
	const userId = session.user.id;

	try {
		// 0. Return cached result if already done with blocks
		const cached = await db
			.select()
			.from(generatedCode)
			.where(
				and(
					eq(generatedCode.paperId, paperId),
					eq(generatedCode.userId, userId),
					eq(generatedCode.status, 'done'),
				),
			)
			.limit(1);

		if (
			cached.length > 0 &&
			cached[0].codeBlocks &&
			(cached[0].codeBlocks as CodeBlock[]).length > 0
		) {
			return {
				status: 'ok',
				codeBlocks: cached[0].codeBlocks as CodeBlock[],
			};
		}

		// Get paper title for notifications
		const paper = await db
			.select({ title: papers.title })
			.from(papers)
			.where(eq(papers.id, paperId))
			.limit(1);
		const paperTitle = paper[0]?.title ?? 'Unknown paper';

		// Insert pending row
		const codeId = randomUUID();
		await db
			.insert(generatedCode)
			.values({
				id: codeId,
				paperId,
				userId,
				status: 'pending',
				model: process.env.QUERY_MODEL,
			})
			.onConflictDoNothing();

		// Embed the query prompt
		const queryEmbedding = await embedText(QUERY_PROMPT);

		// Fetch all chunks
		const allChunks = await db
			.select({
				id: chunks.id,
				chunkIndex: chunks.chunkIndex,
				section: chunks.section,
				text: chunks.text,
				tokens: chunks.tokens,
				embedding: chunks.embedding,
			})
			.from(chunks)
			.where(eq(chunks.paperId, paperId));

		if (allChunks.length === 0) {
			await db
				.update(generatedCode)
				.set({ status: 'error', updatedAt: new Date() })
				.where(eq(generatedCode.id, codeId));

			await insertNotification(
				userId,
				paperId,
				'Generation failed',
				`${paperTitle} — no chunks found.`,
				'error',
			);
			return {
				status: 'error',
				message: `No chunks found for paper ${paperId}`,
			};
		}

		// Filter reference chunks
		const contentChunks = allChunks.filter(
			(c) => !isReferenceChunk(c.text),
		);

		// Score via cosine similarity and take top-K
		const topChunks = contentChunks
			.map((chunk) => ({
				chunkIndex: chunk.chunkIndex,
				text: chunk.text,
				similarity:
					cosineSimilarity(
						queryEmbedding,
						chunk.embedding as number[],
					) ?? -Infinity,
			}))
			.sort((a, b) => b.similarity - a.similarity)
			.slice(0, TOP_K);

		// Generate code
		const codeBlocks = await callOllama(topChunks);

		// for error handling
		// const codeBlocks = [] as CodeBlock[];

		// Handle empty result
		if (!codeBlocks || codeBlocks.length === 0) {
			await db
				.update(generatedCode)
				.set({ status: 'error', updatedAt: new Date() })
				.where(eq(generatedCode.id, codeId));

			await insertNotification(
				userId,
				paperId,
				'Generation failed',
				`${paperTitle} — no code blocks could be extracted.`,
				'error',
			);
			return {
				status: 'error',
				message: 'No code blocks could be extracted.',
			};
		}

		// Persist and notify
		await db
			.update(generatedCode)
			.set({ codeBlocks, status: 'done', updatedAt: new Date() })
			.where(eq(generatedCode.id, codeId));

		await insertNotification(
			userId,
			paperId,
			'Code generation complete',
			`${paperTitle} — ${codeBlocks.length} code blocks generated.`,
			'success',
		);

		return { status: 'ok', codeBlocks };
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		await insertNotification(
			userId,
			null,
			'Generation failed',
			'An unexpected error occurred. Please try again.',
			'error',
		);
		return { status: 'error', message };
	}
}

// ── Delete ────────────────────────────────────────────────────────────────────

export async function deleteGeneratedCode(paperId: string) {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session) return;

	await db
		.delete(generatedCode)
		.where(
			and(
				eq(generatedCode.paperId, paperId),
				eq(generatedCode.userId, session.user.id),
			),
		);
}
