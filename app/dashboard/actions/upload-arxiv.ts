'use server';

import { db } from '@/index';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { user } from '@/src/db/auth-schema';
import { chunkText } from '@/lib/chunking';
import { chunks, papers } from '@/src/db/schema';
import { embedTextBatch } from '@/lib/embeddings';
import { supabase, getPaperFilename } from '@/lib/supabase';

// pdf-parse's main entry runs a self-test on import; use the internal path to skip it.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse: typeof import('pdf-parse') = require('pdf-parse/lib/pdf-parse.js');

export type UploadArxivResult =
	| { status: 'unauthorized' }
	| { status: 'error'; message: string }
	| { status: 'ok'; paperId: string; chunkCount: number; title: string };

/** Fetches metadata (title, authors, year) from the arXiv Atom API. */
async function fetchArxivMeta(
	arxivId: string,
): Promise<{ authors: string[]; year: number | null }> {
	const bare = arxivId.replace(/v\d+$/, ''); // strip version for API lookup
	const url = `https://export.arxiv.org/api/query?id_list=${bare}`;
	const res = await fetch(url, {
		headers: { 'User-Agent': 'paper-to-code/1.0 (research tool)' },
	});
	if (!res.ok) return { authors: [], year: null };

	const xml = await res.text();

	const titleMatch = xml.match(/<title>(?!ArXiv)([^<]+)<\/title>/);
	const apiTitle = titleMatch
		? titleMatch[1].trim().replace(/\s+/g, ' ')
		: '';

	const authorMatches = [...xml.matchAll(/<name>([^<]+)<\/name>/g)];
	const authors = authorMatches.map((m) => m[1].trim());

	const publishedMatch = xml.match(/<published>(\d{4})/);
	const year = publishedMatch ? parseInt(publishedMatch[1], 10) : null;

	return { authors, year };
}

/** Extracts a bare arXiv ID from a URL or ID string. Returns null if invalid. */
function parseArxivId(input: string): string | null {
	const urlMatch = input.match(
		/arxiv\.org\/(?:abs|pdf)\/(\d{4}\.\d{4,5}(?:v\d+)?)/i,
	);
	if (urlMatch) return urlMatch[1];

	const bareMatch = input.match(/^(\d{4}\.\d{4,5}(?:v\d+)?)$/);
	if (bareMatch) return bareMatch[1];

	return null;
}

export async function uploadArxiv(
	arxivInput: string,
	userTitle: string,
): Promise<UploadArxivResult> {
	const session = await auth.api.getSession({
		headers: await headers(),
	});
	if (!session) return { status: 'unauthorized' };
	const userId = session.user.id;

	const arxivId = parseArxivId(arxivInput.trim());
	if (!arxivId) {
		return {
			status: 'error',
			message:
				'Invalid arXiv URL or ID. Expected format: 2301.00001 or https://arxiv.org/abs/2301.00001',
		};
	}

	// SSRF protection: URL is always constructed from the validated ID, never from user input.
	const pdfUrl = `https://arxiv.org/pdf/${arxivId}`;
	const sourceUrl = `https://arxiv.org/abs/${arxivId}`;

	// Fetch metadata from arXiv API (non-fatal if it fails)
	const { authors, year } = await fetchArxivMeta(arxivId).catch(() => ({
		apiTitle: '',
		authors: [],
		year: null,
	}));

	const title = userTitle.trim() || `arxiv:${arxivId}`;

	try {
		const exists = await db
			.select({ id: papers.id })
			.from(papers)
			.where(and(eq(papers.source, sourceUrl), eq(papers.userId, userId)))
			.limit(1);

		if (exists.length > 0) {
			return {
				status: 'error',
				message: 'This paper has already been uploaded.',
			};
		}

		const response = await fetch(pdfUrl, {
			headers: { 'User-Agent': 'paper-to-code/1.0 (research tool)' },
		});

		if (!response.ok) {
			return {
				status: 'error',
				message: `Failed to fetch arXiv PDF (HTTP ${response.status}). Check the ID and try again.`,
			};
		}

		const contentType = response.headers.get('content-type') ?? '';
		if (!contentType.includes('pdf')) {
			return {
				status: 'error',
				message:
					'arXiv did not return a PDF. Check the ID and try again.',
			};
		}

		const buffer = Buffer.from(await response.arrayBuffer());

		// Extract text (suppress pdf-parse DeprecationWarning for Buffer)
		const originalEmit = process.emit.bind(process);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(process as any).emit = function (event: string, warning: any) {
			if (event === 'warning' && warning?.name === 'DeprecationWarning')
				return false;
			return originalEmit(
				event as Parameters<typeof originalEmit>[0],
				warning,
			);
		};

		let rawText: string;
		try {
			const data = await pdfParse(buffer);
			rawText = data.text.replace(/\0/g, '');
		} finally {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(process as any).emit = originalEmit;
		}

		if (!rawText) {
			return {
				status: 'error',
				message: 'No extractable text found in the PDF.',
			};
		}

		const paperId = crypto.randomUUID();
		const filename = getPaperFilename(title, paperId);

		await supabase.storage
			.createBucket(userId, { public: false, fileSizeLimit: 52428800 })
			.catch(() => {});

		const { error: uploadError } = await supabase.storage
			.from(userId)
			.upload(filename, buffer, {
				contentType: 'application/pdf',
				upsert: false,
			});

		if (uploadError) {
			return {
				status: 'error',
				message: `Storage upload failed: ${uploadError.message}`,
			};
		}

		// TODO
		await db
			.insert(user)
			.values({
				id: userId,
				name: 'Unknown', // or fetch from auth
				email: `${userId}@unknown.local`, // or fetch from auth
			})
			.onConflictDoNothing();

		await db.insert(papers).values({
			id: paperId,
			userId,
			title,
			authors,
			year,
			source: sourceUrl,
			rawText,
		});

		const chunkRows = chunkText(rawText);
		const embeddingBatchSize = 32;

		for (
			let offset = 0;
			offset < chunkRows.length;
			offset += embeddingBatchSize
		) {
			const batch = chunkRows.slice(offset, offset + embeddingBatchSize);
			const embeddings = await embedTextBatch(batch.map((c) => c.text));

			await db.insert(chunks).values(
				batch.map((item, index) => ({
					id: crypto.randomUUID(),
					paperId,
					userId,
					chunkIndex: item.chunkIndex,
					section: item.section,
					text: item.text,
					embedding: embeddings[index] ?? [],
					tokens: item.tokens,
				})),
			);
		}

		return { status: 'ok', paperId, chunkCount: chunkRows.length, title };
	} catch (error) {
		console.error('arXiv upload error:', error);
		return {
			status: 'error',
			message: 'Failed to fetch or process the arXiv paper.',
		};
	}
}
