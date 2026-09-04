"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

/**
 * ==============================================================================
 * Peer Requests & Connections Manager (`/peers/requests`)
 * ==============================================================================
 * 
 * In SQL/Laravel:
 * Handled by `PeerRequestController`:
 * - `accept`: `UPDATE peer_requests SET status = 'accepted' WHERE id = ?;`
 * - `decline`: `UPDATE peer_requests SET status = 'declined' WHERE id = ?;`
 * - `unfriend`: `DELETE FROM peer_requests WHERE id = ?;`
 * 
 * In Cloud Firestore NoSQL:
 * Real-time listeners on `peer_requests`:
 * 1. Received: `receiverId == user.uid` AND `status == 'pending'`
 * 2. Sent: `senderId == user.uid` AND `status == 'pending'`
 * 3. Connected Peers: `status == 'accepted'` involving current user
 */

interface PeerRequest {
  id: string;
  senderId: string;
  senderName: string;
  senderPhoto?: string | null;
  receiverId: string;
  receiverName?: string;
  receiverPhoto?: string | null;
  status: "pending" | "accepted" | "declined";
  createdAt?: { seconds: number } | null;
}

export default function PeerRequestsPage() {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<"received" | "sent" | "connected">("received");
  const [receivedRequests, setReceivedRequests] = useState<PeerRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<PeerRequest[]>([]);
  const [connectedPeers, setConnectedPeers] = useState<PeerRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // 1. Incoming pending requests
    const qReceived = query(
      collection(db, "peer_requests"),
      where("receiverId", "==", user.uid),
      where("status", "==", "pending")
    );

    // 2. Outgoing pending requests
    const qSent = query(
      collection(db, "peer_requests"),
      where("senderId", "==", user.uid),
      where("status", "==", "pending")
    );

    // 3. Accepted connections (sent by me)
    const qConnSent = query(
      collection(db, "peer_requests"),
      where("senderId", "==", user.uid),
      where("status", "==", "accepted")
    );

    // 4. Accepted connections (received by me)
    const qConnReceived = query(
      collection(db, "peer_requests"),
      where("receiverId", "==", user.uid),
      where("status", "==", "accepted")
    );

    const unsub1 = onSnapshot(qReceived, (s) => {
      setReceivedRequests(s.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<PeerRequest, "id">) })));
      setIsLoading(false);
    });

    const unsub2 = onSnapshot(qSent, (s) => {
      setSentRequests(s.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<PeerRequest, "id">) })));
    });

    let conn1: PeerRequest[] = [];
    let conn2: PeerRequest[] = [];

    const unsub3 = onSnapshot(qConnSent, (s) => {
      conn1 = s.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<PeerRequest, "id">) }));
      setConnectedPeers([...conn1, ...conn2]);
    });

    const unsub4 = onSnapshot(qConnReceived, (s) => {
      conn2 = s.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<PeerRequest, "id">) }));
      setConnectedPeers([...conn1, ...conn2]);
    });

    return () => {
      unsub1();
      unsub2();
      unsub3();
      unsub4();
    };
  }, [user]);

  // Action: Accept incoming connection
  const handleAccept = async (requestId: string) => {
    try {
      await updateDoc(doc(db, "peer_requests", requestId), {
        status: "accepted",
        acceptedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Error accepting request:", err);
      alert("Failed to accept request.");
    }
  };

  // Action: Decline or Cancel request
  const handleDeclineOrCancel = async (requestId: string) => {
    try {
      await deleteDoc(doc(db, "peer_requests", requestId));
    } catch (err) {
      console.error("Error deleting request:", err);
      alert("Action failed. Please try again.");
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-slate-100 flex flex-col">
        {/* Navigation Bar */}
        <header className="border-b border-white/10 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
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
              href="/peers"
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-slate-300 transition"
            >
              Directory &rarr;
            </Link>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Peer Network Management</h1>
            <p className="text-slate-400 text-sm mt-1">
              Review connection invitations, manage outgoing requests, and view your connected peer network
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center space-x-2 border-b border-white/10 pb-4 mb-6">
            <button
              onClick={() => setActiveTab("received")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center space-x-2 ${
                activeTab === "received"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
              }`}
            >
              <span>Received</span>
              {receivedRequests.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-pink-500 text-white text-[10px] font-bold">
                  {receivedRequests.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("sent")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center space-x-2 ${
                activeTab === "sent"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
              }`}
            >
              <span>Sent</span>
              {sentRequests.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-slate-700 text-slate-300 text-[10px] font-bold">
                  {sentRequests.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("connected")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center space-x-2 ${
                activeTab === "connected"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
              }`}
            >
              <span>Connections</span>
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold">
                {connectedPeers.length}
              </span>
            </button>
          </div>

          {/* Tab 1: Received Requests */}
          {activeTab === "received" && (
            <div className="space-y-4">
              {isLoading ? (
                <div className="text-center py-12 text-slate-400 text-sm">Loading invitations...</div>
              ) : receivedRequests.length === 0 ? (
                <div className="text-center py-16 bg-white/5 rounded-3xl border border-white/10">
                  <span className="text-4xl block mb-2">📬</span>
                  <h3 className="font-bold text-white text-base">No pending connection requests</h3>
                  <p className="text-slate-400 text-xs mt-1">
                    When classmates invite you to connect, their invitations will appear here.
                  </p>
                </div>
              ) : (
                receivedRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 shadow-md flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center space-x-3">
                      <Image
                        src={
                          req.senderPhoto ||
                          `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                            req.senderName || "Student"
                          )}`
                        }
                        alt={req.senderName}
                        width={44}
                        height={44}
                        className="w-11 h-11 rounded-full border border-indigo-400/30 bg-slate-800 shrink-0"
                        unoptimized
                      />
                      <div>
                        <h4 className="font-bold text-white text-sm">{req.senderName}</h4>
                        <p className="text-xs text-indigo-300">Wants to connect with you</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleAccept(req.id)}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/30 transition cursor-pointer"
                      >
                        ✓ Accept
                      </button>
                      <button
                        onClick={() => handleDeclineOrCancel(req.id)}
                        className="px-3 py-2 rounded-xl bg-white/10 hover:bg-red-500/20 hover:text-red-300 text-slate-300 text-xs font-semibold transition cursor-pointer"
                      >
                        ✕ Decline
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab 2: Sent Requests */}
          {activeTab === "sent" && (
            <div className="space-y-4">
              {sentRequests.length === 0 ? (
                <div className="text-center py-16 bg-white/5 rounded-3xl border border-white/10">
                  <span className="text-4xl block mb-2">📤</span>
                  <h3 className="font-bold text-white text-base">No outgoing requests</h3>
                  <p className="text-slate-400 text-xs mt-1">
                    Explore the{" "}
                    <Link href="/peers" className="text-indigo-400 underline">
                      Student Directory
                    </Link>{" "}
                    to connect with classmates.
                  </p>
                </div>
              ) : (
                sentRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 shadow-md flex items-center justify-between gap-4"
                  >
                    <div>
                      <h4 className="font-bold text-white text-sm">
                        Request to {req.receiverName || "Classmate"}
                      </h4>
                      <p className="text-xs text-amber-300 flex items-center space-x-1 mt-0.5">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                        <span>Awaiting response...</span>
                      </p>
                    </div>

                    <button
                      onClick={() => handleDeclineOrCancel(req.id)}
                      className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-red-500/20 hover:text-red-300 text-slate-400 text-xs font-semibold transition cursor-pointer"
                    >
                      Cancel Request
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab 3: Connected Peers */}
          {activeTab === "connected" && (
            <div className="space-y-4">
              {connectedPeers.length === 0 ? (
                <div className="text-center py-16 bg-white/5 rounded-3xl border border-white/10">
                  <span className="text-4xl block mb-2">🤝</span>
                  <h3 className="font-bold text-white text-base">No peer connections yet</h3>
                  <p className="text-slate-400 text-xs mt-1">
                    Connect with peers to start real-time messaging and collaboration!
                  </p>
                </div>
              ) : (
                connectedPeers.map((conn) => {
                  const isSender = conn.senderId === user?.uid;
                  const peerId = isSender ? conn.receiverId : conn.senderId;
                  const peerName = isSender ? conn.receiverName || "Peer" : conn.senderName;
                  const peerPhoto = isSender ? conn.receiverPhoto : conn.senderPhoto;

                  return (
                    <div
                      key={conn.id}
                      className="p-5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 shadow-md flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center space-x-3">
                        <Image
                          src={
                            peerPhoto ||
                            `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(peerName)}`
                          }
                          alt={peerName}
                          width={44}
                          height={44}
                          className="w-11 h-11 rounded-full border border-emerald-400/30 bg-slate-800 shrink-0"
                          unoptimized
                        />
                        <div>
                          <h4 className="font-bold text-white text-sm">{peerName}</h4>
                          <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold">
                            Connected Peer
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/messages?with=${peerId}`}
                          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition flex items-center space-x-1"
                        >
                          <span>💬</span>
                          <span>Message</span>
                        </Link>
                        <button
                          onClick={() => handleDeclineOrCancel(conn.id)}
                          title="Remove peer connection"
                          className="px-3 py-2 rounded-xl bg-white/5 hover:bg-red-500/20 hover:text-red-300 text-slate-400 text-xs font-semibold transition cursor-pointer"
                        >
                          Unfriend
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
