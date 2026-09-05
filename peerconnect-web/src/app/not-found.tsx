import React from "react";
import Link from "next/link";
import Image from "next/image";

/**
 * ==============================================================================
 * Custom 404 Not Found Page (`not-found.tsx`)
 * ==============================================================================
 * 
 * ARCHITECTURE NOTE:
 * Next.js App Router automatically renders this component whenever:
 * 1. A user visits an unmatched URL route.
 * 2. A component programmatically triggers the `notFound()` function.
 */
export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-slate-100 selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute w-96 h-96 rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none -top-20 -left-20 animate-pulse" />
      <div className="absolute w-96 h-96 rounded-full bg-purple-600/10 blur-[120px] pointer-events-none -bottom-20 -right-20 animate-pulse" />

      <div className="relative z-10 w-full max-w-lg p-8 sm:p-10 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl text-center">
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

        {/* 404 Big Number Pill */}
        <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-pink-500/10 border border-pink-500/25 text-pink-400 text-xs font-bold uppercase tracking-widest mb-4">
          <span>Error 404</span>
        </div>

        {/* Headline with Academic Theme */}
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
          Lecture Hall Not Found
        </h1>

        <p className="text-sm text-slate-300 mb-8 leading-relaxed">
          Looks like you wandered into an empty corridor. The page, discussion post, or study resource you are looking for might have been relocated or doesn&apos;t exist on campus.
        </p>

        {/* Primary Action Button */}
        <Link
          href="/dashboard"
          className="block w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-semibold shadow-lg shadow-indigo-500/25 transition text-sm mb-4 text-center"
        >
          Return to Dashboard →
        </Link>

        {/* Secondary Quick Links */}
        <div className="pt-6 border-t border-white/10 grid grid-cols-2 gap-3 text-xs">
          <Link
            href="/feed"
            className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition text-center font-medium"
          >
            📰 Campus Feed
          </Link>
          <Link
            href="/peers"
            className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition text-center font-medium"
          >
            👥 Classmates
          </Link>
        </div>
      </div>

      {/* Subtle Bottom Credit */}
      <p className="mt-8 text-xs text-slate-500 text-center">
        PeerConnect &bull; Safe Navigation Guard
      </p>
    </div>
  );
}
