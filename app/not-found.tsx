import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/navbar';
import { FileQuestion, ArrowLeft, Home } from 'lucide-react';

export default function NotFound() {
	return (
		<>
			<div className='min-h-[calc(100vh-65px)] flex items-center justify-center bg-background bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px]'>
				{/* Decorative gradient blobs */}
				<div className='pointer-events-none fixed inset-0 -z-10 overflow-hidden'>
					<div className='absolute h-125 w-125 bg-primary/5 blur-[120px] rounded-full -top-40 left-1/4' />
					<div className='absolute h-100 w-100 bg-purple-500/5 blur-[100px] rounded-full bottom-0 right-1/4' />
				</div>

				<div className='flex flex-col items-center text-center px-4 max-w-md'>
					{/* Icon */}
					<div className='relative mb-8'>
						<div className='flex h-24 w-24 items-center justify-center rounded-2xl bg-muted/50 border border-border/50'>
							<FileQuestion className='h-12 w-12 text-muted-foreground/40' />
						</div>
						<div className='absolute -top-2 -right-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm'>
							404
						</div>
					</div>

					{/* Text */}
					<h1 className='text-3xl font-bold tracking-tight mb-3'>
						Page not found
					</h1>
					<p className='text-muted-foreground mb-8 leading-relaxed'>
						The page you&apos;re looking for doesn&apos;t exist or
						has been moved. Check the URL or head back to familiar
						ground.
					</p>

					{/* Actions */}
					<div className='flex gap-3'>
						<Link href='/'>
							<Button
								variant='outline'
								className='gap-2 cursor-pointer'
							>
								<Home className='h-4 w-4' />
								Home
							</Button>
						</Link>
						<Link href='/dashboard'>
							<Button className='gap-2 cursor-pointer'>
								<ArrowLeft className='h-4 w-4' />
								Dashboard
							</Button>
						</Link>
					</div>
				</div>
			</div>
		</>
	);
}
