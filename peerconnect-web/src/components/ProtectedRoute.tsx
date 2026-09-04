"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

/**
 * ==============================================================================
 * ProtectedRoute Component (The "Bouncer")
 * ==============================================================================
 * 
 * Equivalent to Laravel's `middleware(['auth'])` or Spring Security's
 * `.authenticated()`.
 * 
 * Any view wrapped inside `<ProtectedRoute>` will verify:
 * 1. While auth state is loading from local storage: Renders a loading spinner.
 * 2. If unauthenticated: Redirects immediately to `/login`.
 * 3. If authenticated: Renders the protected page contents.
 */
export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-200">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium text-slate-400">Authenticating session...</p>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect via the useEffect
  }

  return <>{children}</>;
}
