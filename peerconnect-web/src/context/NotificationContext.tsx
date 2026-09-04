"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Conversation } from "@/lib/conversations";

/**
 * ==============================================================================
 * Global Notification & Live Alert Context
 * ==============================================================================
 * 
 * DESIGN PATTERN: Global Observer & Event Stream
 * -----------------------------------------------
 * Subscribes to real-time Firestore streams for:
 * 1. Incoming Peer Requests (pending)
 * 2. Incoming Chat Messages (lastMessage senderId != user.uid)
 * 
 * Filters events against `sessionStartTime` so initial page loads do not flood
 * the student with old notifications, while real-time changes instantly emit
 * floating toast alerts.
 */

export interface ToastAlert {
  id: string;
  type: "peer_request" | "message";
  title: string;
  message: string;
  senderName: string;
  senderPhoto?: string | null;
  actionUrl: string;
  createdAt: number;
}

export interface PeerRequestItem {
  id: string;
  senderId: string;
  senderName: string;
  senderPhoto?: string | null;
  senderFaculty?: string | null;
  senderSemester?: number | null;
  receiverId: string;
  status: "pending" | "accepted" | "declined";
  createdAt?: { seconds: number } | null;
}

interface NotificationContextType {
  toasts: ToastAlert[];
  dismissToast: (id: string) => void;
  pendingRequests: PeerRequestItem[];
  pendingRequestsCount: number;
  recentConversations: Conversation[];
  unreadMessagesCount: number;
}

const NotificationContext = createContext<NotificationContextType>({
  toasts: [],
  dismissToast: () => {},
  pendingRequests: [],
  pendingRequestsCount: 0,
  recentConversations: [],
  unreadMessagesCount: 0,
});

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  const [toasts, setToasts] = useState<ToastAlert[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PeerRequestItem[]>([]);
  const [recentConversations, setRecentConversations] = useState<Conversation[]>([]);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

  // Timestamp when this browser tab session began (used to filter out old toasts)
  const sessionStartTimeRef = useRef<number>(Date.now());
  const initialLoadRequestsRef = useRef<boolean>(true);
  const initialLoadConversationsRef = useRef<boolean>(true);

  // Dismiss a specific toast alert
  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // ----------------------------------------------------------------------------
  // 1. Real-Time Listener: Incoming Pending Peer Requests
  // ----------------------------------------------------------------------------
  useEffect(() => {
    if (!user) {
      setPendingRequests([]);
      return;
    }

    const q = query(
      collection(db, "peer_requests"),
      where("receiverId", "==", user.uid),
      where("status", "==", "pending")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const requests: PeerRequestItem[] = [];

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        requests.push({
          id: docSnap.id,
          senderId: data.senderId,
          senderName: data.senderName || "A Classmate",
          senderPhoto: data.senderPhoto || null,
          senderFaculty: data.senderFaculty || null,
          senderSemester: data.senderSemester || null,
          receiverId: data.receiverId,
          status: data.status,
          createdAt: data.createdAt,
        });
      });

      setPendingRequests(requests);

      // Inspect document changes for real-time additions (skipping first load)
      if (initialLoadRequestsRef.current) {
        initialLoadRequestsRef.current = false;
      } else {
        snapshot.docChanges().forEach((change) => {
          if (change.type === "added") {
            const data = change.doc.data();
            // Emit a live toast alert!
            const newToast: ToastAlert = {
              id: `req_${change.doc.id}_${Date.now()}`,
              type: "peer_request",
              title: "New Peer Request",
              message: `${data.senderName || "A classmate"} sent you a connection request!`,
              senderName: data.senderName || "Classmate",
              senderPhoto: data.senderPhoto || null,
              actionUrl: "/peers/requests",
              createdAt: Date.now(),
            };

            setToasts((prev) => [newToast, ...prev.slice(0, 4)]); // Keep max 5 active
          }
        });
      }
    });

    return () => unsubscribe();
  }, [user]);

  // ----------------------------------------------------------------------------
  // 2. Real-Time Listener: Incoming Conversations & New Messages
  // ----------------------------------------------------------------------------
  useEffect(() => {
    if (!user) {
      setRecentConversations([]);
      setUnreadMessagesCount(0);
      return;
    }

    const q = query(
      collection(db, "conversations"),
      where("participants", "array-contains", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const convos: Conversation[] = [];
      let unreadCount = 0;

      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Conversation;
        convos.push({
          ...data,
          id: docSnap.id,
        });

        // Check if message is unread (sent by peer and not yet in current user's readBy array)
        const isUnread =
          data.lastMessage &&
          data.lastMessage.senderId !== user.uid &&
          (!data.readBy || !data.readBy.includes(user.uid));

        if (isUnread) {
          unreadCount += 1;
        }
      });

      // Sort conversations by most recently updated first in memory (avoids composite index)
      convos.sort((a, b) => {
        const timeA = a.updatedAt?.seconds || 0;
        const timeB = b.updatedAt?.seconds || 0;
        return timeB - timeA;
      });

      setRecentConversations(convos);
      setUnreadMessagesCount(unreadCount);

      // Check for real-time new messages
      if (initialLoadConversationsRef.current) {
        initialLoadConversationsRef.current = false;
      } else {
        snapshot.docChanges().forEach((change) => {
          if (change.type === "modified" || change.type === "added") {
            const data = change.doc.data() as Conversation;
            const lastMsg = data.lastMessage;

            // Trigger toast ONLY if someone else sent this message and current user hasn't read it yet
            if (
              lastMsg &&
              lastMsg.senderId !== user.uid &&
              (!data.readBy || !data.readBy.includes(user.uid))
            ) {
              const otherUserUid = data.participants.find((p) => p !== user.uid);
              const sender = otherUserUid ? data.participantData?.[otherUserUid] : null;

              const newToast: ToastAlert = {
                id: `msg_${change.doc.id}_${Date.now()}`,
                type: "message",
                title: `Message from ${sender?.name || "Peer"}`,
                message: lastMsg.text.length > 60 ? `${lastMsg.text.substring(0, 60)}...` : lastMsg.text,
                senderName: sender?.name || "Peer",
                senderPhoto: sender?.photoURL || null,
                actionUrl: "/messages",
                createdAt: Date.now(),
              };

              setToasts((prev) => [newToast, ...prev.slice(0, 4)]);
            }
          }
        });
      }
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <NotificationContext.Provider
      value={{
        toasts,
        dismissToast,
        pendingRequests,
        pendingRequestsCount: pendingRequests.length,
        recentConversations,
        unreadMessagesCount,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}
