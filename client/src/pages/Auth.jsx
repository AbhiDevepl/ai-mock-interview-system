import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import axios from "axios";
import {
  auth,
  googleProvider,
  githubProvider,
} from "../utils/firebase";
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";

const serverUrl = import.meta.env.VITE_SERVER_URL ?? "http://localhost:5000";

// ─── Utility ─────────────────────────────────────────────────────────────────
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// ─── Design tokens ───────────────────────────────────────────────────────────
const C = {
  primary: "#c0c1ff",
  tertiary: "#d0bcff",
  bg: "#060e20",
  leftBg: "#0b1326",
  border: "rgba(192,193,255,0.12)",
  inputBg: "rgba(192,193,255,0.05)",
  inputBorder: "rgba(192,193,255,0.15)",
  inputFocus: "rgba(192,193,255,0.4)",
  text: "#e2e4ff",
  textMuted: "#8892c4",
  textDim: "#555e8a",
};

// ─── Zod Schemas ─────────────────────────────────────────────────────────────
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(1, "Password is required."),
  rememberMe: z.boolean().optional(),
});

const signupSchema = z
  .object({
    fullName: z.string().min(2, "Full name must be at least 2 characters."),
    email: z.string().email("Please enter a valid email address."),
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string(),
    terms: z.boolean().refine((val) => val === true, {
      message: "You must accept the terms & conditions.",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

// ─── Material Symbol helper ───────────────────────────────────────────────────
function Icon({ name, className = "", fill = 0, size = 20 }) {
  return (
    <span
      className={cn("material-symbols-rounded select-none", className)}
      style={{
        fontVariationSettings: `'FILL' ${fill}, 'wght' 400, 'GRAD' 0, 'opsz' ${size}`,
        fontSize: size,
        lineHeight: 1,
      }}
    >
      {name}
    </span>
  );
}

// ─── Styled primitives ────────────────────────────────────────────────────────
const AuthInput = React.forwardRef(
  ({ icon, error, className, children, ...props }, ref) => (
    <div className={cn("relative flex items-center", className)}>
      {icon && (
        <span
          className="absolute left-3.5 pointer-events-none"
          style={{ color: error ? "#f87171" : C.textMuted }}
        >
          <Icon name={icon} size={18} />
        </span>
      )}
      <input
        ref={ref}
        className={cn(
          "w-full h-10 rounded-2xl text-sm outline-none transition-all duration-200",
          "placeholder:text-[#555e8a]",
          icon ? "pl-10 pr-4" : "px-4"
        )}
        style={{
          background: C.inputBg,
          border: `1.5px solid ${error ? "#f87171" : C.inputBorder}`,
          color: C.text,
          fontFamily: "Inter, sans-serif",
          boxShadow: error ? "0 0 0 3px rgba(248,113,113,0.15)" : "none",
        }}
        onFocus={(e) => {
          e.currentTarget.style.border = `1.5px solid ${error ? "#f87171" : C.inputFocus}`;
          e.currentTarget.style.boxShadow = `0 0 0 3px ${
            error ? "rgba(248,113,113,0.15)" : "rgba(192,193,255,0.12)"
          }`;
        }}
        onBlur={(e) => {
          e.currentTarget.style.border = `1.5px solid ${error ? "#f87171" : C.inputBorder}`;
          e.currentTarget.style.boxShadow = "none";
        }}
        {...props}
      />
      {children}
    </div>
  )
);
AuthInput.displayName = "AuthInput";

function FieldError({ message }) {
  if (!message) return null;
  return (
    <p className="flex items-center gap-1 text-xs font-medium" style={{ color: "#f87171" }}>
      <Icon name="error" size={13} />
      {message}
    </p>
  );
}

// ─── Left Panel ───────────────────────────────────────────────────────────────
const AVATARS = [
  "https://api.dicebear.com/9.x/avataaars/svg?seed=Felix&backgroundColor=b6e3f4",
  "https://api.dicebear.com/9.x/avataaars/svg?seed=Aneka&backgroundColor=ffd5dc",
  "https://api.dicebear.com/9.x/avataaars/svg?seed=Mia&backgroundColor=c0aede",
  "https://api.dicebear.com/9.x/avataaars/svg?seed=Luca&backgroundColor=d1d4f9",
];

function LeftPanel() {
  return (
    <div
      className="hidden lg:flex w-[52%] flex-shrink-0 flex-col justify-between p-10 relative overflow-hidden h-full"
      style={{ background: C.leftBg }}
    >
      {/* Ambient glow blobs */}
      <div
        className="absolute pointer-events-none"
        style={{
          inset: 0,
          background:
            "radial-gradient(ellipse 70% 60% at 20% 10%, rgba(100,80,220,0.22) 0%, transparent 70%), " +
            "radial-gradient(ellipse 55% 50% at 85% 85%, rgba(160,80,255,0.18) 0%, transparent 65%)",
        }}
      />
      {/* Subtle dot grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(192,193,255,0.35) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          maskImage:
            "radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)",
        }}
      />

      {/* Logo */}
      <div className="relative z-10 flex items-center gap-2.5">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{
            background: "linear-gradient(135deg, #c0c1ff 0%, #d0bcff 100%)",
            boxShadow: "0 0 20px rgba(192,193,255,0.35)",
          }}
        >
          <Icon name="psychology" size={20} fill={1} className="text-[#060e20]" />
        </div>
        <span className="text-xl font-bold tracking-tight" style={{ color: C.text }}>
          PrepWise_AI
        </span>
      </div>

      {/* Hero copy */}
      <div className="relative z-10 max-w-md">
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-6"
          style={{
            background: "rgba(192,193,255,0.1)",
            border: `1px solid ${C.border}`,
            color: C.primary,
          }}
        >
          <Icon name="auto_awesome" size={14} fill={1} />
          AI-Powered Interview Coach
        </div>

        <h1
          className="text-3xl font-bold leading-tight tracking-tight"
          style={{ color: C.text, fontFamily: "Inter, sans-serif" }}
        >
          Ace every interview
          <br />
          <span
            style={{
              background: `linear-gradient(90deg, ${C.primary} 0%, ${C.tertiary} 100%)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            with confidence.
          </span>
        </h1>

        <p className="mt-3 text-sm leading-relaxed" style={{ color: C.textMuted }}>
          Join thousands of professionals using our AI-driven platform to land
          their dream roles at top tech companies.
        </p>

        {/* Feature list */}
        <ul className="mt-5 space-y-2.5">
          {[
            { icon: "smart_toy", text: "AI mock interviews tailored to your role & level" },
            { icon: "insights", text: "Real-time feedback on technical & behavioral skills" },
            { icon: "leaderboard", text: "Comprehensive performance analytics & growth tracking" },
          ].map(({ icon, text }) => (
            <li key={text} className="flex items-center gap-3 text-sm" style={{ color: C.text }}>
              <span
                className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(192,193,255,0.1)", color: C.primary }}
              >
                <Icon name={icon} size={16} fill={1} />
              </span>
              {text}
            </li>
          ))}
        </ul>

        {/* Stats */}
        <div className="mt-6 flex gap-6">
          {[
            { value: "94%", label: "Success Rate" },
            { value: "12k+", label: "Interviews Prepped" },
          ].map(({ value, label }) => (
            <div key={label}>
              <p
                className="text-xl font-bold"
                style={{
                  background: `linear-gradient(90deg, ${C.primary}, ${C.tertiary})`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {value}
              </p>
              <p className="text-xs mt-0.5" style={{ color: C.textMuted }}>
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Social proof */}
      <div className="relative z-10 flex items-center gap-3">
        <div className="flex -space-x-2">
          {AVATARS.map((src, i) => (
            <img
              key={i}
              src={src}
              alt="user avatar"
              className="w-8 h-8 rounded-full ring-2"
              style={{ ringColor: C.leftBg, background: "#1a2240" }}
            />
          ))}
        </div>
        <p className="text-xs" style={{ color: C.textMuted }}>
          <span style={{ color: C.text, fontWeight: 600 }}>2,400+ users</span> joined this month
        </p>
      </div>
    </div>
  );
}

// ─── Social Login Button ──────────────────────────────────────────────────────
function SocialButton({ icon, label, isGitHub = false, onClick, isLoading }) {
  const GoogleIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" className="flex-shrink-0">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );

  const GitHubIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="flex-shrink-0" style={{ color: C.text }}>
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isLoading}
      className="flex items-center justify-center gap-2.5 h-10 rounded-2xl text-sm font-medium transition-all duration-200 group"
      style={{
        background: "rgba(192,193,255,0.05)",
        border: `1.5px solid ${C.border}`,
        color: C.text,
        cursor: isLoading ? "not-allowed" : "pointer",
        opacity: isLoading ? 0.7 : 1,
      }}
      onMouseEnter={(e) => {
        if (!isLoading) {
          e.currentTarget.style.background = "rgba(192,193,255,0.1)";
          e.currentTarget.style.borderColor = C.inputFocus;
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "rgba(192,193,255,0.05)";
        e.currentTarget.style.borderColor = C.border;
      }}
    >
      {isLoading ? (
        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : isGitHub ? (
        <GitHubIcon />
      ) : (
        <GoogleIcon />
      )}
      <span>{label}</span>
    </button>
  );
}

// ─── Gradient CTA Button ──────────────────────────────────────────────────────
function GradientButton({ isLoading, children, disabled }) {
  return (
    <button
      type="submit"
      disabled={disabled || isLoading}
      className="relative w-full h-10 rounded-2xl text-sm font-bold tracking-wide transition-all duration-200 overflow-hidden"
      style={{
        background:
          disabled || isLoading
            ? "rgba(192,193,255,0.15)"
            : `linear-gradient(135deg, ${C.primary} 0%, ${C.tertiary} 100%)`,
        color: disabled || isLoading ? C.textDim : "#060e20",
        boxShadow: disabled || isLoading ? "none" : "0 4px 24px rgba(192,193,255,0.35)",
        cursor: disabled || isLoading ? "not-allowed" : "pointer",
      }}
      onMouseEnter={(e) => {
        if (!disabled && !isLoading) {
          e.currentTarget.style.boxShadow = "0 6px 32px rgba(192,193,255,0.5)";
          e.currentTarget.style.transform = "translateY(-1px)";
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "0 4px 24px rgba(192,193,255,0.35)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <span className="relative z-10 flex items-center justify-center gap-2">
        {isLoading ? (
          <>
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Processing…
          </>
        ) : (
          children
        )}
      </span>
    </button>
  );
}

// ─── Login Form ───────────────────────────────────────────────────────────────
function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(null); // "google" | "github" | null

  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", rememberMe: false },
    mode: "onChange",
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
      toast.success("Successfully signed in", {
        description: "Welcome back to PrepWise!",
      });
    } catch (err) {
      const msg = firebaseErrorMessage(err.code);
      toast.error("Sign in failed", { description: msg });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider, providerName) => {
    setSocialLoading(providerName);
    try {
      const response = await signInWithPopup(auth, provider);
      const User = response.user;
      const name = User.displayName;
      const email = User.email;

      // Sync user with backend
      const result = await axios.post(
        serverUrl + "/api/auth/google",
        { name, email },
        { withCredentials: true }
      );
      console.log(result);

      toast.success(`Signed in with ${providerName}`, {
        description: "Welcome back to PrepWise!",
      });
    } catch (err) {
      if (err.code !== "auth/popup-closed-by-user") {
        toast.error(`${providerName} sign in failed`, {
          description: firebaseErrorMessage(err.code),
        });
      }
    } finally {
      setSocialLoading(null);
    }
  };

  return (
    <div className="space-y-3">
      {/* Social buttons */}
      <div className="grid grid-cols-2 gap-3">
        <SocialButton
          icon="google"
          label="Google"
          isLoading={socialLoading === "Google"}
          onClick={() => handleSocialLogin(googleProvider, "Google")}
        />
        <SocialButton
          icon="github"
          label="GitHub"
          isGitHub
          isLoading={socialLoading === "GitHub"}
          onClick={() => handleSocialLogin(githubProvider, "GitHub")}
        />
      </div>

      {/* Divider */}
      <div className="relative flex items-center gap-3">
        <div className="flex-1 h-px" style={{ background: C.border }} />
        <span className="text-xs uppercase tracking-widest" style={{ color: C.textDim }}>
          or
        </span>
        <div className="flex-1 h-px" style={{ background: C.border }} />
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        {/* Email */}
        <div className="space-y-1">
          <label className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: C.textMuted }}>
            Email Address
          </label>
          <AuthInput
            icon="mail"
            type="email"
            placeholder="name@example.com"
            autoFocus
            error={!!form.formState.errors.email}
            {...form.register("email")}
          />
          <FieldError message={form.formState.errors.email?.message} />
        </div>

        {/* Password */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: C.textMuted }}>
              Password
            </label>
            <Link
              to="#"
              className="text-xs font-medium transition-opacity hover:opacity-70"
              style={{ color: C.primary }}
            >
              Forgot password?
            </Link>
          </div>
          <AuthInput
            icon="lock"
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            error={!!form.formState.errors.password}
            {...form.register("password")}
          >
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 transition-opacity hover:opacity-70"
              style={{ color: C.textMuted }}
            >
              <Icon name={showPassword ? "visibility_off" : "visibility"} size={18} />
            </button>
          </AuthInput>
          <FieldError message={form.formState.errors.password?.message} />
        </div>

        {/* Remember me */}
        <div className="flex items-center gap-2.5">
          <input
            type="checkbox"
            id="rememberMe"
            className="w-4 h-4 rounded"
            style={{ accentColor: C.primary }}
            {...form.register("rememberMe")}
          />
          <label htmlFor="rememberMe" className="text-sm cursor-pointer" style={{ color: C.textMuted }}>
            Remember me for 30 days
          </label>
        </div>

        <GradientButton isLoading={isLoading} disabled={!form.formState.isValid}>
          <Icon name="login" size={18} fill={1} />
          Sign In to PrepWise
        </GradientButton>
      </form>
    </div>
  );
}

// ─── Signup Form ──────────────────────────────────────────────────────────────
function SignupForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(null);

  const form = useForm({
    resolver: zodResolver(signupSchema),
    defaultValues: { fullName: "", email: "", password: "", confirmPassword: "", terms: false },
    mode: "onChange",
  });

  const watchPassword = form.watch("password");

  const getStrength = (pass) => {
    if (!pass) return 0;
    let s = 0;
    if (pass.length > 7) s++;
    if (/[A-Z]/.test(pass)) s++;
    if (/[0-9]/.test(pass)) s++;
    if (/[^A-Za-z0-9]/.test(pass)) s++;
    return s;
  };

  const strength = getStrength(watchPassword || "");
  const strengthMeta = [
    null,
    { label: "Weak", color: "#f87171" },
    { label: "Fair", color: "#fb923c" },
    { label: "Good", color: "#fbbf24" },
    { label: "Strong", color: "#34d399" },
  ];

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const credential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      await updateProfile(credential.user, { displayName: data.fullName });
      toast.success("Account created!", {
        description: "Please check your email to verify your account.",
      });
    } catch (err) {
      toast.error("Sign up failed", { description: firebaseErrorMessage(err.code) });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider, providerName) => {
    setSocialLoading(providerName);
    try {
      const response = await signInWithPopup(auth, provider);
      const User = response.user;
      const name = User.displayName;
      const email = User.email;

      // Sync user with backend
      const result = await axios.post(
        serverUrl + "/api/auth/google",
        { name, email },
        { withCredentials: true }
      );
      console.log(result);

      toast.success(`Signed up with ${providerName}`, {
        description: "Welcome to PrepWise!",
      });
    } catch (err) {
      if (err.code !== "auth/popup-closed-by-user") {
        toast.error(`${providerName} sign up failed`, {
          description: firebaseErrorMessage(err.code),
        });
      }
    } finally {
      setSocialLoading(null);
    }
  };

  return (
    <div className="space-y-2.5">
      {/* Social buttons */}
      <div className="grid grid-cols-2 gap-3">
        <SocialButton
          icon="google"
          label="Google"
          isLoading={socialLoading === "Google"}
          onClick={() => handleSocialLogin(googleProvider, "Google")}
        />
        <SocialButton
          icon="github"
          label="GitHub"
          isGitHub
          isLoading={socialLoading === "GitHub"}
          onClick={() => handleSocialLogin(githubProvider, "GitHub")}
        />
      </div>

      {/* Divider */}
      <div className="relative flex items-center gap-3">
        <div className="flex-1 h-px" style={{ background: C.border }} />
        <span className="text-xs uppercase tracking-widest" style={{ color: C.textDim }}>
          or
        </span>
        <div className="flex-1 h-px" style={{ background: C.border }} />
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2.5">
        {/* Full Name */}
        <div className="space-y-1">
          <label className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: C.textMuted }}>
            Full Name
          </label>
          <AuthInput
            icon="person"
            type="text"
            placeholder="John Doe"
            error={!!form.formState.errors.fullName}
            {...form.register("fullName")}
          />
          <FieldError message={form.formState.errors.fullName?.message} />
        </div>

        {/* Email */}
        <div className="space-y-1">
          <label className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: C.textMuted }}>
            Email Address
          </label>
          <AuthInput
            icon="mail"
            type="email"
            placeholder="name@example.com"
            error={!!form.formState.errors.email}
            {...form.register("email")}
          />
          <FieldError message={form.formState.errors.email?.message} />
        </div>

        {/* Password */}
        <div className="space-y-1">
          <label className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: C.textMuted }}>
            Password
          </label>
          <AuthInput
            icon="lock"
            type={showPassword ? "text" : "password"}
            placeholder="Create a strong password"
            error={!!form.formState.errors.password}
            {...form.register("password")}
          >
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 transition-opacity hover:opacity-70"
              style={{ color: C.textMuted }}
            >
              <Icon name={showPassword ? "visibility_off" : "visibility"} size={18} />
            </button>
          </AuthInput>

          {/* Strength bar */}
          {watchPassword && watchPassword.length > 0 && (
            <div className="space-y-1 pt-0.5">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((lvl) => (
                  <div
                    key={lvl}
                    className="h-1 flex-1 rounded-full transition-all duration-300"
                    style={{
                      background:
                        strength >= lvl
                          ? strengthMeta[strength]?.color
                          : "rgba(192,193,255,0.1)",
                    }}
                  />
                ))}
              </div>
              {strengthMeta[strength] && (
                <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: strengthMeta[strength].color }}>
                  {strengthMeta[strength].label}
                </p>
              )}
            </div>
          )}
          <FieldError message={form.formState.errors.password?.message} />
        </div>

        {/* Confirm Password */}
        <div className="space-y-1">
          <label className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: C.textMuted }}>
            Confirm Password
          </label>
          <AuthInput
            icon="lock_reset"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Re-enter your password"
            error={!!form.formState.errors.confirmPassword}
            {...form.register("confirmPassword")}
          >
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3.5 transition-opacity hover:opacity-70"
              style={{ color: C.textMuted }}
            >
              <Icon name={showConfirmPassword ? "visibility_off" : "visibility"} size={18} />
            </button>
          </AuthInput>
          <FieldError message={form.formState.errors.confirmPassword?.message} />
        </div>

        {/* Terms */}
        <div className="flex items-start gap-2.5">
          <input
            type="checkbox"
            id="terms"
            className="mt-0.5 w-4 h-4 rounded"
            style={{ accentColor: C.primary }}
            {...form.register("terms")}
          />
          <div>
            <label htmlFor="terms" className="text-xs cursor-pointer" style={{ color: C.textMuted }}>
              I agree to the{" "}
              <Link to="#" className="underline underline-offset-2" style={{ color: C.primary }}>
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link to="#" className="underline underline-offset-2" style={{ color: C.primary }}>
                Privacy Policy
              </Link>
            </label>
            <FieldError message={form.formState.errors.terms?.message} />
          </div>
        </div>

        <GradientButton isLoading={isLoading} disabled={!form.formState.isValid}>
          <Icon name="rocket_launch" size={18} fill={1} />
          Create Free Account
        </GradientButton>
      </form>
    </div>
  );
}

// ─── Firebase error → human readable message ─────────────────────────────────
function firebaseErrorMessage(code) {
  const map = {
    "auth/user-not-found": "No account found with this email.",
    "auth/wrong-password": "Incorrect password. Please try again.",
    "auth/email-already-in-use": "An account with this email already exists.",
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/weak-password": "Password must be at least 6 characters.",
    "auth/too-many-requests": "Too many attempts. Please try again later.",
    "auth/network-request-failed": "Network error. Check your connection.",
    "auth/popup-blocked": "Popup was blocked. Please allow popups for this site.",
    "auth/account-exists-with-different-credential":
      "An account already exists with a different sign-in method.",
    "auth/invalid-credential": "Invalid credentials. Please try again.",
  };
  return map[code] ?? "An unexpected error occurred. Please try again.";
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);

  // Force dark mode — dark-only experience
  useEffect(() => {
    document.documentElement.classList.add("dark");
    document.documentElement.style.colorScheme = "dark";
  }, []);

  return (
    <div
      className="h-[100dvh] w-full flex overflow-hidden"
      style={{ fontFamily: "Inter, sans-serif", background: C.bg }}
    >
      <LeftPanel />

      {/* RIGHT: Auth form panel */}
      <div
        className="flex-1 flex items-center justify-center p-6 sm:p-8 relative overflow-y-auto"
        style={{ background: C.bg }}
      >
        {/* Mobile logo */}
        <div className="absolute top-6 left-6 lg:hidden flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${C.primary} 0%, ${C.tertiary} 100%)` }}
          >
            <Icon name="psychology" size={18} fill={1} className="text-[#060e20]" />
          </div>
          <span className="font-bold tracking-tight" style={{ color: C.text }}>
            PrepWise
          </span>
        </div>

        {/* Card */}
        <div
          className="w-full max-w-[420px] rounded-3xl p-6 sm:p-7"
          style={{
            background: "rgba(11,19,38,0.6)",
            border: `1px solid ${C.border}`,
            backdropFilter: "blur(20px)",
            boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
          }}
        >
          {/* Toggle tabs */}
          <div
            className="flex rounded-2xl p-1 mb-5"
            style={{ background: "rgba(192,193,255,0.06)", border: `1px solid ${C.border}` }}
          >
            {["Sign In", "Sign Up"].map((label, idx) => {
              const active = isLogin ? idx === 0 : idx === 1;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => setIsLogin(idx === 0)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
                  style={{
                    background: active
                      ? `linear-gradient(135deg, ${C.primary} 0%, ${C.tertiary} 100%)`
                      : "transparent",
                    color: active ? "#060e20" : C.textMuted,
                    boxShadow: active ? `0 4px 16px rgba(192,193,255,0.25)` : "none",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Heading */}
          <div className="mb-4">
            <h2 className="text-xl font-bold" style={{ color: C.text }}>
              {isLogin ? "Welcome back 👋" : "Create your account"}
            </h2>
            <p className="text-sm mt-1.5" style={{ color: C.textMuted }}>
              {isLogin
                ? "Sign in to continue your interview prep journey."
                : "Start your free trial — no credit card required."}
            </p>
          </div>

          {/* Forms (animated swap) */}
          <div className="relative overflow-hidden">
            <div
              className="transition-all duration-300 ease-in-out"
              style={{
                opacity: isLogin ? 1 : 0,
                transform: isLogin ? "translateX(0)" : "translateX(-16px)",
                position: isLogin ? "relative" : "absolute",
                inset: isLogin ? "auto" : 0,
                pointerEvents: isLogin ? "auto" : "none",
              }}
            >
              <LoginForm />
            </div>
            <div
              className="transition-all duration-300 ease-in-out"
              style={{
                opacity: !isLogin ? 1 : 0,
                transform: !isLogin ? "translateX(0)" : "translateX(16px)",
                position: !isLogin ? "relative" : "absolute",
                inset: !isLogin ? "auto" : 0,
                pointerEvents: !isLogin ? "auto" : "none",
              }}
            >
              <SignupForm />
            </div>
          </div>

          {/* Toggle link */}
          <p className="text-center text-sm mt-4" style={{ color: C.textMuted }}>
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="font-semibold underline underline-offset-4 transition-colors"
              style={{ color: C.primary }}
            >
              {isLogin ? "Start free trial" : "Sign in"}
            </button>
          </p>
        </div>

        {/* Footer */}
        <p className="absolute bottom-5 text-xs" style={{ color: C.textDim }}>
          By continuing you agree to our{" "}
          <Link to="#" className="underline underline-offset-2 hover:opacity-80" style={{ color: C.textMuted }}>
            Terms
          </Link>{" "}
          &{" "}
          <Link to="#" className="underline underline-offset-2 hover:opacity-80" style={{ color: C.textMuted }}>
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
}
