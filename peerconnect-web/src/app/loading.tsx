import React from "react";
import Image from "next/image";

/**
 * ==============================================================================
 * Global App Router Loading State (`loading.tsx`)
 * ==============================================================================
 * 
 * ARCHITECTURE NOTE:
 * In Next.js App Router, this file automatically creates a React Suspense
 * boundary around the root layout and pages.
 * 
 * Whenever a route transition occurs or dynamic server components are
 * streaming, this component renders instantly to eliminate jarring white flashes.
 */
export default function Loading() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-slate-100 p-4 relative overflow-hidden select-none">
      {/* Background Ambient Glow Accents */}
      <div className="absolute w-72 h-72 rounded-full bg-indigo-600/10 blur-[100px] pointer-events-none -top-10 -left-10 animate-pulse" />
      <div className="absolute w-72 h-72 rounded-full bg-violet-600/10 blur-[100px] pointer-events-none -bottom-10 -right-10 animate-pulse" />

      <div className="relative z-10 flex flex-col items-center max-w-sm text-center">
        {/* Animated Logo Container with Glow Ring */}
        <div className="relative mb-6">
          {/* Subtle Outer Pulsing Ring */}
          <div className="absolute -inset-2 rounded-3xl bg-gradient-to-tr from-indigo-500/30 via-violet-500/20 to-cyan-500/30 blur-md animate-pulse" />
          
          {/* Logo Card */}
          <div className="relative w-20 h-20 rounded-2xl overflow-hidden shadow-2xl border border-indigo-500/40 bg-slate-900/80 backdrop-blur-xl flex items-center justify-center">
            <Image
              src="/logo.png"
              alt="PeerConnect Logo"
              width={80}
              height={80}
              priority
              className="object-cover w-full h-full transform hover:scale-105 transition duration-500"
            />
          </div>

          {/* Orbiting Spinner Accent */}
          <div className="absolute -inset-1 rounded-2xl border border-indigo-400/30 border-t-indigo-400 animate-spin pointer-events-none" />
        </div>

        {/* Brand Monogram & Title */}
        <h2 className="text-xl font-extrabold tracking-tight text-white mb-1 flex items-center space-x-1.5">
          <span>PeerConnect</span>
        </h2>
        <p className="text-xs font-medium text-indigo-300/80 mb-6">
          Connecting to campus network...
        </p>

        {/* Sleek Indeterminate Progress Shimmer */}
        <div className="w-48 h-1.5 bg-slate-800/80 rounded-full overflow-hidden border border-white/10 relative">
          <div className="absolute inset-y-0 bg-gradient-to-r from-indigo-500 via-violet-400 to-cyan-400 rounded-full w-1/2 animate-shimmer" />
        </div>
      </div>
    </div>
  );
}
