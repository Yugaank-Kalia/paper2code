import { Navbar } from '@/components/navbar';
import { BackToTop } from '@/components/back-to-top';

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<>
			{children}
			<BackToTop />
		</>
	);
}
