import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';

const protectedRoutes = ['/dashboard'];

export function proxy(req: NextRequest) {
	const session = getSessionCookie(req);
	const isProtected = protectedRoutes.some((r) =>
		req.nextUrl.pathname.startsWith(r),
	);

	if (isProtected && !session) {
		return NextResponse.redirect(new URL('/sign-in', req.url));
	}

	return NextResponse.next();
}

export const config = {
	matcher: ['/((?!api|_next|.*\\..*).*)'],
};
