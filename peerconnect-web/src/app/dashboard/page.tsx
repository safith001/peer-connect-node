"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";

/**
 * ==============================================================================
 * User Dashboard (`/dashboard`)
 * ==============================================================================
 * 
 * Features:
 * 1. Unified `<Navbar />` with real-time request and message badges.
 * 2. Welcome Banner with verified Firebase Auth session status.
 * 3. Live Academic Alerts & Action Center:
 *    - Real-time Pending Peer Requests with 1-click Accept / Decline
 *    - Recent Chat Conversations with unread indicators
 * 4. Academic Profile Card & Quick Navigation Cards.
 */
export default function DashboardPage() {
  const { user, profile } = useAuth();
  const { pendingRequests, pendingRequestsCount, recentConversations, unreadMessagesCount } =
    useNotifications();

  const [processingId, setProcessingId] = useState<string | null>(null);

  // Quick Accept peer request directly from the dashboard
  const handleAcceptRequest = async (requestId: string) => {
    setProcessingId(requestId);
    try {
      await updateDoc(doc(db, "peer_requests", requestId), {
        status: "accepted",
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Error accepting request:", err);
    } finally {
      setProcessingId(null);
    }
  };

  // Quick Decline peer request directly from the dashboard
  const handleDeclineRequest = async (requestId: string) => {
    setProcessingId(requestId);
    try {
      await updateDoc(doc(db, "peer_requests", requestId), {
        status: "declined",
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Error declining request:", err);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-slate-100 flex flex-col">
        {/* Unified Application Navbar */}
        <Navbar />

        {/* Main Content Area */}
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
          {/* Welcome Banner */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-indigo-900/60 via-purple-900/40 to-slate-900/60 border border-white/15 backdrop-blur-xl shadow-2xl mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-3">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Active Session &bull; Firebase Auth Verified</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-white">
                Welcome, {profile?.name || user?.displayName || "Student"}!
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl">
                Here is your academic profile, live alerts, and peer connectivity hub. Connect with classmates or start real-time chats below.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/feed"
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs sm:text-sm shadow-lg shadow-indigo-600/30 transition cursor-pointer"
              >
                Go to Feed &rarr;
              </Link>
            </div>
          </div>

          {/* ==================================================================== */}
          {/* Live Alerts & Notification Center                                    */}
          {/* ==================================================================== */}
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                  🔔
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-white">
                  Notifications & Quick Actions
                </h2>
                {(pendingRequestsCount > 0 || unreadMessagesCount > 0) && (
                  <span className="px-2.5 py-0.5 rounded-full bg-pink-500/20 border border-pink-500/40 text-pink-300 text-xs font-bold animate-pulse">
                    {pendingRequestsCount + unreadMessagesCount} New
                  </span>
                )}
              </div>
              <Link
                href="/peers/requests"
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 hover:underline"
              >
                Manage Requests &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Card 1: Pending Peer Requests */}
              <div className="p-5 sm:p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">📬</span>
                      <h3 className="font-bold text-white text-sm sm:text-base">
                        Peer Connection Requests
                      </h3>
                    </div>
                    {pendingRequestsCount > 0 ? (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold">
                        {pendingRequestsCount} Pending
                      </span>
                    ) : (
                      <span className="text-xs text-emerald-400 flex items-center space-x-1">
                        <span>✓</span>
                        <span>All caught up</span>
                      </span>
                    )}
                  </div>

                  {pendingRequests.length === 0 ? (
                    <div className="py-6 text-center text-slate-400 text-xs">
                      <p className="text-2xl mb-1">🎉</p>
                      <p>No pending peer requests at this moment.</p>
                      <Link
                        href="/peers"
                        className="mt-2 inline-block text-indigo-400 hover:underline font-medium"
                      >
                        Browse classmates to connect &rarr;
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3 mt-3">
                      {pendingRequests.slice(0, 3).map((req) => (
                        <div
                          key={req.id}
                          className="p-3 rounded-2xl bg-slate-800/80 border border-white/10 flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center space-x-3 min-w-0">
                            {req.senderPhoto ? (
                              <Image
                                src={req.senderPhoto}
                                alt={req.senderName}
                                width={36}
                                height={36}
                                className="w-9 h-9 rounded-full border border-indigo-400/40 bg-slate-900 shrink-0"
                                unoptimized
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-indigo-600/30 flex items-center justify-center text-white text-sm font-bold shrink-0">
                                {req.senderName.charAt(0)}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-xs sm:text-sm font-semibold text-white truncate">
                                {req.senderName}
                              </p>
                              <p className="text-[11px] text-slate-400 truncate">
                                {req.senderFaculty || "Student"}
                              </p>
                            </div>
                          </div>

                          {/* Quick 1-Click Accept / Decline */}
                          <div className="flex items-center space-x-1.5 shrink-0">
                            <button
                              type="button"
                              disabled={processingId === req.id}
                              onClick={() => handleAcceptRequest(req.id)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition cursor-pointer disabled:opacity-50"
                            >
                              {processingId === req.id ? "..." : "Accept"}
                            </button>
                            <button
                              type="button"
                              disabled={processingId === req.id}
                              onClick={() => handleDeclineRequest(req.id)}
                              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-red-500/20 hover:text-red-300 text-slate-400 text-xs font-medium transition cursor-pointer disabled:opacity-50"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {pendingRequests.length > 3 && (
                  <Link
                    href="/peers/requests"
                    className="text-xs font-semibold text-indigo-400 hover:underline mt-3 block text-center"
                  >
                    View all {pendingRequests.length} requests &rarr;
                  </Link>
                )}
              </div>

              {/* Card 2: Recent Conversations & Messages */}
              <div className="p-5 sm:p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">💬</span>
                      <h3 className="font-bold text-white text-sm sm:text-base">
                        Recent Messages & Chats
                      </h3>
                    </div>
                    {unreadMessagesCount > 0 ? (
                      <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold">
                        {unreadMessagesCount} Unread
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">Live chat ready</span>
                    )}
                  </div>

                  {recentConversations.length === 0 ? (
                    <div className="py-6 text-center text-slate-400 text-xs">
                      <p className="text-2xl mb-1">✉️</p>
                      <p>No active conversations yet.</p>
                      <Link
                        href="/peers"
                        className="mt-2 inline-block text-indigo-400 hover:underline font-medium"
                      >
                        Connect with peers to start messaging &rarr;
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3 mt-3">
                      {recentConversations.slice(0, 3).map((convo) => {
                        const otherUid = convo.participants.find((p) => p !== user?.uid);
                        const otherPeer = otherUid ? convo.participantData?.[otherUid] : null;
                        const isUnread =
                          convo.lastMessage &&
                          convo.lastMessage.senderId !== user?.uid &&
                          (!convo.readBy || !convo.readBy.includes(user?.uid || ""));

                        return (
                          <Link
                            key={convo.id}
                            href="/messages"
                            className="p-3 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-white/10 transition flex items-center justify-between gap-3 group"
                          >
                            <div className="flex items-center space-x-3 min-w-0">
                              {otherPeer?.photoURL ? (
                                <Image
                                  src={otherPeer.photoURL}
                                  alt={otherPeer.name || "Peer"}
                                  width={36}
                                  height={36}
                                  className="w-9 h-9 rounded-full border border-indigo-400/40 bg-slate-900 shrink-0"
                                  unoptimized
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-full bg-violet-600/30 flex items-center justify-center text-white text-sm font-bold shrink-0">
                                  {otherPeer?.name?.charAt(0) || "P"}
                                </div>
                              )}
                              <div className="min-w-0">
                                <div className="flex items-center space-x-2">
                                  <p className="text-xs sm:text-sm font-semibold text-white truncate group-hover:text-indigo-300 transition">
                                    {otherPeer?.name || "Peer"}
                                  </p>
                                  {isUnread && (
                                    <span className="w-2 h-2 rounded-full bg-pink-500 shrink-0" />
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-400 truncate">
                                  {convo.lastMessage?.text || "Started conversation"}
                                </p>
                              </div>
                            </div>

                            <span className="text-xs font-semibold text-indigo-400 group-hover:text-indigo-300 shrink-0">
                              Chat &rarr;
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>

                <Link
                  href="/messages"
                  className="px-4 py-2 mt-4 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-xs font-semibold text-center transition block"
                >
                  Open Messaging Inbox &rarr;
                </Link>
              </div>
            </div>
          </div>

          {/* Grid Layout: Profile Card & Action Hub */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                  <span>🎓</span>
                  <span>Academic Profile</span>
                </h2>
                <Link
                  href="/profile/edit"
                  className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 hover:underline"
                >
                  Edit &rarr;
                </Link>
              </div>

              {/* User Avatar & Identity Header */}
              <div className="flex items-center space-x-3.5 mb-4 pb-4 border-b border-white/10">
                <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-indigo-400/40 bg-slate-800 shrink-0">
                  <Image
                    src={
                      profile?.photoURL ||
                      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                        profile?.name || "Peer"
                      )}`
                    }
                    alt="Avatar"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-white font-bold text-base truncate">{profile?.name || "Student"}</p>
                  <p className="text-slate-400 font-mono text-xs truncate">{user?.email}</p>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-xs uppercase text-slate-400 font-semibold block">Faculty</span>
                    <p className="text-white font-medium">{profile?.faculty || "General"}</p>
                  </div>
                  <div>
                    <span className="text-xs uppercase text-slate-400 font-semibold block">Semester</span>
                    <p className="text-white font-medium">Semester {profile?.semester || "1"}</p>
                  </div>
                </div>

                {profile?.studentId && (
                  <div>
                    <span className="text-xs uppercase text-slate-400 font-semibold block">Student ID</span>
                    <p className="text-slate-200 font-mono text-xs">{profile.studentId}</p>
                  </div>
                )}

                <div className="pt-2 border-t border-white/5">
                  <span className="text-xs uppercase text-slate-400 font-semibold block">Bio</span>
                  <p className="text-slate-300 text-xs italic mt-1">&ldquo;{profile?.bio || "No bio added yet."}&rdquo;</p>
                </div>

                {profile?.skills && profile.skills.length > 0 && (
                  <div className="pt-2 border-t border-white/5">
                    <span className="text-xs uppercase text-slate-400 font-semibold block mb-1.5">Academic Skills</span>
                    <div className="flex flex-wrap gap-1.5">
                      {profile.skills.map((skill: string) => (
                        <span
                          key={skill}
                          className="px-2 py-0.5 rounded-md bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[11px] font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Access Channels */}
            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link
                href="/feed"
                className="p-6 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition group flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-2xl mb-4 group-hover:scale-105 transition">
                    📰
                  </div>
                  <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition">
                    Campus Feed
                  </h3>
                  <p className="text-slate-400 text-sm mt-1">
                    Share updates, read classmates&apos; posts, leave comments, and see real-time reactions.
                  </p>
                </div>
                <span className="text-xs font-semibold text-indigo-400 mt-4 inline-block">
                  Open Feed &rarr;
                </span>
              </Link>

              <Link
                href="/peers"
                className="p-6 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition group flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center text-2xl mb-4 group-hover:scale-105 transition">
                    👥
                  </div>
                  <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition">
                    Peer Directory
                  </h3>
                  <p className="text-slate-400 text-sm mt-1">
                    Search for students in your faculty or semester and send connection requests.
                  </p>
                </div>
                <span className="text-xs font-semibold text-purple-400 mt-4 inline-block">
                  Find Peers &rarr;
                </span>
              </Link>

              <Link
                href="/messages"
                className="p-6 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition group flex flex-col justify-between sm:col-span-2"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center text-2xl mb-4 group-hover:scale-105 transition">
                    💬
                  </div>
                  <h3 className="text-lg font-bold text-white group-hover:text-pink-300 transition">
                    Real-time 1-on-1 Messages
                  </h3>
                  <p className="text-slate-400 text-sm mt-1">
                    Direct messaging with your connected peers. Instant message delivery powered by Cloud Firestore.
                  </p>
                </div>
                <span className="text-xs font-semibold text-pink-400 mt-4 inline-block">
                  Launch Chat &rarr;
                </span>
              </Link>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
