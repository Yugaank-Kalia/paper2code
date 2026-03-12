// components/notifications.tsx
'use client';

import { useState } from 'react';
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

type Notification = {
	id: string;
	title: string;
	description: string;
	time: string;
	read: boolean;
	type: 'success' | 'error' | 'info';
};

const DEMO_NOTIFICATIONS: Notification[] = [
	{
		id: '1',
		title: 'Code generation complete',
		description: 'Attention Is All You Need — 6 code blocks generated.',
		time: '2 min ago',
		read: false,
		type: 'success',
	},
	{
		id: '2',
		title: 'Code generation complete',
		description:
			'ResNet: Deep Residual Learning — 4 code blocks generated.',
		time: '1 hour ago',
		read: false,
		type: 'success',
	},
	{
		id: '3',
		title: 'Generation failed',
		description:
			'GPT-4 Technical Report — could not extract algorithms. Try re-uploading.',
		time: '3 hours ago',
		read: true,
		type: 'error',
	},
];

const dotStyles = {
	success: 'bg-green-500',
	error: 'bg-destructive',
	info: 'bg-primary',
};

export function Notifications() {
	const [notifications, setNotifications] =
		useState<Notification[]>(DEMO_NOTIFICATIONS);

	const unreadCount = notifications.filter((n) => !n.read).length;

	function markAllRead() {
		setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
	}

	function markRead(id: string) {
		setNotifications((prev) =>
			prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
		);
	}

	function dismiss(id: string) {
		setNotifications((prev) => prev.filter((n) => n.id !== id));
	}

	return (
		<Popover>
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
							onClick={markAllRead}
							className='cursor-pointer text-xs text-muted-foreground hover:text-foreground transition-colors'
						>
							Mark all as read
						</button>
					)}
				</div>

				{/* List */}
				<ScrollArea className='max-h-80'>
					{notifications.length === 0 ? (
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
								onClick={() => markRead(n.id)}
								className={cn(
									'flex gap-3 px-4 py-3 border-b last:border-0 cursor-pointer transition-colors hover:bg-muted/50',
									!n.read && 'bg-muted/30',
								)}
							>
								{/* Dot */}
								<div className='mt-1.5 shrink-0'>
									<div
										className={cn(
											'h-2 w-2 rounded-full',
											dotStyles[n.type],
											n.read && 'opacity-30',
										)}
									/>
								</div>

								{/* Content */}
								<div className='flex-1 space-y-0.5'>
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
										{n.time}
									</p>
								</div>

								{/* Dismiss */}
								<button
									onClick={(e) => {
										e.stopPropagation();
										dismiss(n.id);
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
