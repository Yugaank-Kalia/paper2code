import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { BackToTop } from '@/components/back-to-top';
import { Navbar } from '@/components/navbar';

const geistSans = Geist({
	variable: '--font-geist-sans',
	subsets: ['latin'],
});

const geistMono = Geist_Mono({
	variable: '--font-geist-mono',
	subsets: ['latin'],
});

export const metadata: Metadata = {
	metadataBase: new URL(
		process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
	),
	title: 'paper2code',
	description:
		'Turn academic papers into working Python implementations using RAG and a LLM.',
	openGraph: {
		title: 'paper2code',
		description:
			'Turn academic papers into working Python implementations using RAG and a LLM.',
		type: 'website',
		images: [
			{
				url: '/open-graph.png',
				width: 1482,
				height: 1886,
				alt: 'paper2code',
			},
		],
	},
	twitter: {
		card: 'summary_large_image',
		title: 'paper2code',
		description:
			'Turn academic papers into working Python implementations using RAG and a local LLM.',
		images: ['/open-graph.png'],
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang='en' suppressHydrationWarning>
			<body
				className={`${geistMono.variable} ${geistSans.variable} ${geistMono.className} antialiased`}
			>
				<Providers>{children}</Providers>
				<BackToTop />
			</body>
		</html>
	);
}
