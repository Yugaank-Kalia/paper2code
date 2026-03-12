'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

const errorMessages: Record<string, { title: string; description: string }> = {
	"email_doesn't_match": {
		title: 'Email Mismatch',
		description:
			'The email on your OAuth account does not match the email registered here. Please sign in with your original method or use a matching OAuth account.',
	},
	oauth_account_not_linked: {
		title: 'Account Not Linked',
		description:
			'This OAuth account is not linked to any existing account. Please sign in with your email and password first, then link your account from Settings.',
	},
	account_not_found: {
		title: 'Account Not Found',
		description: 'No account found. Please sign up first.',
	},
	default: {
		title: 'Something went wrong',
		description: 'An unexpected error occurred. Please try again.',
	},
};

export default function AuthErrorPage() {
	const searchParams = useSearchParams();
	const router = useRouter();

	const errorCode = searchParams.get('error') ?? 'default';
	const { title, description } =
		errorMessages[errorCode] ?? errorMessages.default;

	return (
		<div className='flex min-h-screen items-center justify-center px-4'>
			<div className='max-w-md w-full space-y-6 text-center'>
				<div className='flex justify-center'>
					<AlertCircle className='h-12 w-12 text-destructive' />
				</div>

				<div className='space-y-2'>
					<h1 className='text-2xl font-bold'>{title}</h1>
					<p className='text-muted-foreground text-sm'>
						{description}
					</p>
					<p className='text-xs text-muted-foreground/60 font-mono'>
						code: {errorCode}
					</p>
				</div>

				<div className='flex flex-col gap-2'>
					<Button onClick={() => router.push('/sign-in')}>
						Back to Sign In
					</Button>
					<Button
						variant='ghost'
						onClick={() => router.push('/settings')}
					>
						Go to Settings
					</Button>
				</div>
			</div>
		</div>
	);
}
