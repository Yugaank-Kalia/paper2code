'use server';

import { db } from '@/index';
import { eq, and } from 'drizzle-orm';
import { chunkText } from '@/lib/chunking';
import { user as userTable } from '@/src/db/auth-schema';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { chunks, papers } from '@/src/db/schema';
import { embedTextBatch } from '@/lib/embeddings';
import { extractTextFromUpload } from '@/lib/extractText';
import { supabase, getPaperFilename } from '@/lib/supabase';

export type UploadPaperResult =
	| { status: 'unauthorized' }
	| { status: 'error'; message: string }
	| {
			status: 'ok';
			paperId: string;
			chunkCount: number;
			filename: string;
			originalName: string;
			size: number;
	  };

export async function uploadPaper(
	formData: FormData,
): Promise<UploadPaperResult> {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session) {
		return { status: 'unauthorized' };
	}
	const user = session.user;
	const file = formData.get('file') as File | null;

	if (!file) {
		return { status: 'error', message: 'No file provided' };
	}

	const name = file.name;
	const exists = await db
		.select()
		.from(papers)
		.where(and(eq(papers.source, name), eq(papers.userId, user.id)))
		.limit(1);

	if (exists.length > 0) {
		return {
			status: 'error',
			message: 'File already exists, please upload a different file.',
		};
	}

	// Validate file type
	const allowedTypes = ['application/pdf', 'text/plain', 'text/markdown'];
	if (!allowedTypes.includes(file.type)) {
		return {
			status: 'error',
			message: 'Invalid file type. Please upload PDF, TXT, or MD files.',
		};
	}

	try {
		const bytes = await file.arrayBuffer();
		const buffer = Buffer.from(bytes);

		const paperId = crypto.randomUUID();
		const rawTitle =
			(formData.get('title') as string | null)?.trim() || file.name;
		const filename = getPaperFilename(rawTitle, paperId);

		// Ensure per-user bucket exists
		await supabase.storage
			.createBucket(user.id, {
				public: false,
				fileSizeLimit: 52428800, // 50MB
			})
			.catch(() => {});

		// Upload to Supabase Storage
		const { error: uploadError } = await supabase.storage
			.from(user.id)
			.upload(filename, buffer, {
				contentType: file.type,
				upsert: false,
			});

		if (uploadError) {
			return {
				status: 'error',
				message: `Storage upload failed: ${uploadError.message}`,
			};
		}

		let rawText = await extractTextFromUpload(file);
		if (!rawText) {
			return {
				status: 'error',
				message: 'No extractable text found in file.',
			};
		}

		// PostgreSQL doesn't allow null characters (0x00) in text fields
		rawText = rawText.replace(/\0/g, '');

		await db
			.insert(userTable)
			.values({
				id: user.id,
				name: user.name,
				email: user.email,
			})
			.onConflictDoNothing();

		await db.insert(papers).values({
			id: paperId,
			userId: user.id,
			title: rawTitle === '' ? name : rawTitle,
			source: name, // original filename used for duplicate detection
			rawText,
		});

		const chunkRows = chunkText(rawText);
		const embeddingBatchSize = 32;

		for (
			let offset = 0;
			offset < chunkRows.length;
			offset += embeddingBatchSize
		) {
			const currentBatch = chunkRows.slice(
				offset,
				offset + embeddingBatchSize,
			);
			const embeddings = await embedTextBatch(
				currentBatch.map((item) => item.text),
			);

			await db.insert(chunks).values(
				currentBatch.map((item, index) => ({
					id: crypto.randomUUID(),
					paperId,
					userId: user.id,
					chunkIndex: item.chunkIndex,
					section: item.section,
					text: item.text,
					embedding: embeddings[index] ?? [],
					tokens: item.tokens,
				})),
			);
		}

		return {
			status: 'ok',
			paperId,
			chunkCount: chunkRows.length,
			filename,
			originalName: file.name,
			size: file.size,
		};
	} catch (error) {
		console.error('Upload error:', error);
		return { status: 'error', message: 'Failed to upload file' };
	}
}
