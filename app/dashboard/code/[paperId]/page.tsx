import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { CodeBlocksView } from '@/components/code-blocks-view';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { getGeneratedCode } from '@/app/dashboard/actions/generate-code';
import { db } from '@/index';
import { papers } from '@/src/db/schema';
import { eq, and } from 'drizzle-orm';

export default async function CodePage({
	params,
}: {
	params: Promise<{ paperId: string }>;
}) {
	const { paperId } = await params;
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session) redirect('/sign-in');
	const userId = session.user.id;

	const [cached, paperRow] = await Promise.all([
		getGeneratedCode(paperId),
		db
			.select({ title: papers.title, source: papers.source })
			.from(papers)
			.where(and(eq(papers.id, paperId), eq(papers.userId, userId)))
			.limit(1),
	]);

	const initialBlocks = cached.status === 'ok' ? cached.codeBlocks : null;
	const title =
		paperRow[0]?.title === '' ? paperRow[0].source : paperRow[0]?.title;

	return (
		<div className='min-h-[calc(100vh-65px)] bg-background bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px]'>
			<div className='pointer-events-none fixed inset-0 -z-10 overflow-hidden'>
				<div className='absolute h-125 w-125 bg-primary/5 blur-[120px] rounded-full -top-40 -right-40' />
				<div className='absolute h-100 w-100 bg-purple-500/5 blur-[100px] rounded-full bottom-0 -left-40' />
			</div>

			<div className='max-w-6xl mx-auto px-4 py-6 sm:px-6 lg:px-8'>
				<div className='mb-8 flex items-center justify-between'>
					<Link href='/dashboard'>
						<Button
							variant='ghost'
							size='sm'
							className='gap-2 text-muted-foreground hover:text-foreground cursor-pointer'
						>
							<ArrowLeft className='h-4 w-4' />
							Back
						</Button>
					</Link>
				</div>

				<div className='mb-8'>
					<h1 className='text-3xl font-bold tracking-tight'>
						Generated Code
					</h1>
					<h1 className='text-xl font-bold tracking-tight mt-1 text-muted-foreground'>
						{title}
					</h1>
				</div>

				<CodeBlocksView
					paperId={paperId}
					initialBlocks={initialBlocks}
				/>
			</div>
		</div>
	);
}
