'use client';

import { useState, useEffect } from 'react';
import { BellIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
	getNotifications,
	markNotificationRead,
	markAllNotificationsRead,
	dismissNotification,
} from '@/app/dashboard/actions/get-notifications';
import { authClient } from '@/lib/auth-client';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';

type Notification = {
	id: string;
	title: string;
	description: string;
	status: string;
	read: boolean;
	paperId: string | null;
	createdAt: Date | null;
};

const dotStyles: Record<string, string> = {
	success: 'bg-emerald-500',
	error: 'bg-destructive',
};

export function Notifications() {
	const { data: session } = authClient.useSession();
	const router = useRouter();

	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(true);
	const [mounted, setMounted] = useState(false);
	const [notifications, setNotifications] = useState<Notification[]>([]);

	async function fetchNotifications() {
		const result = await getNotifications();
		if (result.status === 'ok') {
			setNotifications(result.notifications);
		}
		setLoading(false);
	}

	useEffect(() => {
		if (!session) return;
		fetchNotifications();

		const interval = setInterval(fetchNotifications, 10000); // ✅ every 10s instead of 15s
		return () => clearInterval(interval);
	}, [session]);

	const unreadCount = notifications.filter((n) => !n.read).length;

	async function handleMarkAllRead() {
		setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
		await markAllNotificationsRead();
	}

	async function handleMarkRead(id: string, paperId?: string | null) {
		setNotifications((prev) =>
			prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
		);
		await markNotificationRead(id);
		if (paperId) {
			setOpen(false);
			router.push(`/dashboard/code/${paperId}`);
		}
	}

	async function handleDismiss(id: string) {
		setNotifications((prev) => prev.filter((n) => n.id !== id));
		await dismissNotification(id);
	}

	useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted) {
		return (
			<Button className='relative' size='sm' variant='outline'>
				<BellIcon className='h-4 w-4' />
			</Button>
		);
	}

	return (
		<Popover
			open={open}
			onOpenChange={(o) => {
				setOpen(o);
				if (o) fetchNotifications();
			}}
		>
			<PopoverTrigger asChild>
				<Button className='relative' size='sm' variant='outline'>
					<BellIcon className='h-4 w-4' />
					{unreadCount > 0 && (
						<Badge
							className='-top-1 -right-2 absolute z-10 h-5 min-w-5 rounded-full px-1 text-xs'
							variant={
								unreadCount > 5 ? 'destructive' : 'default'
							}
						>
							{unreadCount > 99 ? '99+' : unreadCount}
						</Badge>
					)}
				</Button>
			</PopoverTrigger>

			<PopoverContent align='end' sideOffset={8} className='w-80 p-0'>
				{/* Header */}
				<div className='flex items-center justify-between px-4 py-3 border-b'>
					<h3 className='text-sm font-semibold'>Notifications</h3>
					{unreadCount > 0 && (
						<button
							onClick={handleMarkAllRead}
							className='cursor-pointer text-xs text-muted-foreground hover:text-foreground transition-colors'
						>
							Mark all as read
						</button>
					)}
				</div>

				{/* List */}
				<ScrollArea className='max-h-80'>
					{loading ? (
						<div className='flex items-center justify-center py-10'>
							<p className='text-sm text-muted-foreground'>
								Loading...
							</p>
						</div>
					) : notifications.length === 0 ? (
						<div className='flex flex-col items-center justify-center py-10 text-center'>
							<BellIcon className='h-8 w-8 text-muted-foreground/30 mb-2' />
							<p className='text-sm text-muted-foreground'>
								No notifications
							</p>
						</div>
					) : (
						notifications.map((n) => (
							<div
								key={n.id}
								className={cn(
									'flex gap-3 px-4 py-3 border-b last:border-0 transition-colors hover:bg-muted/50',
									!n.read && 'bg-muted/30',
								)}
							>
								{/* Dot */}
								<div className='mt-1.5 shrink-0'>
									<div
										className={cn(
											'h-2 w-2 rounded-full',
											dotStyles[n.status] ?? 'bg-primary',
											n.read && 'opacity-30',
										)}
									/>
								</div>

								{/* Content — clickable area */}
								<button
									className='flex-1 space-y-0.5 text-left cursor-pointer'
									onClick={async () => {
										await handleMarkRead(n.id, n.paperId);
									}}
								>
									<p
										className={cn(
											'text-sm leading-snug',
											!n.read && 'font-medium',
										)}
									>
										{n.title}
									</p>
									<p className='text-xs text-muted-foreground leading-snug'>
										{n.description}
									</p>
									<p className='text-xs text-muted-foreground/60'>
										{n.createdAt
											? formatDistanceToNow(
													new Date(n.createdAt),
													{ addSuffix: true },
												)
											: ''}
									</p>
								</button>

								{/* Dismiss */}
								<button
									onClick={(e) => {
										e.stopPropagation();
										handleDismiss(n.id);
									}}
									className='shrink-0 text-muted-foreground/40 hover:text-muted-foreground transition-colors text-xs mt-0.5'
								>
									✕
								</button>
							</div>
						))
					)}
				</ScrollArea>
			</PopoverContent>
		</Popover>
	);
}
