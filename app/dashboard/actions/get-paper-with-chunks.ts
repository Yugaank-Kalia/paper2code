'use server';

import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { eq, and, asc } from 'drizzle-orm';
import { db } from '@/index';
import { papers, chunks } from '@/src/db/schema';

export type PaperWithChunksResult =
	| { status: 'unauthorized' }
	| { status: 'not_found' }
	| {
			status: 'ok';
			paper: typeof papers.$inferSelect;
			chunks: {
				id: string;
				chunkIndex: number;
				section: string | null;
				text: string;
				tokens: number | null;
				createdAt: Date | null;
			}[];
	  };

export async function getPaperWithChunks(
	paperId: string,
): Promise<PaperWithChunksResult> {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session) {
		return { status: 'unauthorized' };
	}
	const userId = session.user.id;

	const [paper] = await db
		.select()
		.from(papers)
		.where(and(eq(papers.id, paperId), eq(papers.userId, userId)))
		.limit(1);

	if (!paper) {
		return { status: 'not_found' };
	}

	const paperChunks = await db
		.select({
			id: chunks.id,
			chunkIndex: chunks.chunkIndex,
			section: chunks.section,
			text: chunks.text,
			tokens: chunks.tokens,
			createdAt: chunks.createdAt,
		})
		.from(chunks)
		.where(eq(chunks.paperId, paperId))
		.orderBy(asc(chunks.chunkIndex));

	return { status: 'ok', paper, chunks: paperChunks };
}
