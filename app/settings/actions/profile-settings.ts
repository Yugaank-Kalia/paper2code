'use server';

import { db } from '@/index';
import { auth } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { user } from '@/src/db/auth-schema';

export type UpdateProfileResult =
	| { status: 'unauthorized' }
	| { status: 'error'; message: string }
	| { status: 'ok' };

export async function updateProfile(
	formData: FormData,
): Promise<UpdateProfileResult> {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session) {
		return { status: 'unauthorized' };
	}

	const name = (formData.get('name') as string | null)?.trim() || undefined;
	const image = (formData.get('image') as string | null)?.trim() || undefined;

	if (!name && !image) {
		return { status: 'error', message: 'No changes provided' };
	}

	try {
		await db
			.update(user)
			.set({
				...(name && { name }),
				...(image && { image }),
				updatedAt: new Date(),
			})
			.where(eq(user.id, session.user.id));

		return { status: 'ok' };
	} catch (error) {
		console.error('Update profile error:', error);
		return { status: 'error', message: 'Failed to update profile' };
	}
}
