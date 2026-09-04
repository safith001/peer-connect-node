"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationContext";

/**
 * ==============================================================================
 * Unified App Navigation Bar (Navbar)
 * ==============================================================================
 * 
 * Features:
 * - Active route highlighting
 * - Live pending peer request count badge
 * - Live unread message count badge
 * - Responsive mobile slide-out drawer
 * - User profile pill with dynamic avatar
 * - Seamless Sign Out action
 */
export default function Navbar() {
  const { user, profile, logout } = useAuth();
  const { pendingRequestsCount, unreadMessagesCount } = useNotifications();
  const pathname = usePathname();
  const router = useRouter();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: "📊" },
    { href: "/feed", label: "Campus Feed", icon: "📰" },
    { href: "/peers", label: "Classmates", icon: "👥" },
    {
      href: "/peers/requests",
      label: "Requests",
      icon: "📬",
      badge: pendingRequestsCount > 0 ? pendingRequestsCount : null,
    },
    {
      href: "/messages",
      label: "Messages",
      icon: "💬",
      badge: unreadMessagesCount > 0 ? unreadMessagesCount : null,
    },
  ];

  return (
    <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/dashboard" className="flex items-center space-x-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition">
            P
          </div>
          <span className="font-extrabold text-lg tracking-tight text-white group-hover:text-indigo-300 transition">
            PeerConnect
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center space-x-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative px-3.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5 ${
                  isActive
                    ? "bg-indigo-600/30 text-white border border-indigo-500/40 shadow-sm shadow-indigo-500/10"
                    : "text-slate-300 hover:text-white hover:bg-white/5"
                }`}
              >
                <span>{link.icon}</span>
                <span>{link.label}</span>
                {link.badge && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full bg-pink-500 text-white text-[9px] font-black animate-pulse">
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Profile & Actions */}
        <div className="hidden md:flex items-center space-x-3">
          <Link
            href="/profile/edit"
            className="flex items-center space-x-2 p-1 pl-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition"
          >
            <div className="text-right">
              <span className="text-xs font-bold text-white block leading-tight">
                {profile?.name || user?.displayName || "Student"}
              </span>
              <span className="text-[10px] text-indigo-300 block leading-tight">
                Sem {profile?.semester || 1}
              </span>
            </div>
            <Image
              src={
                profile?.photoURL ||
                `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                  profile?.name || "User"
                )}`
              }
              alt="Avatar"
              width={32}
              height={32}
              className="w-8 h-8 rounded-lg border border-indigo-400/40 bg-slate-800"
              unoptimized
            />
          </Link>

          <button
            onClick={handleLogout}
            title="Sign Out"
            className="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 hover:text-red-300 text-slate-400 border border-white/10 transition cursor-pointer text-xs font-semibold"
          >
            🚪
          </button>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white transition"
          aria-label="Toggle Menu"
        >
          {mobileMenuOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile Slide-Down Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden px-4 pt-2 pb-6 border-t border-white/10 bg-slate-950/95 space-y-2 animate-fade-in">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`w-full px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-between ${
                  isActive
                    ? "bg-indigo-600 text-white"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span>{link.icon}</span>
                  <span>{link.label}</span>
                </div>
                {link.badge && (
                  <span className="px-2 py-0.5 rounded-full bg-pink-500 text-white text-xs font-bold">
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}

          <div className="pt-3 border-t border-white/10 flex items-center justify-between">
            <Link
              href="/profile/edit"
              onClick={() => setMobileMenuOpen(false)}
              className="text-xs font-semibold text-indigo-400 hover:underline"
            >
              Edit Profile ({profile?.name || "Student"})
            </Link>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-300 text-xs font-semibold"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
