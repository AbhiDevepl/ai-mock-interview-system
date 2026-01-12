"use client";

import React from "react";
import { z } from "zod";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { auth } from "@/firebase/client";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";

import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";

import { signIn, signUp } from "@/lib/actions/auth.action";
import FormField from "./FormField";
import type { FormType } from "@/types";

const authFormSchema = (type: FormType) => {
  return z.object({
    name: type === "sign-up" ? z.string().min(2, "Name must be at least 2 characters").max(50, "Name must be less than 50 characters") : z.string().optional(),
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
  });
};

const AuthForm = ({ type }: { type: FormType }) => {
  const [isLoading, setIsLoading] = React.useState(false);
  const router = useRouter();

  const formSchema = authFormSchema(type);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      if (type === "sign-up") {
        const { name, email, password } = data;

        // Create user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

        // Get ID token immediately after user creation
        const idToken = await userCredential.user.getIdToken(true);
        
        if (!idToken) {
          toast.error("Failed to get authentication token. Please try again.");
          return;
        }

        // Call server action with proper error handling
        const signUpResult = await signUp({
          idToken,
          name: name!,
        });

        if (!signUpResult?.success) {
          // If server-side fails, clean up the Firebase user
          try {
            await userCredential.user.delete();
          } catch (deleteError) {
            console.error("Failed to cleanup Firebase user:", deleteError);
          }
          
          toast.error(signUpResult?.message || "Failed to create account");
          return;
        }

        toast.success("Account created and signed in successfully.");
        router.push("/");
      } else {
        const { email, password } = data;

        // Sign in user
        const userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );

        // Force token refresh to get a fresh token
        const idToken = await userCredential.user.getIdToken(true);
        
        if (!idToken) {
          toast.error("Authentication failed. Please try again.");
          return;
        }

        // Call server action
        const result = await signIn({
          idToken,
        });

        if (!result?.success) {
          toast.error(result?.message || "Sign in failed");
          return;
        }

        toast.success("Signed in successfully.");
        router.push("/");
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      
      // Handle specific Firebase errors
      let errorMessage = "An unexpected error occurred";
      
      if (error.code) {
        switch (error.code) {
          case 'auth/email-already-in-use':
            errorMessage = "Email already in use. Please sign in instead.";
            break;
          case 'auth/invalid-email':
            errorMessage = "Invalid email address.";
            break;
          case 'auth/weak-password':
            errorMessage = "Password is too weak. Please choose a stronger password.";
            break;
          case 'auth/user-not-found':
            errorMessage = "No account found with this email. Please sign up.";
            break;
          case 'auth/wrong-password':
            errorMessage = "Incorrect password. Please try again.";
            break;
          case 'auth/too-many-requests':
            errorMessage = "Too many failed attempts. Please try again later.";
            break;
          case 'auth/network-request-failed':
            errorMessage = "Network error. Please check your connection.";
            break;
          default:
            errorMessage = error.message || "Authentication failed. Please try again.";
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const isSignIn = type === "sign-in";

  return (
    <div className="card-border lg:min-w-[566px]">
      <div className="flex flex-col gap-6 card py-14 px-10">
        <div className="flex flex-row gap-2 justify-center">
          <Image src="/logo.svg" alt="logo" height={32} width={38} />
          <h2 className="text-primary-100">PrepWise</h2>
        </div>

        <h3>Practice job interviews with AI</h3>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="w-full space-y-6 mt-4 form"
          >
            {!isSignIn && (
              <FormField
                control={form.control}
                name="name"
                label="Name"
                placeholder="Your Name"
                type="text"
              />
            )}

            <FormField
              control={form.control}
              name="email"
              label="Email"
              placeholder="Your email address"
              type="email"
            />

            <FormField
              control={form.control}
              name="password"
              label="Password"
              placeholder="Enter your password"
              type="password"
            />

            <Button className="btn w-full" type="submit" disabled={isLoading}>
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  {isSignIn ? "Signing In..." : "Creating Account..."}
                </div>
              ) : isSignIn ? (
                "Sign In"
              ) : (
                "Create an Account"
              )}
            </Button>
          </form>
        </Form>

        <p className="text-center">
          {isSignIn ? "No account yet?" : "Have an account already?"}
          <Link
            href={!isSignIn ? "/sign-in" : "/sign-up"}
            className="font-bold text-user-primary ml-1"
          >
            {!isSignIn ? "Sign In" : "Sign Up"}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default AuthForm;
