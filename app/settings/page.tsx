'use client';

import { authClient } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import {
	Github,
	Loader2,
	Chrome,
	Trash2,
	Eye,
	EyeOff,
	ArrowLeft,
	LinkIcon,
} from 'lucide-react';
import { updateProfile } from '@/app/settings/actions/profile-settings';

import { z } from 'zod';

const passwordSchema = z
	.object({
		currentPassword: z.string().min(1, 'Current password is required'),
		newPassword: z
			.string()
			.min(8, 'Password must be at least 8 characters')
			.regex(/[A-Z]/, 'Must contain at least one uppercase letter')
			.regex(/[0-9]/, 'Must contain at least one number')
			.regex(
				/[^a-zA-Z0-9]/,
				'Must contain at least one special character',
			),
		confirmPassword: z.string(),
	})
	.refine((data) => data.newPassword === data.confirmPassword, {
		message: 'Passwords do not match',
		path: ['confirmPassword'],
	});

export default function SettingsPage() {
	const { data: session, isPending } = authClient.useSession();
	const router = useRouter();

	// Profile
	const [name, setName] = useState('');
	const [imageUrl, setImageUrl] = useState('');
	const [profileLoading, setProfileLoading] = useState(false);

	// Account
	const [currentPassword, setCurrentPassword] = useState('');
	const [newPassword, setNewPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [passwordLoading, setPasswordLoading] = useState(false);

	const [showCurrentPassword, setShowCurrentPassword] = useState(false);
	const [showNewPassword, setShowNewPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);

	// Danger
	const [deleteLoading, setDeleteLoading] = useState(false);

	useEffect(() => {
		if (!isPending && !session) {
			router.push('/');
		}
	}, [isPending, session, router]);

	if (isPending) {
		return (
			<div className='flex h-screen items-center justify-center'>
				<Loader2 className='h-12 w-12 animate-spin text-primary' />
			</div>
		);
	}

	if (!session) return null;

	const user = session.user;
	const initials = user.name
		? user.name
				.split(' ')
				.map((n) => n[0])
				.join('')
				.toUpperCase()
				.slice(0, 2)
		: user.email.charAt(0).toUpperCase();

	// ── Profile ──────────────────────────────────────────────
	async function handleUpdateProfile(e: React.FormEvent) {
		e.preventDefault();
		if (!name && !imageUrl) {
			toast.error('No changes provided');
			return;
		}
		setProfileLoading(true);

		const formData = new FormData();
		if (name) formData.append('name', name);
		if (imageUrl) formData.append('image', imageUrl);

		const result = await updateProfile(formData);

		if (result.status === 'unauthorized') {
			router.push('/sign-in');
			return;
		}
		if (result.status === 'error') {
			toast.error(result.message);
			setProfileLoading(false);
			return;
		}

		toast.success('Profile updated');
		setName(name);
		setImageUrl(imageUrl);
		setProfileLoading(false);
	}

	// ── Password ──────────────────────────────────────────────
	async function handleUpdatePassword(e: React.FormEvent) {
		e.preventDefault();

		const result = passwordSchema.safeParse({
			currentPassword,
			newPassword,
			confirmPassword,
		});

		if (!result.success) {
			const firstError = result.error.issues[0];
			toast.error(firstError.message);
			return;
		}

		setPasswordLoading(true);
		const { error } = await authClient.changePassword({
			currentPassword,
			newPassword,
			revokeOtherSessions: true,
		});

		if (error) {
			toast.error(error.message ?? 'Failed to update password');
		} else {
			toast.success('Password updated');
			setCurrentPassword('');
			setNewPassword('');
			setConfirmPassword('');
		}
		setPasswordLoading(false);
	}

	// ── Delete Account ────────────────────────────────────────
	async function handleDeleteAccount() {
		setDeleteLoading(true);
		const { error } = await authClient.deleteUser();
		if (error) {
			toast.error(error.message ?? 'Failed to delete account');
			setDeleteLoading(false);
		} else {
			toast.success('Account deleted');
			router.push('/');
		}
	}

	return (
		<div className='mx-auto max-w-2xl px-4 py-12 space-y-8'>
			<Button
				variant='ghost'
				className='mb-2 -ml-2 gap-1 text-muted-foreground'
				onClick={() => router.push('/dashboard')}
			>
				<ArrowLeft className='h-4 w-4' />
				Back
			</Button>
			<div>
				<h1 className='text-2xl font-bold'>Settings</h1>
				<p className='text-muted-foreground text-sm mt-1'>
					Manage your account settings and preferences
				</p>
			</div>

			<Separator />

			{/* ── Profile ── */}
			<Card>
				<CardHeader>
					<CardTitle>Profile</CardTitle>
					<CardDescription>
						Update your name and avatar
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleUpdateProfile} className='space-y-4'>
						<div className='flex items-center gap-4'>
							<Avatar className='h-16 w-16'>
								<AvatarImage
									src={imageUrl || user.image || undefined}
								/>
								<AvatarFallback className='text-lg'>
									{initials}
								</AvatarFallback>
							</Avatar>
							<div className='flex-1 space-y-1'>
								<Label htmlFor='imageUrl'>Avatar URL</Label>
								<Input
									id='imageUrl'
									placeholder={user.image || 'https://...'}
									value={imageUrl}
									onChange={(e) =>
										setImageUrl(e.target.value)
									}
								/>
							</div>
						</div>
						<div className='space-y-1'>
							<Label htmlFor='name'>Display Name</Label>
							<Input
								id='name'
								placeholder={user.name || 'Your name'}
								value={name}
								onChange={(e) => setName(e.target.value)}
							/>
						</div>
						<Button
							type='submit'
							disabled={profileLoading || (!name && !imageUrl)}
						>
							{profileLoading ? (
								<Loader2 className='h-4 w-4 animate-spin' />
							) : (
								'Save Changes'
							)}
						</Button>
					</form>
				</CardContent>
			</Card>

			{/* ── Account ── */}
			<Card>
				<CardHeader>
					<CardTitle>Account</CardTitle>
					<CardDescription>Update your password</CardDescription>
				</CardHeader>
				<CardContent className='space-y-6'>
					{/* Email */}
					<div className='space-y-1 cursor-not-allowed'>
						<Label htmlFor='currentEmail'>Current Email</Label>
						<Input id='currentEmail' value={user.email} disabled />
					</div>
					<Separator />

					{/* Password */}
					<form onSubmit={handleUpdatePassword} className='space-y-3'>
						<div className='space-y-1'>
							<Label htmlFor='currentPassword'>
								Current Password
							</Label>
							<div className='relative'>
								<Input
									id='currentPassword'
									type={
										showCurrentPassword
											? 'text'
											: 'password'
									}
									value={currentPassword}
									onChange={(e) =>
										setCurrentPassword(e.target.value)
									}
									className='pr-10'
								/>
								<button
									type='button'
									onClick={() =>
										setShowCurrentPassword((v) => !v)
									}
									className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors'
								>
									{showCurrentPassword ? (
										<EyeOff className='h-4 w-4' />
									) : (
										<Eye className='h-4 w-4' />
									)}
								</button>
							</div>
						</div>

						<div className='space-y-1'>
							<Label htmlFor='newPassword'>New Password</Label>
							<div className='relative'>
								<Input
									id='newPassword'
									type={showNewPassword ? 'text' : 'password'}
									value={newPassword}
									onChange={(e) =>
										setNewPassword(e.target.value)
									}
									className='pr-10'
								/>
								<button
									type='button'
									onClick={() =>
										setShowNewPassword((v) => !v)
									}
									className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors'
								>
									{showNewPassword ? (
										<EyeOff className='h-4 w-4' />
									) : (
										<Eye className='h-4 w-4' />
									)}
								</button>
							</div>
						</div>

						<div className='space-y-1'>
							<Label htmlFor='confirmPassword'>
								Confirm New Password
							</Label>
							<div className='relative'>
								<Input
									id='confirmPassword'
									type={
										showConfirmPassword
											? 'text'
											: 'password'
									}
									value={confirmPassword}
									onChange={(e) =>
										setConfirmPassword(e.target.value)
									}
									className='pr-10'
								/>
								<button
									type='button'
									onClick={() =>
										setShowConfirmPassword((v) => !v)
									}
									className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors'
								>
									{showConfirmPassword ? (
										<EyeOff className='h-4 w-4' />
									) : (
										<Eye className='h-4 w-4' />
									)}
								</button>
							</div>
						</div>

						<Button
							type='button'
							variant='ghost'
							disabled={
								passwordLoading ||
								(!currentPassword &&
									!newPassword &&
									!confirmPassword)
							}
							onClick={() => {
								setCurrentPassword('');
								setNewPassword('');
								setConfirmPassword('');
								setShowCurrentPassword(false);
								setShowNewPassword(false);
								setShowConfirmPassword(false);
							}}
						>
							Reset
						</Button>
						<Button
							type='submit'
							variant='outline'
							disabled={
								passwordLoading ||
								!currentPassword ||
								!newPassword ||
								!confirmPassword
							}
						>
							{passwordLoading ? (
								<Loader2 className='h-4 w-4 animate-spin' />
							) : (
								'Update Password'
							)}
						</Button>
					</form>
				</CardContent>
			</Card>

			{/* ── Connected Accounts ── */}
			<Card>
				<CardHeader>
					<CardTitle>Connected Accounts</CardTitle>
					<CardDescription>
						Manage your linked OAuth providers
					</CardDescription>
				</CardHeader>
				<CardContent className='space-y-3'>
					<div className='flex items-center justify-between rounded-lg border p-3'>
						<div className='flex items-center gap-3'>
							<Chrome className='h-5 w-5' />
							<div>
								<p className='text-sm font-medium'>Google</p>
								<p className='text-xs text-muted-foreground'>
									Sign in with your Google account
								</p>
							</div>
						</div>
						<Button
							size='sm'
							variant='outline'
							onClick={() =>
								authClient.linkSocial({
									provider: 'google',
									callbackURL: '/settings',
								})
							}
						>
							<LinkIcon className='h-3 w-3 mr-1' />
							Connect
						</Button>
					</div>

					<div className='flex items-center justify-between rounded-lg border p-3'>
						<div className='flex items-center gap-3'>
							<Github className='h-5 w-5' />
							<div>
								<p className='text-sm font-medium'>GitHub</p>
								<p className='text-xs text-muted-foreground'>
									Sign in with your GitHub account
								</p>
							</div>
						</div>
						<Button
							size='sm'
							variant='outline'
							onClick={() =>
								authClient.linkSocial({
									provider: 'github',
									callbackURL: '/settings',
								})
							}
						>
							<LinkIcon className='h-3 w-3 mr-1' />
							Connect
						</Button>
					</div>
				</CardContent>
			</Card>

			{/* ── Danger Zone ── */}
			<Card className='border-destructive/50'>
				<CardHeader>
					<CardTitle className='text-destructive'>
						Danger Zone
					</CardTitle>
					<CardDescription>
						Permanently delete your account and all associated data
					</CardDescription>
				</CardHeader>
				<CardContent>
					<AlertDialog>
						<AlertDialogTrigger asChild>
							<Button
								variant='destructive'
								disabled={deleteLoading}
							>
								<Trash2 className='h-4 w-4 mr-2' />
								Delete Account
							</Button>
						</AlertDialogTrigger>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>
									Are you absolutely sure?
								</AlertDialogTitle>
								<AlertDialogDescription>
									This will permanently delete your account,
									all your papers, chunks, and generated code.
									This action cannot be undone.
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel>Cancel</AlertDialogCancel>
								<AlertDialogAction
									className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
									onClick={handleDeleteAccount}
									disabled={deleteLoading}
								>
									{deleteLoading ? (
										<Loader2 className='h-4 w-4 animate-spin' />
									) : (
										'Yes, delete my account'
									)}
								</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				</CardContent>
			</Card>
		</div>
	);
}
