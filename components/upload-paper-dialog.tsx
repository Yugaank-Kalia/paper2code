'use client';

import { useState } from 'react';
import { useSession, signOut } from '@/lib/auth-client';
import { toast } from 'sonner';
import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowRight, LoaderCircle, Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { uploadPaper } from '@/app/dashboard/actions/upload-paper';
import { uploadArxiv } from '@/app/dashboard/actions/upload-arxiv';

type Mode = 'file' | 'arxiv';

export function UploadPaperDialog({ text }: { text: string }) {
	const { data: session, isPending } = useSession();
	const user = session?.user;

	const [isOpen, setIsOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [fileName, setFileName] = useState<string>('');
	const [fileTitle, setFileTitle] = useState<string>('');
	const [mode, setMode] = useState<Mode>('file');
	const [arxivInput, setArxivInput] = useState('');
	const [arxivTitle, setArxivTitle] = useState('');

	const router = useRouter();

	const handleGetStartedClick = () => {
		if (isPending) return;
		if (!user?.id) {
			router.push('/sign-up');
			return;
		}
		setFileName('');
		setFileTitle('');
		setArxivInput('');
		setArxivTitle('');
		setMode('file');
		setIsOpen(true);
	};

	const handleOpenChange = (open: boolean) => {
		setIsOpen(open);
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		e.preventDefault();
		const file = e.target.files?.[0];
		if (file) {
			setFileName(file.name);
		}
	};

	const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);
		const file = formData.get('paper') as File;

		if (!file) {
			toast.error('Please select a file');
			return;
		}

		setIsLoading(true);

		try {
			const uploadFormData = new FormData();
			uploadFormData.append('file', file);
			uploadFormData.append('title', fileTitle.trim());

			const result = await uploadPaper(uploadFormData);

			if (result.status === 'unauthorized') {
				router.push('/sign-up');
				return;
			}

			if (result.status === 'error') {
				toast.error('Upload failed', { description: result.message });
				setFileName('');
				return;
			}

			setIsOpen(false);
			setFileName('');
			setFileTitle('');
			router.push(`/dashboard`);
			toast.success('Paper uploaded successfully!', {
				description: `${result.originalName} (${(result.size / 1024 / 1024).toFixed(2)} MB)`,
			});
			router.refresh();
		} catch (error) {
			console.error('Upload error:', error);
			toast.error('Failed to upload paper', {
				description: 'Please try again or contact support',
			});
		} finally {
			setIsLoading(false);
		}
	};

	const handleArxivSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!arxivInput.trim()) {
			toast.error('Please enter an arXiv URL or ID');
			return;
		}

		setIsLoading(true);

		try {
			const result = await uploadArxiv(arxivInput, arxivTitle);

			if (result.status === 'unauthorized') {
				router.push('/sign-up');
				return;
			}

			if (result.status === 'error') {
				toast.error('Import failed', { description: result.message });
				return;
			}

			setIsOpen(false);
			setArxivInput('');
			setArxivTitle('');
			router.push(`/dashboard`);
			toast.success('arXiv paper imported!', {
				description: result.title,
			});
			router.refresh();
		} catch (error) {
			console.error('arXiv import error:', error);
			toast.error('Failed to import arXiv paper', {
				description: 'Please try again or contact support',
			});
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
			<Button size='lg' className='gap-2' onClick={handleGetStartedClick}>
				{text === 'Get Started' || text === 'Start Free Trial' ? (
					<>
						{text} <ArrowRight className='h-4 w-4' />
					</>
				) : (
					text
				)}
			</Button>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Upload Your Paper</AlertDialogTitle>
					<AlertDialogDescription>
						Select a PDF or research paper to convert into code
					</AlertDialogDescription>
				</AlertDialogHeader>

				{/* Mode toggle */}
				<div className='flex rounded-lg border border-border overflow-hidden text-sm'>
					<button
						type='button'
						onClick={() => setMode('file')}
						className={`flex-1 py-1.5 transition-colors ${
							mode === 'file'
								? 'bg-primary text-primary-foreground'
								: 'text-muted-foreground hover:text-foreground'
						}`}
					>
						File Upload
					</button>
					<button
						type='button'
						onClick={() => setMode('arxiv')}
						className={`flex-1 py-1.5 transition-colors ${
							mode === 'arxiv'
								? 'bg-primary text-primary-foreground'
								: 'text-muted-foreground hover:text-foreground'
						}`}
					>
						arXiv
					</button>
				</div>

				{mode === 'file' ? (
					<form onSubmit={handleUpload} className='space-y-4'>
						<div className='flex items-center justify-center w-full py-6'>
							<label
								htmlFor='paper-upload'
								className='flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-border rounded-lg cursor-pointer bg-muted/30 hover:bg-muted/50 transition'
							>
								{isLoading ? (
									<div className='flex h-full w-full flex-col items-center justify-center gap-2'>
										<LoaderCircle className='h-6 w-6 animate-spin text-primary' />
										<p className='text-sm text-muted-foreground'>
											Uploading...
										</p>
									</div>
								) : (
									<>
										<div className='flex flex-col items-center justify-center pt-5 pb-6'>
											<Upload className='h-8 w-8 text-muted-foreground mb-2' />
											<p className='text-sm text-muted-foreground'>
												{fileName
													? 'File selected'
													: 'Click to upload or drag and drop'}
											</p>
											{fileName && (
												<p className='text-xs text-primary mt-1 max-w-50 truncate text-center'>
													{fileName}
												</p>
											)}
										</div>

										<Input
											id='paper-upload'
											name='paper'
											type='file'
											accept='.pdf,.txt,.md'
											onChange={handleFileChange}
											className='hidden'
											disabled={isLoading}
										/>
									</>
								)}
							</label>
						</div>

						<div className='space-y-1.5'>
							<p className='text-sm text-muted-foreground'>
								Title{' '}
								<span className='opacity-50'>(optional)</span>
							</p>
							<Input
								type='text'
								placeholder='e.g. Attention Is All You Need'
								value={fileTitle}
								onChange={(e) => setFileTitle(e.target.value)}
								disabled={isLoading}
							/>
						</div>

						<div className='flex gap-2 justify-end pt-4'>
							<AlertDialogCancel asChild>
								<Button disabled={isLoading} variant='outline'>
									Cancel
								</Button>
							</AlertDialogCancel>
							<Button
								type='submit'
								disabled={isLoading || !fileName}
							>
								{isLoading ? 'Uploading...' : 'Upload Paper'}
							</Button>
						</div>
					</form>
				) : (
					<form onSubmit={handleArxivSubmit} className='space-y-4'>
						<div className='space-y-3 py-4'>
							<div className='space-y-1.5'>
								<p className='text-sm text-muted-foreground'>
									arXiv URL or paper ID
								</p>
								<Input
									type='text'
									placeholder='e.g. 2301.00001 or https://arxiv.org/abs/2301.00001'
									value={arxivInput}
									onChange={(e) =>
										setArxivInput(e.target.value)
									}
									disabled={isLoading}
								/>
							</div>
							<div className='space-y-1.5'>
								<p className='text-sm text-muted-foreground'>
									Title{' '}
									<span className='opacity-50'>
										(optional)
									</span>
								</p>
								<Input
									type='text'
									placeholder='e.g. Attention Is All You Need'
									value={arxivTitle}
									onChange={(e) =>
										setArxivTitle(e.target.value)
									}
									disabled={isLoading}
								/>
							</div>
						</div>

						<div className='flex gap-2 justify-end pt-4'>
							<AlertDialogCancel asChild>
								<Button disabled={isLoading} variant='outline'>
									Cancel
								</Button>
							</AlertDialogCancel>
							<Button
								type='submit'
								disabled={isLoading || !arxivInput.trim()}
							>
								{isLoading ? (
									<>
										<LoaderCircle className='h-4 w-4 animate-spin mr-1' />{' '}
										Importing...
									</>
								) : (
									'Import Paper'
								)}
							</Button>
						</div>
					</form>
				)}
			</AlertDialogContent>
		</AlertDialog>
	);
}
