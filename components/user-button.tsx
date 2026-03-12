'use client';

import { authClient } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { LogOut, Settings } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
		router.push('/sign-in');
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button className='rounded-full ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:opacity-80'>
					<Avatar className='h-10 w-10 cursor-pointer'>
						<AvatarImage
							src={user.image ?? ''}
							alt={user.name ?? 'User'}
						/>
						<AvatarFallback className='text-xs font-medium'>
							{initials}
						</AvatarFallback>
					</Avatar>
				</button>
			</DropdownMenuTrigger>

			<DropdownMenuContent
				align='end'
				sideOffset={8}
				className='w-56 animate-in fade-in-0 zoom-in-95'
			>
				<DropdownMenuLabel className='font-normal'>
					<div className='flex flex-col space-y-1'>
						<p className='text-sm font-medium leading-none'>
							{user.name}
						</p>
						<p className='text-xs leading-none text-muted-foreground truncate'>
							{user.email}
						</p>
					</div>
				</DropdownMenuLabel>

				<DropdownMenuSeparator />

				<DropdownMenuItem
					className='cursor-pointer'
					onClick={() => router.push('/settings')}
				>
					<Settings className='mr-2 h-4 w-4' />
					Settings
				</DropdownMenuItem>

				<DropdownMenuSeparator />

				<DropdownMenuItem
					className='cursor-pointer text-destructive focus:text-destructive'
					onClick={handleSignOut}
				>
					<LogOut className='mr-2 h-4 w-4' />
					Sign out
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
