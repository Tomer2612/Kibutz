import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require authentication
const protectedRoutes = [
  '/settings',
  '/profile',
  '/communities', // Community pages need auth (except preview)
];

// Routes that are always public
const publicRoutes = [
  '/',
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/terms',
  '/privacy',
  '/pricing',
  '/contact',
  '/support',
  '/google-success',
];

// Routes that are public within protected paths
const publicExceptions = [
  '/preview', // /communities/[id]/preview is public
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('auth-token')?.value;
  
  // Check if it's a public route
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );
  
  // Check for public exceptions (like /preview pages)
  const hasPublicException = publicExceptions.some(exception => 
    pathname.includes(exception)
  );
  
  // Redirect logged-in users away from login/signup
  if (token && (pathname === '/login' || pathname === '/signup')) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  // If public or has exception, allow through
  if (isPublicRoute || hasPublicException) {
    return NextResponse.next();
  }
  
  // Check if it's a protected route
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );
  
  if (!isProtectedRoute) {
    return NextResponse.next();
  }
  
  // No token on protected route - redirect to login
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // Token exists - allow through
  return NextResponse.next();
}

// Configure which paths middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public files (images, etc)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|uploads).*)',
  ],
};
