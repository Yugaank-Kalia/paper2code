'use client';

import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';

export function DemoVideoDialog() {
	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button size='lg' variant='outline'>
					View Demo
				</Button>
			</DialogTrigger>
			<DialogContent className='w-full sm:max-w-3xl md:max-w-6xl p-0 overflow-hidden'>
				<DialogHeader className='sr-only'>
					<DialogTitle>Demo</DialogTitle>
				</DialogHeader>
				<video
					src='/demo.mp4'
					controls
					autoPlay
					className='w-full aspect-video bg-black'
				/>
			</DialogContent>
		</Dialog>
	);
}
