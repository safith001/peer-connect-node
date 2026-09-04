"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
  getDoc,
  serverTimestamp,
  arrayUnion,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import {
  Conversation,
  ChatMessage,
  ChatParticipant,
  getOrCreateConversation,
} from "@/lib/conversations";

/**
 * ==============================================================================
 * Real-Time 1-on-1 Direct Messaging Screen (`/messages`)
 * ==============================================================================
 * 
 * In SQL/Laravel:
 * Handled by `ConversationController::show()` and `MessageController::send()`.
 * 
 * In Cloud Firestore NoSQL:
 * 1. Conversations List: `where("participants", "array-contains", user.uid)`.
 * 2. Active Messages: `onSnapshot(collection(db, "conversations", id, "messages"))`.
 * 3. Auto-scroll: React `useRef` + `scrollIntoView({ behavior: 'smooth' })`.
 */

function ChatInterface() {
  const { user, profile } = useAuth();
  const searchParams = useSearchParams();
  const directPeerUid = searchParams.get("with");

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [directPeerData, setDirectPeerData] = useState<ChatParticipant | null>(null);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Subscribe to all conversations involving the current student
  useEffect(() => {
    if (!user) return;

    const convQuery = query(
      collection(db, "conversations"),
      where("participants", "array-contains", user.uid)
    );

    const unsubscribe = onSnapshot(convQuery, (snapshot) => {
      const convList: Conversation[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Conversation, "id">),
      }));

      // Sort client-side by updatedAt descending
      convList.sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0));

      setConversations(convList);
      setIsLoadingConversations(false);
    });

    return () => unsubscribe();
  }, [user]);

  // 2. Handle ?with=peerUid query parameter (direct message launch from directory or profile)
  useEffect(() => {
    if (!user || !profile || !directPeerUid || directPeerUid === user.uid) return;

    const initDirectChat = async () => {
      try {
        const peerDoc = await getDoc(doc(db, "users", directPeerUid));
        if (peerDoc.exists()) {
          const peerData = peerDoc.data();
          const peerParticipant: ChatParticipant = {
            uid: directPeerUid,
            name: peerData.name || "Student",
            photoURL: peerData.photoURL || null,
            faculty: peerData.faculty || null,
          };
          setDirectPeerData(peerParticipant);

          const convId = await getOrCreateConversation(
            {
              uid: user.uid,
              name: profile.name || user.displayName || "Student",
              photoURL: profile.photoURL,
              faculty: profile.faculty,
            },
            peerParticipant
          );
          setActiveConversationId(convId);
        }
      } catch (err) {
        console.error("Error opening direct conversation:", err);
      }
    };

    initDirectChat();
  }, [user, profile, directPeerUid]);

  // 3. Real-time stream of messages in the active conversation
  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      return;
    }

    const messagesQuery = query(
      collection(db, "conversations", activeConversationId, "messages"),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const msgs: ChatMessage[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<ChatMessage, "id">),
      }));
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [activeConversationId]);

  // 4. Auto-scroll to bottom whenever messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 5. Mark active conversation as read as soon as it is opened/viewed
  useEffect(() => {
    if (!user || !activeConversationId) return;

    const conv = conversations.find((c) => c.id === activeConversationId);
    if (!conv) return;

    // If the last message was sent by the other peer and current user hasn't marked it read yet
    const hasUnread =
      conv.lastMessage &&
      conv.lastMessage.senderId !== user.uid &&
      (!conv.readBy || !conv.readBy.includes(user.uid));

    if (hasUnread) {
      updateDoc(doc(db, "conversations", activeConversationId), {
        readBy: arrayUnion(user.uid),
      }).catch((err) => {
        console.error("Error marking conversation as read:", err);
      });
    }
  }, [user, activeConversationId, conversations]);

  // 6. Send message action
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !user || !activeConversationId) return;

    const messageText = inputText.trim();
    setInputText("");
    setIsSending(true);

    try {
      // Add message to subcollection
      await addDoc(
        collection(db, "conversations", activeConversationId, "messages"),
        {
          senderId: user.uid,
          senderName: profile?.name || user.displayName || "Student",
          text: messageText,
          createdAt: serverTimestamp(),
          read: false,
        }
      );

      // Update parent conversation preview & timestamp, reset readBy to sender only
      await updateDoc(doc(db, "conversations", activeConversationId), {
        lastMessage: {
          text: messageText,
          senderId: user.uid,
          timestamp: serverTimestamp(),
        },
        readBy: [user.uid],
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setIsSending(false);
    }
  };

  // Helper to get active peer info
  const activeConversation = conversations.find((c) => c.id === activeConversationId);
  const activePeer = activeConversation?.participants
    ? activeConversation.participantData?.[
        activeConversation.participants.find((p) => p !== user?.uid) || ""
      ]
    : directPeerData;

  // Build the list of displayed conversations including active direct chat draft
  const displayedConversations = [...conversations];
  if (
    user &&
    activeConversationId &&
    directPeerData &&
    !displayedConversations.some((c) => c.id === activeConversationId)
  ) {
    displayedConversations.unshift({
      id: activeConversationId,
      participants: [user.uid, directPeerData.uid],
      participantData: {
        [user.uid]: {
          uid: user.uid,
          name: profile?.name || user.displayName || "Student",
          photoURL: profile?.photoURL || null,
          faculty: profile?.faculty || null,
        },
        [directPeerData.uid]: directPeerData,
      },
      lastMessage: null,
      updatedAt: null,
    });
  }

  const formatTime = (ts?: { seconds: number } | null) => {
    if (!ts?.seconds) return "Just now";
    return new Date(ts.seconds * 1000).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-slate-100 flex flex-col">
      {/* Unified App Navbar */}
      <Navbar />

      {/* Main Messaging Layout */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 flex gap-6 h-[calc(100vh-4rem)]">
        {/* Left Sidebar: Conversations Inbox */}
        <aside className="w-full sm:w-80 md:w-96 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/15 shadow-xl flex flex-col overflow-hidden">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <h2 className="font-bold text-white text-base flex items-center space-x-2">
              <span>💬</span>
              <span>Direct Messages</span>
            </h2>
            <Link
              href="/peers"
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300"
            >
              + New Chat
            </Link>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {isLoadingConversations ? (
              <div className="text-center py-12 text-slate-400 text-xs">Loading conversations...</div>
            ) : displayedConversations.length === 0 ? (
              <div className="text-center py-16 px-4">
                <span className="text-3xl block mb-2">✉️</span>
                <p className="text-slate-300 font-medium text-sm">No conversations yet</p>
                <p className="text-slate-500 text-xs mt-1">
                  Connect with classmates in the{" "}
                  <Link href="/peers" className="text-indigo-400 underline">
                    Directory
                  </Link>{" "}
                  to start chatting.
                </p>
              </div>
            ) : (
              displayedConversations.map((conv) => {
                const otherUid = conv.participants.find((p) => p !== user?.uid) || "";
                const peerInfo = conv.participantData?.[otherUid];
                const isSelected = conv.id === activeConversationId;
                const isUnread =
                  conv.lastMessage &&
                  conv.lastMessage.senderId !== user?.uid &&
                  (!conv.readBy || !conv.readBy.includes(user?.uid || ""));

                return (
                  <button
                    key={conv.id}
                    onClick={() => setActiveConversationId(conv.id)}
                    className={`w-full p-3 rounded-2xl text-left transition flex items-center space-x-3 cursor-pointer ${
                      isSelected
                        ? "bg-indigo-600/30 border border-indigo-500/50"
                        : "hover:bg-white/5 border border-transparent"
                    }`}
                  >
                    <Image
                      src={
                        peerInfo?.photoURL ||
                        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                          peerInfo?.name || "User"
                        )}`
                      }
                      alt={peerInfo?.name || "Peer"}
                      width={42}
                      height={42}
                      className="w-10 h-10 rounded-full border border-indigo-400/30 bg-slate-800 shrink-0"
                      unoptimized
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <div className="flex items-center space-x-1.5 min-w-0">
                          <h3
                            className={`text-xs sm:text-sm truncate ${
                              isUnread ? "font-extrabold text-white" : "font-bold text-slate-200"
                            }`}
                          >
                            {peerInfo?.name || "Classmate"}
                          </h3>
                          {isUnread && (
                            <span className="w-2 h-2 rounded-full bg-pink-500 shrink-0 animate-pulse" />
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {formatTime(conv.lastMessage?.timestamp || conv.updatedAt)}
                        </span>
                      </div>
                      <p
                        className={`text-xs truncate ${
                          isUnread ? "text-indigo-200 font-medium" : "text-slate-400"
                        }`}
                      >
                        {conv.lastMessage
                          ? `${conv.lastMessage.senderId === user?.uid ? "You: " : ""}${
                              conv.lastMessage.text
                            }`
                          : "Conversation created."}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Right Chat Area */}
        <section className="hidden sm:flex flex-1 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/15 shadow-xl flex-col overflow-hidden">
          {activeConversationId && activePeer ? (
            <>
              {/* Chat Top Bar */}
              <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-white/5">
                <div className="flex items-center space-x-3">
                  <Image
                    src={
                      activePeer.photoURL ||
                      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                        activePeer.name
                      )}`
                    }
                    alt={activePeer.name}
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full border border-indigo-400/40 bg-slate-800 shrink-0"
                    unoptimized
                  />
                  <div>
                    <h3 className="font-bold text-white text-sm sm:text-base">{activePeer.name}</h3>
                    <p className="text-xs text-emerald-400 flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>{activePeer.faculty || "Campus Peer"}</span>
                    </p>
                  </div>
                </div>

                <Link
                  href="/peers"
                  className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-white/5"
                >
                  View Profile
                </Link>
              </div>

              {/* Messages Feed Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-20 text-slate-400 text-xs">
                    <span className="text-3xl block mb-2">👋</span>
                    Say hello to {activePeer.name}! Start the academic collaboration.
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.senderId === user?.uid;
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                      >
                        <div
                          className={`max-w-sm sm:max-w-md px-4 py-2.5 rounded-2xl text-xs sm:text-sm whitespace-pre-line leading-relaxed shadow-md ${
                            isMe
                              ? "bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-tr-none"
                              : "bg-slate-800/90 border border-white/10 text-slate-100 rounded-tl-none"
                          }`}
                        >
                          {msg.text}
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1 px-1">
                          {formatTime(msg.createdAt)}
                        </span>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Composer Bar */}
              <form
                onSubmit={handleSendMessage}
                className="p-4 border-t border-white/10 bg-white/5 flex items-center space-x-3"
              >
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={`Message ${activePeer.name}...`}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
                <button
                  type="submit"
                  disabled={isSending || !inputText.trim()}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition disabled:opacity-50 cursor-pointer shrink-0 shadow-md shadow-indigo-600/30"
                >
                  {isSending ? "..." : "Send"}
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-16 h-16 rounded-3xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-3xl mb-4">
                💬
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Your Conversations</h3>
              <p className="text-slate-400 text-sm max-w-sm">
                Select a classmate from the inbox on the left, or visit the directory to start a new chat.
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <ProtectedRoute>
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-300">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        <ChatInterface />
      </Suspense>
    </ProtectedRoute>
  );
}
