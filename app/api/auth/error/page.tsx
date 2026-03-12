import { Suspense } from 'react';
import AuthErrorContent from './error-content';

export default function AuthErrorPage() {
	return (
		<Suspense
			fallback={
				<div className='flex min-h-screen items-center justify-center'>
					<div className='h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent' />
				</div>
			}
		>
			<AuthErrorContent />
		</Suspense>
	);
}
