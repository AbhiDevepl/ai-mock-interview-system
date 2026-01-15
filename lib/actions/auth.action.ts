"use server";

import { createClient } from "@/supabase/server";
import { cookies } from "next/headers";
import { z } from "zod";
import type { User, SignInParams, SignUpParams } from "@/types";

const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
});

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

// Helper to normalize email
function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function signUp(params: SignUpParams) {
  const validationResult = signUpSchema.safeParse(params);
  if (!validationResult.success) {
    return {
      success: false,
      message: "Invalid input parameters",
    };
  }

  const { email, password, name } = params;
  const normalizedEmail = normalizeEmail(email);

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // 1. Sign up with Supabase Auth
  const { data, error } = await supabase.auth.signUp({
    email: normalizedEmail,
    password,
    options: {
      data: {
        name,
      },
    },
  });

  if (error) {
    if (
      error.message.toLowerCase().includes("already") ||
      error.message.toLowerCase().includes("registered")
    ) {
      return {
        success: false,
        message: "User already exists. Please sign in instead.",
      };
    }
    return {
      success: false,
      message: "Unable to create account. Please try again.",
    };
  }

  const user = data.user;
  if (!user) {
    return {
      success: false,
      message: "Signup failed. Please try again.",
    };
  }

  // 2. Profile Creation (Primary logic is the DB Trigger)
  // We try a manual insert as a fallback, but we ignore common errors
  // (like 23505 duplicate or 42501 RLS) because the trigger runs as superuser
  // and will handle it even if this code cannot due to RLS.
  const { error: profileError } = await supabase.from("profiles").insert({
    id: user.id,
    email: normalizedEmail,
    full_name: name,
  });

  if (
    profileError &&
    !["23505", "42501", "PGRST116"].includes(profileError.code)
  ) {
    console.warn(
      "Manual profile creation failed, but trigger may still succeed:",
      profileError
    );
    // We don't return an error here because the Auth account was created
    // and the DB trigger is likely to handle the profile creation.
  }

  return {
    success: true,
    message: data.session
      ? "Account created successfully."
      : "Account created! Please verify your email.",
    session: data.session,
  };
}

export async function signIn(params: SignInParams) {
  const validationResult = signInSchema.safeParse(params);
  if (!validationResult.success) {
    return {
      success: false,
      message: "Invalid input parameters",
    };
  }

  const { email, password } = params;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      success: false,
      message: error.message,
    };
  }

  return {
    success: true,
    message: "Signed in successfully.",
  };
}

export async function signOut(): Promise<{
  success: boolean;
  message: string;
}> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { error } = await supabase.auth.signOut();

  if (error) {
    return {
      success: false,
      message: error.message,
    };
  }

  return {
    success: true,
    message: "Signed out successfully.",
  };
}

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  return {
    id: user.id,
    name: user.user_metadata.name || "User",
    email: user.email || "",
  };
}

export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return !!user;
}

export async function requireAuth(): Promise<
  { user: User } | { error: string }
> {
  const user = await getCurrentUser();

  if (!user) {
    return { error: "Authentication required" };
  }

  return { user };
}
