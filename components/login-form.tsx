'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import {
	Field,
	FieldDescription,
	FieldGroup,
	FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { authClient } from '@/lib/auth-client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export function LoginForm({
	className,
	...props
}: React.ComponentProps<'div'>) {
	const router = useRouter();
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setError(null);
		setLoading(true);

		const fd = new FormData(e.currentTarget);

		const { error } = await authClient.signIn.email({
			email: fd.get('email') as string,
			password: fd.get('password') as string,
			callbackURL: '/dashboard',
		});

		if (error) {
			setError(error.message ?? 'Invalid email or password');
			setLoading(false);
			return;
		}

		router.push('/dashboard');
	}

	return (
		<div className={cn('flex flex-col gap-6', className)} {...props}>
			<Card>
				<CardHeader>
					<CardTitle>Login to your account</CardTitle>
					<CardDescription>
						Enter your email below to login to your account
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit}>
						<FieldGroup>
							<Field>
								<FieldLabel htmlFor='email'>Email</FieldLabel>
								<Input
									id='email'
									name='email'
									type='email'
									placeholder='m@example.com'
									required
								/>
							</Field>
							<Field>
								<div className='flex items-center'>
									<FieldLabel htmlFor='password'>
										Password
									</FieldLabel>
									<a
										href='#'
										className='ml-auto inline-block text-sm underline-offset-4 hover:underline'
									>
										Forgot your password?
									</a>
								</div>
								<Input
									id='password'
									name='password'
									type='password'
									required
								/>
							</Field>

							{error && (
								<p className='text-sm text-destructive'>
									{error}
								</p>
							)}

							<Field>
								<Button
									type='submit'
									className='w-full cursor-pointer'
									disabled={loading}
								>
									{loading ? (
										<Loader2 className='h-4 w-4 animate-spin' />
									) : (
										'Login'
									)}
								</Button>

								<div className='relative my-2'>
									<div className='absolute inset-0 flex items-center'>
										<span className='w-full border-t' />
									</div>
									<div className='relative flex justify-center text-xs uppercase'>
										<span className='bg-background px-2 text-muted-foreground'>
											or continue with
										</span>
									</div>
								</div>

								<div className='flex flex-col gap-2'>
									<Button variant='outline'>
										<img
											src='https://cdn.shadcnstudio.com/ss-assets/brand-logo/google-icon.png?width=20&height=20&format=auto'
											alt='Google Icon'
											className='size-5'
										/>
										<span className='flex flex-1 justify-center'>
											Continue with Google
										</span>
									</Button>
									<Button
										variant='outline'
										className='border-black text-black dark:text-white'
										onClick={() =>
											authClient.signIn.social({
												provider: 'github',
												callbackURL: '/dashboard',
											})
										}
									>
										<img
											src='https://cdn.shadcnstudio.com/ss-assets/brand-logo/github-icon.png?width=20&height=20&format=auto'
											alt='GitHub Icon'
											className='size-5 dark:invert'
										/>
										<span className='flex flex-1 justify-center'>
											Continue with GitHub
										</span>
									</Button>
								</div>

								<FieldDescription className='text-center'>
									Don&apos;t have an account?{' '}
									<a
										href='/sign-up'
										className='underline-offset-4 hover:underline'
									>
										Sign up
									</a>
								</FieldDescription>
							</Field>
						</FieldGroup>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
