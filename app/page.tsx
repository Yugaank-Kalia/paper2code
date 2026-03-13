import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { db } from '@/index';
import { generatedCode } from '@/src/db/schema';
import { sql } from 'drizzle-orm';
import { Navbar } from '@/components/navbar';
import { Button } from '@/components/ui/button';
import { UploadPaperDialog } from '@/components/upload-paper-dialog';
import { DemoVideoDialog } from '@/components/demo-video-dialog';
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import {
	BookOpenIcon,
	CodeIcon,
	SparklesIcon,
	ArrowRight,
	BookTextIcon,
} from 'lucide-react';

export default async function Page() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	const userId = session?.user.id;
	if (userId) {
		redirect('/dashboard');
	}

	const [{ count }] = await db
		.select({ count: sql<number>`cast(count(*) as integer)` })
		.from(generatedCode);

	const [{ totalLines }] = await db
		.execute<{ total_lines: number }>(
			sql`
		SELECT COALESCE(SUM(
			COALESCE(array_length(string_to_array(block->>'code', E'\n'), 1), 0)
		), 0)::integer AS total_lines
		FROM "code" c,
		jsonb_array_elements(c.code_blocks) AS block
	`,
		)
		.then((rows) => [{ totalLines: rows[0]?.total_lines ?? 0 }]);

	return (
		<div className='min-h-screen bg-background bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px]'>
			{/* Hero Section */}
			<section className='relative px-4 py-20 sm:px-6 lg:px-8'>
				<div className='mx-auto max-w-4xl text-center'>
					<h1 className='mb-6 text-5xl font-bold tracking-tight sm:text-6xl'>
						Turn Academic Papers Into Production Code
					</h1>

					<p className='mb-8 text-xl text-muted-foreground tracking-tight'>
						Automatically convert Computer Science, Math and Machine
						Learning papers into clean, executable code. Bridge the
						gap between research and implementation.
					</p>

					<div className='flex flex-col gap-4 sm:flex-row sm:justify-center'>
						<UploadPaperDialog text='Get Started' />
						<DemoVideoDialog />
					</div>
				</div>

				{/* Decorative element */}
				<div className='absolute inset-0 -z-10 overflow-hidden'>
					<div className='absolute h-96 w-96 bg-primary/5 blur-3xl rounded-full -top-20 -left-20' />
					<div className='absolute h-96 w-96 bg-purple-500/5 blur-3xl rounded-full -bottom-20 -right-20' />
				</div>
			</section>

			{/* Features Section */}
			<section className='px-4 py-20 sm:px-6 lg:px-8'>
				<div className='mx-auto max-w-6xl'>
					<div className='text-center mb-16'>
						<h2 className='text-3xl font-bold mb-4'>
							Powerful Features
						</h2>
						<p className='text-muted-foreground'>
							Everything you need to convert papers to
							production-ready code
						</p>
					</div>

					<div className='grid md:grid-cols-2 gap-6'>
						{[
							{
								icon: BookOpenIcon,
								title: 'Multi-Format Support',
								description:
									'Upload PDFs, arXiv links, or paste text from any academic paper',
							},
							{
								icon: CodeIcon,
								title: 'Multiple Languages',
								description:
									'Generate code in Python, PyTorch, TensorFlow, JavaScript, and more',
							},
							{
								icon: SparklesIcon,
								title: 'Smart Optimization',
								description:
									'Converts mathematical notation to optimized, production-ready algorithms',
							},
							{
								icon: BookTextIcon,
								title: 'With Documentation',
								description:
									'Auto-generated comments and docstrings explaining every step',
							},
							// {
							//   icon: ArrowRight,
							//   title: "Easy Integration",
							//   description:
							//     "Copy, download, or push directly to your repository",
							// },
						].map((feature, idx) => {
							const Icon = feature.icon;
							return (
								<Card key={idx}>
									<CardHeader>
										<Icon className='h-8 w-8 text-primary mb-2' />
										<CardTitle>{feature.title}</CardTitle>
										<CardDescription>
											{feature.description}
										</CardDescription>
									</CardHeader>
								</Card>
							);
						})}
					</div>
				</div>
			</section>

			{/* How It Works */}
			<section className='px-4 py-20 sm:px-6 lg:px-8'>
				<div className='mx-auto max-w-6xl'>
					<h2 className='text-3xl font-bold mb-16 text-center'>
						How It Works
					</h2>

					<div className='space-y-6'>
						{[
							{
								step: 1,
								title: 'Upload Your Paper',
								description:
									'Share the research paper in PDF format or paste the arXiv link',
							},
							{
								step: 2,
								title: 'AI Analyzes Content',
								description:
									'Our AI extracts algorithms, mathematical formulas, and methodology',
							},
							{
								step: 3,
								title: 'Generate Code',
								description:
									'Convert the research into clean, documented, production-ready code',
							},
							{
								step: 4,
								title: 'Review & Deploy',
								description:
									'Review the generated code and deploy immediately to your project',
							},
						].map((item) => (
							<Card key={item.step} className='overflow-visible'>
								<CardHeader>
									<div className='flex gap-6'>
										<div className='shrink-0'>
											<div className='flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold'>
												{item.step}
											</div>
										</div>
										<div className='flex-1'>
											<CardTitle className='mb-2'>
												{item.title}
											</CardTitle>
											<CardDescription>
												{item.description}
											</CardDescription>
										</div>
									</div>
								</CardHeader>
							</Card>
						))}
					</div>
				</div>
			</section>

			{/* Stats Section */}
			<section className='px-4 py-20 sm:px-6 lg:px-8'>
				<div className='mx-auto max-w-6xl'>
					<div className='grid md:grid-cols-3 gap-8'>
						<Card>
							<CardHeader className='text-center'>
								<CardTitle className='text-4xl text-primary mb-2'>
									{count}+
								</CardTitle>
								<CardDescription>
									Papers Converted
								</CardDescription>
							</CardHeader>
						</Card>
						<Card>
							<CardHeader className='text-center'>
								<CardTitle className='text-4xl text-primary mb-2'>
									{totalLines >= 1_000_000
										? `${(totalLines / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
										: totalLines >= 1_000
											? `${(totalLines / 1_000).toFixed(1).replace(/\.0$/, '')}K`
											: totalLines}
									+
								</CardTitle>
								<CardDescription>
									Lines of Code Generated
								</CardDescription>
							</CardHeader>
						</Card>
						<Card>
							<CardHeader className='text-center'>
								<CardTitle className='text-4xl text-primary mb-2'>
									1-2 mins
								</CardTitle>
								<CardDescription>
									Average Generation Time
								</CardDescription>
							</CardHeader>
						</Card>
					</div>
				</div>
			</section>

			{/* CTA Section */}
			<section className='px-4 py-20 sm:px-6 lg:px-8'>
				<div className='mx-auto max-w-6xl'>
					<Card className='border-border max-w-6xl py-20'>
						<CardHeader className='text-center'>
							<CardTitle className='text-3xl mb-4'>
								Ready to Transform Your Research?
							</CardTitle>
							<CardDescription className='text-lg mb-8'>
								Start converting papers to code today. No credit
								card required.
							</CardDescription>
							<div className='w-fit mx-auto'>
								<UploadPaperDialog text='Start Free Trial' />
							</div>
						</CardHeader>
					</Card>
				</div>
			</section>

			{/* Footer */}
			<footer className='border-t border-border/40 px-4 py-12 sm:px-6 lg:px-8'>
				<div className='mx-auto max-w-6xl text-center text-sm text-muted-foreground'>
					<p>© 2026 Paper2Code. Turning research into reality.</p>
				</div>
			</footer>
		</div>
	);
}
