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

export async function signUp(params: SignUpParams) {
  const validationResult = signUpSchema.safeParse(params);
  if (!validationResult.success) {
    return {
      success: false,
      message: "Invalid input parameters",
    };
  }

  const { email, password, name } = params;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
      },
    },
  });

  if (error) {
    return {
      success: false,
      message: error.message,
    };
  }

  return {
    success: true,
    message: "Account created successfully.",
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
