'use server';

import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { db } from '@/index';
import { papers } from '@/src/db/schema';
import { eq, and } from 'drizzle-orm';
import { supabase, getPaperFilename } from '@/lib/supabase';

export type GetPdfResult =
	| { status: 'unauthorized' }
	| { status: 'not-found' }
	| { status: 'ok'; pdfBase64: string };

export async function getPdf(paperId: string): Promise<GetPdfResult> {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session) {
		return { status: 'unauthorized' };
	}
	const userId = session.user.id;

	// Ensure the paper exists AND belongs to the user
	const [paper] = await db
		.select({ id: papers.id, title: papers.title })
		.from(papers)
		.where(and(eq(papers.id, paperId), eq(papers.userId, userId)))
		.limit(1);

	if (!paper) {
		return { status: 'not-found' };
	}

	const filename = getPaperFilename(paper.title ?? paper.id, paper.id);

	const { data, error } = await supabase.storage
		.from(userId)
		.download(filename);

	if (error || !data) {
		console.error('Failed to download PDF from Supabase Storage:', error);
		return { status: 'not-found' };
	}

	const buffer = Buffer.from(await data.arrayBuffer());
	return { status: 'ok', pdfBase64: buffer.toString('base64') };
}
