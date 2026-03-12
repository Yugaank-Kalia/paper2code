'use server';

import { db } from '@/index';
import { notifications } from '@/src/db/schema';
import { auth } from '@/lib/auth';
import { eq, and, desc } from 'drizzle-orm';
import { headers } from 'next/headers';

export async function getNotifications() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session) return { status: 'unauthorized' as const };

	const rows = await db
		.select()
		.from(notifications)
		.where(eq(notifications.userId, session.user.id))
		.orderBy(desc(notifications.createdAt))
		.limit(20);

	return { status: 'ok' as const, notifications: rows };
}

export async function markNotificationRead(id: string) {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session) return;

	await db
		.update(notifications)
		.set({ read: true })
		.where(
			and(
				eq(notifications.id, id),
				eq(notifications.userId, session.user.id),
			),
		);
}

export async function markAllNotificationsRead() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session) return;

	await db
		.update(notifications)
		.set({ read: true })
		.where(eq(notifications.userId, session.user.id));
}

export async function dismissNotification(id: string) {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session) return;

	await db
		.delete(notifications)
		.where(
			and(
				eq(notifications.id, id),
				eq(notifications.userId, session.user.id),
			),
		);
}
