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

// ── Cache lookup (fast) ───────────────────────────────────────────────────────

// actions/generate-code.ts
export async function getGeneratedCode(
	paperId: string,
): Promise<
	| { status: 'ok'; codeBlocks: CodeBlock[] }
	| { status: 'pending' }
	| { status: 'error'; message: string }
	| { status: 'not_found' }
	| { status: 'unauthorized' }
> {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session) return { status: 'unauthorized' as const };

	const cached = await db
		.select()
		.from(generatedCode)
		.where(
			and(
				eq(generatedCode.paperId, paperId),
				eq(generatedCode.userId, session.user.id),
				eq(generatedCode.status, 'done'),
			),
		)
		.limit(1);

	if (cached.length > 0 && cached[0].codeBlocks != null) {
		return {
			status: 'ok' as const,
			codeBlocks: cached[0].codeBlocks as CodeBlock[],
		};
	}

	return { status: 'not_found' as const };
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

// ── Server action ─────────────────────────────────────────────────────────────

export async function generateCode(
	paperId: string,
): Promise<GenerateCodeResult> {
	const session = await auth.api.getSession({
		headers: await headers(),
	});
	if (!session) return { status: 'unauthorized' };
	const userId = session.user.id;

	try {
		// 0. Return cached result if already done
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

		if (cached.length > 0) {
			return {
				status: 'ok',
				codeBlocks: cached[0].codeBlocks as CodeBlock[],
			};
		}

		// 1. Get paper title for notification
		const paper = await db
			.select({ title: papers.title })
			.from(papers)
			.where(eq(papers.id, paperId))
			.limit(1);
		const paperTitle = paper[0]?.title;

		const existing = await db
			.select({ id: generatedCode.id, status: generatedCode.status })
			.from(generatedCode)
			.where(
				and(
					eq(generatedCode.paperId, paperId),
					eq(generatedCode.userId, userId),
				),
			)
			.limit(1);

		// if already pending or done, don't start again
		if (existing.length > 0) {
			if (existing[0].status === 'done') {
				const row = await db
					.select()
					.from(generatedCode)
					.where(eq(generatedCode.id, existing[0].id))
					.limit(1);
				return {
					status: 'ok',
					codeBlocks: row[0].codeBlocks as CodeBlock[],
				};
			}
			if (existing[0].status === 'pending') {
				return { status: 'pending' as const };
			}
		}

		// 2. Insert pending row
		const codeId = randomUUID();
		await db.insert(generatedCode).values({
			id: codeId,
			paperId,
			userId,
			status: 'pending',
			model: process.env.QUERY_MODEL,
		});

		// 3. Embed the query prompt
		const queryEmbedding = await embedText(QUERY_PROMPT);

		// 4. Fetch all chunks for the paper
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

			await db.insert(notifications).values({
				id: randomUUID(),
				userId,
				paperId,
				title: 'Generation failed',
				description: `${paperTitle} — no chunks found.`,
				status: 'error',
			});

			return {
				status: 'error',
				message: `No chunks found for paper ${paperId}`,
			};
		}

		// 5. Drop reference/bibliography chunks
		const contentChunks = allChunks.filter(
			(c) => !isReferenceChunk(c.text),
		);

		// 6. Score via cosine similarity and take top-K
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

		// 7. Generate code from top-K chunks
		const codeBlocks = await callOllama(topChunks);

		// 8. Update row to done
		await db
			.update(generatedCode)
			.set({
				codeBlocks,
				status: 'done',
				updatedAt: new Date(),
			})
			.where(eq(generatedCode.id, codeId));

		// 9. Insert success notification
		await db.insert(notifications).values({
			id: randomUUID(),
			userId,
			paperId,
			title: 'Code generation complete',
			description: `${paperTitle} — ${codeBlocks.length} code blocks generated.`,
			status: 'success',
		});

		return { status: 'ok', codeBlocks };
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);

		// insert error notification on unexpected failure
		await db
			.insert(notifications)
			.values({
				id: randomUUID(),
				userId,
				title: 'Generation failed',
				description: `An unexpected error occurred. Please try again.`,
				status: 'error',
			})
			.catch(() => {}); // don't throw if notif insert fails

		return { status: 'error', message };
	}
}
