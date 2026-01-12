import { redirect } from 'next/navigation';
import { requireAuth } from './actions/auth.action';
import type { User } from '@/types';

// Server-side authentication wrapper for components
export async function withAuth<T>(
  callback: (user: User) => Promise<T>,
  redirectTo: string = '/sign-in'
): Promise<T> {
  const authResult = await requireAuth();
  
  if ('error' in authResult) {
    redirect(redirectTo);
  }
  
  return callback(authResult.user);
}

// Utility for API routes
export async function authenticateApiRequest(): Promise<{ user: User } | { error: string; status: number }> {
  const authResult = await requireAuth();
  
  if ('error' in authResult) {
    return {
      error: authResult.error,
      status: 401
    };
  }
  
  return { user: authResult.user };
}

// Type guard for authenticated user
export function isAuthenticatedUser(user: User | null): user is User {
  return user !== null;
}
