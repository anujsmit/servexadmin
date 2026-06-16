// middleware.ts (create this file in your project root)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Protected routes that require authentication
const protectedRoutes = [
  '/admin',
  '/dashboard',
  '/users',
  '/servex',
  '/service-categories',
  '/platform-services',
  '/hero-banners',
  '/ratings',
  '/service-requests',
  '/expenses',
  '/payouts',
  '/analytics',
  '/broadcast',
  '/audit-logs',
  '/sms-logs',
  '/employees',
  '/settings',
  '/pending-requests',
  '/manual-assign',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Get token from localStorage (via cookie or header)
  const token = request.cookies.get('admin_token')?.value;
  
  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );
  
  // Check if it's an admin route
  const isAdminRoute = pathname.startsWith('/admin');
  
  // Check if it's the login page
  const isLoginPage = pathname === '/login';
  
  // If trying to access protected route without token, redirect to login
  if (isProtectedRoute && !token) {
    const url = new URL('/login', request.url);
    return NextResponse.redirect(url);
  }
  
  // If trying to access admin route without token, redirect to login
  if (isAdminRoute && !token && pathname !== '/admin/login') {
    const url = new URL('/login', request.url);
    return NextResponse.redirect(url);
  }
  
  // If already logged in and trying to access login page, redirect to admin dashboard
  if (isLoginPage && token) {
    const url = new URL('/admin/dashboard', request.url);
    return NextResponse.redirect(url);
  }
  
  // If accessing root, redirect to admin dashboard if logged in, else login
  if (pathname === '/') {
    if (token) {
      const url = new URL('/admin/dashboard', request.url);
      return NextResponse.redirect(url);
    }
    const url = new URL('/login', request.url);
    return NextResponse.redirect(url);
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/admin/:path*',
    '/dashboard',
    '/users',
    '/servex',
    '/service-categories',
    '/platform-services',
    '/hero-banners',
    '/ratings',
    '/service-requests',
    '/expenses',
    '/payouts',
    '/analytics',
    '/broadcast',
    '/audit-logs',
    '/sms-logs',
    '/employees',
    '/settings',
    '/pending-requests',
    '/manual-assign',
  ],
};