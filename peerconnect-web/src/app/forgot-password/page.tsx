"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";

/**
 * ==============================================================================
 * Forgot Password / Password Reset Page (`/forgot-password`)
 * ==============================================================================
 * 
 * ARCHITECTURAL CONCEPT:
 * In a traditional backend (Java Spring or Python FastAPI), password resets require:
 * 1. Generating a cryptographically random token with an expiration timestamp (e.g. 15 mins).
 * 2. Storing the token hash in a database table (`password_resets`).
 * 3. Wiring up an SMTP email server (SendGrid / AWS SES) to dispatch the reset link.
 * 4. A separate controller route to validate the token and hash the new password.
 * 
 * WITH FIREBASE AUTH:
 * Google manages the entire token lifecycle, rate-limiting, and email delivery
 * via `sendPasswordResetEmail(auth, email)`. The student receives a secure one-time
 * reset link from Google's auth servers, sets their new password, and can log back in.
 */
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    // Basic client-side email format validation
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      setError("Please enter a valid university or student email address.");
      return;
    }

    setIsLoading(true);

    try {
      // Firebase sends a password reset link to the specified email address
      await sendPasswordResetEmail(auth, trimmedEmail);
      
      setSuccessMsg(
        `A password reset link has been dispatched to ${trimmedEmail}. Please inspect your inbox (and spam folder) to set a new password.`
      );
      setEmail(""); // Reset input field on success
    } catch (err: unknown) {
      console.error("Password reset error:", err);
      const firebaseError = err as { code?: string; message?: string };

      if (firebaseError.code === "auth/user-not-found") {
        // In production security, we often show a generic message to prevent user enumeration,
        // but for student UX we can be clear or friendly:
        setError("No account found with this email address. Please check your spelling or sign up.");
      } else if (firebaseError.code === "auth/invalid-email") {
        setError("Invalid email address format. Please provide a valid email.");
      } else if (firebaseError.code === "auth/too-many-requests") {
        setError("Too many reset attempts recently. Please wait a few minutes before trying again.");
      } else {
        setError("Failed to send password reset email. Please verify your internet connection and try again.");
      }
    } finally {
      setIsLoading(false);
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
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Reset Password</h1>
          <p className="text-slate-300 text-sm mt-1">
            Enter your registered email and we will send you a secure recovery link
          </p>
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-200 text-sm flex items-start space-x-3">
            <span className="text-lg leading-none">✓</span>
            <div className="flex-1 leading-relaxed">
              <p className="font-semibold mb-1">Recovery Email Dispatched</p>
              <p>{successMsg}</p>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/20 border border-red-500/50 text-red-200 text-sm flex items-start space-x-3">
            <span className="text-lg leading-none">⚠️</span>
            <span className="flex-1 leading-relaxed">{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
              Student Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@university.edu"
              className="w-full px-4 py-2.5 rounded-lg bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-medium shadow-lg hover:shadow-indigo-500/25 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-2"
          >
            {isLoading ? "Sending Recovery Link..." : "Send Reset Link"}
          </button>
        </form>

        {/* Return to Login Navigation */}
        <div className="mt-6 pt-6 border-t border-white/10 text-center text-sm text-slate-400">
          Remembered your password?{" "}
          <Link
            href="/login"
            className="text-indigo-400 hover:text-indigo-300 font-semibold underline underline-offset-4"
          >
            Back to Sign In
          </Link>
        </div>

      </div>
    </div>
  );
}
