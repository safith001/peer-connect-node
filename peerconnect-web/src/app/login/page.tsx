"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, sendEmailVerification, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

/**
 * ==============================================================================
 * User Login Page (`/login`) with Email Verification Gate
 * ==============================================================================
 * 
 * LIFECYCLE FLOW:
 * 1. User inputs Email and Password.
 * 2. On submit: We call `signInWithEmailAndPassword(auth, email, password)`.
 * 3. We check `user.emailVerified`:
 *    - If FALSE: We block login, immediately `signOut(auth)`, and show an alert
 *      asking them to check their email, plus a "Resend Verification Link" button.
 *    - If TRUE: Access granted! We redirect to `/dashboard`.
 */
export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Tracks if the last attempt failed because the account is unverified
  const [isUnverified, setIsUnverified] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setIsUnverified(false);
    setIsLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Check if the user's email has been verified
      if (!user.emailVerified) {
        // Sign out immediately so unverified token is not kept
        await signOut(auth);
        setIsUnverified(true);
        setError("Your email is not verified yet. Please check your inbox to activate your account.");
        return;
      }

      // Email is verified — proceed to dashboard
      router.push("/dashboard");
    } catch (err: unknown) {
      console.error("Login error:", err);
      const firebaseError = err as { code?: string; message?: string };
      if (
        firebaseError.code === "auth/invalid-credential" ||
        firebaseError.code === "auth/wrong-password" ||
        firebaseError.code === "auth/user-not-found"
      ) {
        setError("Invalid email or password. Please try again.");
      } else if (firebaseError.code === "auth/too-many-requests") {
        setError("Too many failed attempts. Please wait a moment before trying again.");
      } else {
        setError("Login failed. Please check your credentials and connection.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Resend the verification link
  const handleResendEmail = async () => {
    if (!email || !password) {
      setError("Please re-enter your email and password to resend the verification link.");
      return;
    }

    setIsResending(true);
    setError(null);
    setSuccessMsg(null);

    try {
      // Temporarily authenticate to get user object
      const cred = await signInWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(cred.user);
      await signOut(auth);
      setSuccessMsg(`Verification email has been resent to ${email}. Please check your inbox (and spam folder)!`);
    } catch (err) {
      console.error("Resend error:", err);
      setError("Failed to resend verification email. Please try again in a moment.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-slate-100">
      <div className="w-full max-w-md p-8 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
        {/* Header with Logo */}
        <div className="text-center mb-8">
          <div className="relative w-16 h-16 mx-auto mb-3 rounded-2xl overflow-hidden shadow-lg border border-indigo-500/30">
            <Image
              src="/logo.png"
              alt="PeerConnect Logo"
              fill
              className="object-cover"
              priority
            />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Welcome Back</h1>
          <p className="text-slate-300 text-sm mt-1">Sign in to your PeerConnect account</p>
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div className="mb-6 p-3 rounded-lg bg-emerald-500/20 border border-emerald-500/50 text-emerald-200 text-sm flex items-start space-x-2">
            <span className="font-bold">✓</span>
            <span>{successMsg}</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-200 text-sm flex flex-col space-y-2">
            <div className="flex items-start space-x-2">
              <span className="font-bold">⚠️</span>
              <span>{error}</span>
            </div>
            {isUnverified && (
              <button
                type="button"
                onClick={handleResendEmail}
                disabled={isResending}
                className="mt-2 text-xs font-semibold text-indigo-300 hover:text-indigo-200 underline text-left cursor-pointer"
              >
                {isResending ? "Resending email..." : "Didn't get the email? Click here to resend"}
              </button>
            )}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@university.edu"
              className="w-full px-4 py-2.5 rounded-lg bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-lg bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-medium shadow-lg hover:shadow-indigo-500/25 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-2"
          >
            {isLoading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-sm text-slate-400 mt-6">
          Don&apos;t have an account yet?{" "}
          <Link href="/register" className="text-indigo-400 hover:text-indigo-300 font-semibold underline underline-offset-4">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}

