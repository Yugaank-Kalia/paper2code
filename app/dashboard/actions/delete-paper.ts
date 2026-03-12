'use server';

import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/index';
import { papers } from '@/src/db/schema';
import { supabase, getPaperFilename } from '@/lib/supabase';

export async function deletePaper(formData: FormData): Promise<void> {
	const session = await auth.api.getSession({
		headers: await headers(),
	});
	if (!session) return;
	const userId = session.user.id;

	const paperIdValue = formData.get('paperId');
	const paperId = typeof paperIdValue === 'string' ? paperIdValue : '';

	if (!paperId) {
		return;
	}

	const [paper] = await db
		.select({ id: papers.id, title: papers.title })
		.from(papers)
		.where(and(eq(papers.id, paperId), eq(papers.userId, userId)))
		.limit(1);

	if (!paper) {
		return;
	}

	await db
		.delete(papers)
		.where(and(eq(papers.id, paperId), eq(papers.userId, userId)));

	try {
		await supabase.storage
			.from(userId)
			.remove([getPaperFilename(paper.title ?? paper.id, paper.id)]);
	} catch {
		// Ignore storage cleanup errors so DB deletion still succeeds.
	}

	revalidatePath('/dashboard');
}
