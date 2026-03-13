import type { Metadata } from 'next';
import { Fira_Code, Geist } from 'next/font/google';
import './globals.css';
import { Providers } from '../providers/providers';
import { BackToTop } from '@/components/back-to-top';
import { Navbar } from '@/components/navbar';

const geistSans = Geist({
	variable: '--font-geist-sans',
	subsets: ['latin'],
});

const firaCode = Fira_Code({
	subsets: ['latin'],
	variable: '--font-fira-code',
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
				className={`${geistSans.variable} ${firaCode.variable} antialiased`}
			>
				<Providers>
					<Navbar />
					{children}
					<BackToTop />
				</Providers>
			</body>
		</html>
	);
}
