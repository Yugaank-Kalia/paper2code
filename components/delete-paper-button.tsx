'use client';

import { Trash2 } from 'lucide-react';
import { deletePaper } from '@/app/dashboard/actions/delete-paper';
import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

type DeletePaperButtonProps = {
	paperId: string;
	paperTitle: string | null;
};

export function DeletePaperButton({
	paperId,
	paperTitle,
}: DeletePaperButtonProps) {
	return (
		<AlertDialog>
			<AlertDialogTrigger asChild>
				<Button
					type='button'
					variant='ghost'
					size='icon-sm'
					className='text-destructive/80 hover:text-destructive'
					aria-label={`Delete ${paperTitle || 'paper'}`}
				>
					<Trash2 className='h-4 w-4' />
				</Button>
			</AlertDialogTrigger>

			<AlertDialogContent size='sm'>
				<AlertDialogHeader>
					<AlertDialogTitle>Are you sure?</AlertDialogTitle>
					<AlertDialogDescription>
						This will permanently delete this paper and its local
						file.
					</AlertDialogDescription>
				</AlertDialogHeader>

				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<form action={deletePaper} className='w-full'>
						<input type='hidden' name='paperId' value={paperId} />
						<Button
							type='submit'
							variant='default'
							className='w-full bg-destructive text-destructive-foreground hover:bg-destructive/90 text-white'
						>
							Delete
						</Button>
					</form>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
