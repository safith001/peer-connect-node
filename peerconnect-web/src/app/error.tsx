"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

/**
 * ==============================================================================
 * Global App Router Error Boundary (`error.tsx`)
 * ==============================================================================
 * 
 * ARCHITECTURE NOTE:
 * Next.js App Router requires `error.tsx` to be a Client Component (`"use client"`).
 * 
 * When an unhandled runtime error or network timeout occurs in a page segment:
 * 1. This component catches the error, preventing the entire tab from crashing.
 * 2. It logs the error report for debugging.
 * 3. The `reset()` function allows the user to re-render the page tree gracefully.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to console or error-reporting service (e.g. Sentry)
    console.error("Caught by PeerConnect Error Boundary:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-slate-100 selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute w-96 h-96 rounded-full bg-red-600/10 blur-[120px] pointer-events-none -top-20 -left-20 animate-pulse" />
      <div className="absolute w-96 h-96 rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none -bottom-20 -right-20 animate-pulse" />

      <div className="relative z-10 w-full max-w-md p-8 sm:p-10 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl text-center">
        {/* Brand Logo Card */}
        <div className="relative w-16 h-16 mx-auto mb-6 rounded-2xl overflow-hidden shadow-lg border border-indigo-500/30">
          <Image
            src="/logo.png"
            alt="PeerConnect Logo"
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* Error Badge */}
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider mb-4">
          <span>⚠️ Connection Interrupted</span>
        </div>

        {/* Headline */}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-3">
          Something Went Wrong
        </h1>

        <p className="text-sm text-slate-300 mb-6 leading-relaxed">
          A temporary network or rendering hiccup occurred on campus. Don&apos;t worry, your student account and notes are completely safe.
        </p>

        {/* Error Digest (Technical Debug Details) */}
        {error?.message && (
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-left font-mono text-[11px] text-red-300 mb-6 max-h-24 overflow-y-auto break-all">
            {error.message}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* Try Again (Triggers Next.js reset()) */}
          <button
            onClick={() => reset()}
            className="w-full py-3 px-5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-semibold shadow-lg shadow-indigo-500/25 transition text-sm cursor-pointer flex items-center justify-center space-x-2"
          >
            <span>🔄</span>
            <span>Try Again</span>
          </button>

          {/* Fallback to Home */}
          <Link
            href="/"
            className="block w-full py-3 px-5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-slate-200 font-semibold transition text-sm text-center"
          >
            Return to Home Page
          </Link>
        </div>
      </div>

      <p className="mt-8 text-xs text-slate-500 text-center">
        PeerConnect &bull; Client Resilience Guard
      </p>
    </div>
  );
}
