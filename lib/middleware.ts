import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/firebase/admin';

// Routes that require authentication
const protectedRoutes = [
  '/',
  '/interview',
  '/interviews',
  '/feedback',
  '/profile',
];

// Routes that should redirect authenticated users away
const authRoutes = [
  '/sign-in',
  '/sign-up',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Get session cookie
  const sessionCookie = request.cookies.get('session')?.value;
  
  // Check if route requires authentication
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );
  
  // Check if route is for authentication (should redirect if already authenticated)
  const isAuthRoute = authRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );
  
  try {
    // If there's no session cookie and route is protected, redirect to sign-in
    if (!sessionCookie && isProtectedRoute) {
      const signInUrl = new URL('/sign-in', request.url);
      signInUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(signInUrl);
    }
    
    // If there's a session cookie, verify it
    if (sessionCookie) {
      try {
        await auth.verifySessionCookie(sessionCookie, true);
        
        // If user is authenticated and trying to access auth routes, redirect to home
        if (isAuthRoute) {
          const redirectUrl = request.nextUrl.searchParams.get('redirect') || '/';
          return NextResponse.redirect(new URL(redirectUrl, request.url));
        }
      } catch (error) {
        // Session is invalid, clear it and redirect to sign-in if needed
        const response = isProtectedRoute 
          ? NextResponse.redirect(new URL('/sign-in', request.url))
          : NextResponse.next();
        
        response.cookies.delete('session');
        return response;
      }
    }
    
    return NextResponse.next();
  } catch (error) {
    console.error('Middleware error:', error);
    
    // On error, clear session and redirect to sign-in if needed
    const response = isProtectedRoute 
      ? NextResponse.redirect(new URL('/sign-in', request.url))
      : NextResponse.next();
    
    response.cookies.delete('session');
    return response;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
