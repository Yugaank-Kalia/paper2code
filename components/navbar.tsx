'use client';

import { Code } from 'lucide-react';
import { useSession, signOut } from '@/lib/auth-client';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ThemeToggle } from './theme-toggle';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import UserButton from './user-button';

export function Navbar() {
	const { data: session, isPending } = useSession();
	const user = session?.user;
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	const ready = mounted && !isPending;

	return (
		<nav className='sticky top-0 z-50 border-b border-border/20 bg-background/50 backdrop-blur-md'>
			<div className='mx-auto max-w-6xl px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between'>
				<Link href='/'>
					<div className='flex items-center gap-2'>
						<Code className='h-6 w-6 text-primary' />
						<h1 className='text-xl font-bold'>Paper2Code</h1>
					</div>
				</Link>
				<div className='flex items-center gap-4'>
					<ThemeToggle />
					{!ready ? (
						<div className='flex items-center gap-3'>
							<Skeleton className='h-8 w-24 rounded-md' />
							<Skeleton className='h-8 w-8 rounded-full' />
						</div>
					) : user?.id ? (
						<>
							<Link href='/dashboard'>
								<Button
									className='cursor-pointer'
									variant='default'
									size='sm'
								>
									Dashboard
								</Button>
							</Link>
							<UserButton />
						</>
					) : (
						<div className='flex items-center gap-2'>
							<Link href='/sign-in'>
								<Button
									className='cursor-pointer'
									variant='ghost'
									size='sm'
								>
									Sign In
								</Button>
							</Link>
							<Link href='/sign-up'>
								<Button
									className='cursor-pointer'
									variant='outline'
									size='sm'
								>
									Sign Up
								</Button>
							</Link>
						</div>
					)}
				</div>
			</div>
		</nav>
	);
}
