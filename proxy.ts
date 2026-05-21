import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const PUBLIC_PATHS = ['/login'];
const SHOULD_VERIFY_JWT = process.env.ADMIN_MIDDLEWARE_VERIFY_JWT === 'true';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // In local development, admin UI and backend often run on different origins,
  // so backend-issued cookies are not readable by this proxy host.
  if (process.env.NODE_ENV !== 'production') {
    return NextResponse.next();
  }

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = request.cookies.get('admin_token')?.value;

  if (!token) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Backend auth middleware is the source of truth. In production, only
  // perform edge JWT verification when explicitly enabled and configured.
  if (!SHOULD_VERIFY_JWT) {
    return NextResponse.next();
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return NextResponse.next();
  }

  try {
    await jwtVerify(token, new TextEncoder().encode(secret));
  } catch {
    const loginUrl = new URL('/login', request.url);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete('admin_token');
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.svg$|.*\\.webp$|.*\\.ico$|login).*)',
  ],
};
