"use server";

import { auth, db } from "@/firebase/admin";
import { cookies } from "next/headers";
import { z } from "zod";
import type { User, SignInParams, SignUpParams } from "@/types";

// Input validation schemas
const signUpSchema = z.object({
  idToken: z.string().min(1),
  name: z.string().min(2).max(50),
});

const signInSchema = z.object({
  idToken: z.string().min(1),
});

// Session duration (1 week)
const SESSION_DURATION = 60 * 60 * 24 * 7;

// Secure session cookie configuration
const COOKIE_OPTIONS = {
  maxAge: SESSION_DURATION,
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  sameSite: "lax" as const,
};

// Set session cookie with error handling
export async function setSessionCookie(idToken: string): Promise<{ success: boolean; error?: string }> {
  try {
    const cookieStore = await cookies();

    // Verify token before creating session
    const decodedToken = await auth.verifyIdToken(idToken);
    
    // Create session cookie
    const sessionCookie = await auth.createSessionCookie(idToken, {
      expiresIn: SESSION_DURATION * 1000, // milliseconds
    });

    // Set cookie in the browser
    cookieStore.set("session", sessionCookie, COOKIE_OPTIONS);
    
    return { success: true };
  } catch (error: any) {
    console.error("Error setting session cookie:", error);
    return { success: false, error: "Failed to create session" };
  }
}

export async function signUp(params: SignUpParams) {
  // Validate input
  const validationResult = signUpSchema.safeParse(params);
  if (!validationResult.success) {
    return {
      success: false,
      message: "Invalid input parameters",
    };
  }
  
  const { idToken, name } = validationResult.data;
  let decodedToken;
  
  try {
    // Verify ID token and check if it's fresh (created within last 5 minutes)
    decodedToken = await auth.verifyIdToken(idToken, true);
    const tokenAge = Date.now() / 1000 - decodedToken.auth_time;
    if (tokenAge > 300) { // 5 minutes
      return {
        success: false,
        message: "Authentication token expired. Please sign in again.",
      };
    }
  } catch (error: any) {
    console.error("Error verifying ID token:", error);
    return {
      success: false,
      message: "Invalid authentication token.",
    };
  }

  const { uid, email } = decodedToken;

  // Check if user already exists
  try {
    const existingUser = await db.collection("users").doc(uid).get();
    if (existingUser.exists) {
      return {
        success: false,
        message: "Account already exists. Please sign in.",
      };
    }
  } catch (error) {
    console.error("Error checking existing user:", error);
    return {
      success: false,
      message: "Database error. Please try again.",
    };
  }

  try {
    // Create user profile in Firestore
    const userDoc = {
      name: name.trim(),
      email: email!,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await db.collection("users").doc(uid).set(userDoc);

    // Set session cookie
    const sessionResult = await setSessionCookie(idToken);
    if (!sessionResult.success) {
      // Rollback: delete the user profile if session creation fails
      try {
        await db.collection("users").doc(uid).delete();
      } catch (deleteError) {
        console.error("Error rolling back user profile:", deleteError);
      }
      
      return {
        success: false,
        message: "Failed to create session. Please try again.",
      };
    }

    return {
      success: true,
      message: "Account created successfully.",
    };
  } catch (error: any) {
    console.error("Error creating user profile in DB:", error);

    // Rollback: delete the Firebase Auth user if DB creation fails
    try {
      await auth.deleteUser(uid);
    } catch (deleteError) {
      console.error("Error rolling back Firebase user:", deleteError);
    }

    return {
      success: false,
      message: "Failed to create user profile. Please try again.",
    };
  }
}

export async function signIn(params: SignInParams) {
  // Validate input
  const validationResult = signInSchema.safeParse(params);
  if (!validationResult.success) {
    return {
      success: false,
      message: "Invalid authentication token",
    };
  }
  
  const { idToken } = validationResult.data;
  
  try {
    // Verify ID token with checkRevoked = true
    const decodedToken = await auth.verifyIdToken(idToken, true);
    const { uid, email } = decodedToken;

    // Verify user exists in database
    const userDoc = await db.collection("users").doc(uid).get();
    if (!userDoc.exists) {
      return {
        success: false,
        message: "User profile not found. Please sign up.",
      };
    }

    // Set session cookie
    const sessionResult = await setSessionCookie(idToken);
    if (!sessionResult.success) {
      return {
        success: false,
        message: "Failed to create session. Please try again.",
      };
    }

    return {
      success: true,
      message: "Signed in successfully.",
    };
  } catch (error: any) {
    console.error("Error signing in:", error);
    
    // Handle specific Firebase errors
    if (error.code === 'auth/id-token-revoked') {
      return {
        success: false,
        message: "Session revoked. Please sign in again.",
      };
    }
    
    if (error.code === 'auth/id-token-expired') {
      return {
        success: false,
        message: "Session expired. Please sign in again.",
      };
    }

    return {
      success: false,
      message: "Authentication failed. Please try again.",
    };
  }
}

// Sign out user by clearing the session cookie
export async function signOut(): Promise<{ success: boolean; message: string }> {
  try {
    const cookieStore = await cookies();
    
    // Get current session to revoke if needed
    const sessionCookie = cookieStore.get("session")?.value;
    if (sessionCookie) {
      try {
        const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
        // Optionally revoke the session
        await auth.revokeRefreshTokens(decodedClaims.uid);
      } catch (error) {
        // Session is already invalid, continue with cleanup
        console.log("Session already invalid:", error);
      }
    }
    
    cookieStore.delete("session");
    return {
      success: true,
      message: "Signed out successfully.",
    };
  } catch (error: any) {
    console.error("Error signing out:", error);
    return {
      success: false,
      message: "Failed to sign out. Please try again.",
    };
  }
}

// Get current user from session cookie
export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();

  const sessionCookie = cookieStore.get("session")?.value;
  if (!sessionCookie) return null;

  try {
    // Verify session cookie with checkRevoked = true
    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);

    // Get user info from database
    const userRecord = await db
      .collection("users")
      .doc(decodedClaims.uid)
      .get();
    
    if (!userRecord.exists) {
      // User exists in Firebase Auth but not in Firestore
      // Clear the invalid session
      cookieStore.delete("session");
      return null;
    }

    return {
      ...userRecord.data(),
      id: userRecord.id,
    } as User;
  } catch (error: any) {
    console.error("Error verifying session:", error);
    
    // Clear invalid session cookie
    try {
      cookieStore.delete("session");
    } catch (clearError) {
      console.error("Error clearing session:", clearError);
    }
    
    return null;
  }
}

// Check if user is authenticated
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return !!user;
}

// Middleware helper for route protection
export async function requireAuth(): Promise<{ user: User } | { error: string }> {
  const user = await getCurrentUser();
  
  if (!user) {
    return { error: "Authentication required" };
  }
  
  return { user };
}

// Refresh session token
export async function refreshSession(): Promise<{ success: boolean; error?: string }> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session")?.value;
  
  if (!sessionCookie) {
    return { success: false, error: "No session to refresh" };
  }
  
  try {
    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
    
    // Check if session needs refresh (older than 5 days)
    const sessionAge = Date.now() / 1000 - decodedClaims.iat;
    if (sessionAge < 432000) { // 5 days
      return { success: true }; // No refresh needed
    }
    
    // Generate new session cookie
    const user = await auth.getUser(decodedClaims.uid);
    const newIdToken = await user.getIdToken(true);
    
    const sessionResult = await setSessionCookie(newIdToken);
    return sessionResult;
  } catch (error) {
    console.error("Error refreshing session:", error);
    return { success: false, error: "Failed to refresh session" };
  }
}
