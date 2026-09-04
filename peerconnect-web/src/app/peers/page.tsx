"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  collection,
  query,
  getDocs,
  addDoc,
  where,
  onSnapshot,
  serverTimestamp,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

/**
 * ==============================================================================
 * Peer Directory Page (`/peers`)
 * ==============================================================================
 * 
 * In SQL/Laravel:
 * Handled by `UserController::index()` querying the `users` table joined with
 * `peer_requests`.
 * 
 * In Cloud Firestore NoSQL:
 * 1. We query `users` collection (excluding ourselves: `uid !== user.uid`).
 * 2. We attach a real-time listener to `peer_requests` involving the current user:
 *    - `sender_id == currentUserId` OR `receiver_id == currentUserId`
 * 3. We dynamically compute the relationship status for each peer:
 *    - "none" -> Show [Connect] button
 *    - "sent" -> Show [Pending...] indicator
 *    - "received" -> Show [Accept / Decline] triggers
 *    - "connected" -> Show [Connected • Message &rarr;] link
 */

interface PeerUser {
  uid: string;
  name: string;
  email: string;
  faculty?: string | null;
  semester?: number | null;
  studentId?: string | null;
  bio?: string | null;
  photoURL?: string | null;
}

interface PeerRequestRecord {
  id: string;
  senderId: string;
  receiverId: string;
  status: "pending" | "accepted" | "declined";
}

export default function PeersPage() {
  const { user, profile } = useAuth();

  const [peers, setPeers] = useState<PeerUser[]>([]);
  const [requests, setRequests] = useState<PeerRequestRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [facultyFilter, setFacultyFilter] = useState("All");
  const [isLoading, setIsLoading] = useState(true);
  const [connectingUid, setConnectingUid] = useState<string | null>(null);

  // 1. Fetch available students from Cloud Firestore
  useEffect(() => {
    if (!user) return;

    const fetchStudents = async () => {
      try {
        const usersQuery = query(collection(db, "users"), limit(60));
        const snapshot = await getDocs(usersQuery);

        const list: PeerUser[] = [];
        snapshot.forEach((docSnap) => {
          if (docSnap.id !== user.uid) {
            list.push({ uid: docSnap.id, ...(docSnap.data() as Omit<PeerUser, "uid">) });
          }
        });

        setPeers(list);
      } catch (err) {
        console.error("Error loading student directory:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudents();
  }, [user]);

  // 2. Real-time listener for connection requests involving this student
  useEffect(() => {
    if (!user) return;

    // Listen for requests sent by or sent to this user
    const q1 = query(collection(db, "peer_requests"), where("senderId", "==", user.uid));
    const q2 = query(collection(db, "peer_requests"), where("receiverId", "==", user.uid));

    const unsub1 = onSnapshot(q1, (snap1) => {
      const sent = snap1.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<PeerRequestRecord, "id">) }));
      setRequests((prev) => {
        const received = prev.filter((r) => r.receiverId === user.uid);
        return [...sent, ...received];
      });
    });

    const unsub2 = onSnapshot(q2, (snap2) => {
      const received = snap2.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<PeerRequestRecord, "id">) }));
      setRequests((prev) => {
        const sent = prev.filter((r) => r.senderId === user.uid);
        return [...sent, ...received];
      });
    });

    return () => {
      unsub1();
      unsub2();
    };
  }, [user]);

  // Helper: determine connection state with a given peer
  const getConnectionStatus = (peerUid: string) => {
    const existing = requests.find(
      (r) =>
        (r.senderId === user?.uid && r.receiverId === peerUid) ||
        (r.receiverId === user?.uid && r.senderId === peerUid)
    );

    if (!existing) return { status: "none", record: null };
    if (existing.status === "accepted") return { status: "accepted", record: existing };
    if (existing.senderId === user?.uid && existing.status === "pending")
      return { status: "pending_sent", record: existing };
    if (existing.receiverId === user?.uid && existing.status === "pending")
      return { status: "pending_received", record: existing };
    return { status: "none", record: null };
  };

  // Action: Send connection request
  const handleConnect = async (peer: PeerUser) => {
    if (!user) return;
    setConnectingUid(peer.uid);

    try {
      await addDoc(collection(db, "peer_requests"), {
        senderId: user.uid,
        senderName: profile?.name || user.displayName || "Student",
        senderPhoto: profile?.photoURL || null,
        receiverId: peer.uid,
        receiverName: peer.name,
        status: "pending",
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Error sending peer request:", err);
      alert("Failed to send peer request.");
    } finally {
      setConnectingUid(null);
    }
  };

  // Filter peers by search input & faculty
  const filteredPeers = peers.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.faculty && p.faculty.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.studentId && p.studentId.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesFaculty = facultyFilter === "All" || p.faculty === facultyFilter;
    return matchesSearch && matchesFaculty;
  });

  const uniqueFaculties = ["All", ...Array.from(new Set(peers.map((p) => p.faculty).filter(Boolean)))];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-slate-100 flex flex-col">
        {/* Navigation Header */}
        <header className="border-b border-white/10 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link href="/dashboard" className="flex items-center space-x-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-indigo-500/20">
                  P
                </div>
                <span className="font-bold text-lg text-white">PeerConnect</span>
              </Link>
            </div>

            <nav className="flex items-center space-x-6 text-sm font-medium text-slate-300">
              <Link href="/dashboard" className="hover:text-white transition">
                Dashboard
              </Link>
              <Link href="/feed" className="hover:text-white transition">
                Feed
              </Link>
              <Link href="/peers" className="text-indigo-400 font-semibold">
                Peers
              </Link>
              <Link href="/messages" className="hover:text-white transition">
                Messages
              </Link>
            </nav>

            <Link
              href="/dashboard"
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-slate-300 transition"
            >
              My Profile
            </Link>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8">
          {/* Header & Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-extrabold text-white">Campus Student Directory</h1>
              <p className="text-slate-300 text-sm mt-1">
                Discover classmates in your faculty, collaborate on coursework, and grow your peer network
              </p>
            </div>

            {/* Quick Filter Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or student ID..."
                className="px-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              />

              <select
                value={facultyFilter}
                onChange={(e) => setFacultyFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              >
                {uniqueFaculties.map((f) => (
                  <option key={String(f)} value={String(f)} className="bg-slate-900">
                    Faculty: {f}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Peer Cards Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="p-6 rounded-3xl bg-white/5 border border-white/10 animate-pulse space-y-4">
                  <div className="w-14 h-14 rounded-full bg-slate-800 mx-auto" />
                  <div className="h-4 bg-slate-800 rounded w-1/2 mx-auto" />
                  <div className="h-3 bg-slate-800 rounded w-3/4 mx-auto" />
                </div>
              ))}
            </div>
          ) : filteredPeers.length === 0 ? (
            <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10">
              <span className="text-4xl block mb-3">🔍</span>
              <h3 className="text-lg font-bold text-white">No classmates found</h3>
              <p className="text-slate-400 text-sm mt-1">Try adjusting your search keywords or faculty filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPeers.map((peer) => {
                const { status } = getConnectionStatus(peer.uid);
                const isConnecting = connectingUid === peer.uid;

                return (
                  <div
                    key={peer.uid}
                    className="p-6 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/15 shadow-xl flex flex-col justify-between hover:border-white/25 transition"
                  >
                    <div>
                      {/* Avatar & Badges */}
                      <div className="flex items-center space-x-3 mb-4">
                        <Image
                          src={
                            peer.photoURL ||
                            `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(peer.name)}`
                          }
                          alt={peer.name}
                          width={48}
                          height={48}
                          className="w-12 h-12 rounded-full border border-indigo-400/30 bg-slate-800 shrink-0"
                          unoptimized
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-white text-base truncate">{peer.name}</h3>
                          <p className="text-xs text-indigo-300 truncate">
                            {peer.faculty || "General"} &bull; Sem {peer.semester || 1}
                          </p>
                        </div>
                      </div>

                      {/* Bio */}
                      <p className="text-slate-300 text-xs line-clamp-2 italic mb-4">
                        &ldquo;{peer.bio || "Active campus peer."}&rdquo;
                      </p>

                      {/* Student ID badge */}
                      {peer.studentId && (
                        <div className="inline-block px-2.5 py-1 rounded-lg bg-slate-800/80 text-slate-400 font-mono text-[10px] mb-4">
                          ID: {peer.studentId}
                        </div>
                      )}
                    </div>

                    {/* Action Button States */}
                    <div className="pt-3 border-t border-white/10">
                      {status === "accepted" ? (
                        <Link
                          href={`/messages?with=${peer.uid}`}
                          className="w-full py-2 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center justify-center space-x-1 transition"
                        >
                          <span>💬</span>
                          <span>Connected &bull; Message</span>
                        </Link>
                      ) : status === "pending_sent" ? (
                        <button
                          disabled
                          className="w-full py-2 px-3 rounded-xl bg-white/5 border border-white/10 text-slate-400 text-xs font-medium cursor-not-allowed text-center"
                        >
                          ⏳ Request Pending
                        </button>
                      ) : status === "pending_received" ? (
                        <Link
                          href="/peers/requests"
                          className="w-full py-2 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center justify-center space-x-1 transition"
                        >
                          <span>📬</span>
                          <span>Respond to Request</span>
                        </Link>
                      ) : (
                        <button
                          onClick={() => handleConnect(peer)}
                          disabled={isConnecting}
                          className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition disabled:opacity-50 cursor-pointer text-center"
                        >
                          {isConnecting ? "Sending..." : "➕ Connect"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
