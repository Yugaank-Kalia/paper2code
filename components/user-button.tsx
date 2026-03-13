'use client';

import { authClient } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { LogOut, Settings, ChevronDown } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { useState } from 'react';

export default function UserButton() {
	const { data: session, isPending } = authClient.useSession();
	const router = useRouter();

	if (isPending) return null;
	if (!session) return null;

	const user = session.user;
	const initials = user.name
		? user.name
				.split(' ')
				.map((n) => n[0])
				.join('')
				.toUpperCase()
				.slice(0, 2)
		: user.email.charAt(0).toUpperCase();

	async function handleSignOut() {
		await authClient.signOut();
		router.push('/');
	}

	const [open, setOpen] = useState(false);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild className='cursor-pointer'>
				<button className='flex items-center gap-1.5 rounded-full pl-1 pr-2 py-1 hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'>
					<Avatar className='h-10 w-10'>
						<AvatarImage
							src={user.image ?? undefined}
							alt={user.name ?? 'User'}
						/>
						<AvatarFallback className='text-[10px] font-medium'>
							{initials}
						</AvatarFallback>
					</Avatar>
					<span className='text-xs font-medium max-w-20 truncate hidden sm:block'>
						{user.name?.split(' ')[0] ?? user.email}
					</span>
					<ChevronDown className='h-3 w-3 text-muted-foreground hidden sm:block' />
				</button>
			</PopoverTrigger>

			<PopoverContent align='end' sideOffset={6} className='w-52 p-0'>
				{/* User info */}
				<div className='flex items-center gap-2.5 px-3 py-2.5'>
					<Avatar className='h-8 w-8 shrink-0'>
						<AvatarImage
							src={user.image ?? undefined}
							alt={user.name ?? 'User'}
						/>
						<AvatarFallback className='text-sm font-medium'>
							{initials}
						</AvatarFallback>
					</Avatar>
					<div className='flex flex-col min-w-0'>
						<p className='text-sm font-semibold leading-none truncate'>
							{user.name}
						</p>
						<p className='text-xs text-muted-foreground truncate mt-0.5'>
							{user.email}
						</p>
					</div>
				</div>

				<Separator />

				<div className='p-1'>
					<button
						onClick={() => {
							router.push('/settings');
							setOpen(false);
						}}
						className='cursor-pointer flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs hover:bg-muted transition-colors text-left'
					>
						<Settings className='h-3.5 w-3.5 text-muted-foreground' />
						<span className='text-accent-foreground text-sm'>
							Settings
						</span>
					</button>
					<button
						onClick={handleSignOut}
						className='cursor-pointer flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs hover:bg-destructive/10 text-destructive transition-colors text-left'
					>
						<LogOut className='h-3.5 w-3.5' />
						<span className='text-destructive text-sm'>
							Sign out
						</span>
					</button>
				</div>
			</PopoverContent>
		</Popover>
	);
}
