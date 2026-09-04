"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useNotifications, ToastAlert } from "@/context/NotificationContext";

/**
 * ==============================================================================
 * Floating Live Alert Toast Component
 * ==============================================================================
 * 
 * Renders floating, animated notification cards in real-time whenever a classmate
 * sends a connection request or chat message.
 * 
 * Includes:
 * - 6-second automatic dismissal timer
 * - 1-click action navigation (direct to request or chat room)
 * - Manual dismiss button (✕)
 */
export default function NotificationToasts() {
  const { toasts, dismissToast } = useNotifications();

  if (toasts.length === 0) return null;

  return (
    <aside
      aria-label="Live notifications"
      className="fixed top-20 right-4 sm:right-6 z-50 flex flex-col space-y-3 max-w-sm w-full pointer-events-none"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={dismissToast} />
      ))}
    </aside>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastAlert;
  onDismiss: (id: string) => void;
}) {
  const router = useRouter();

  // Auto-dismiss after 6 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 6000);

    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const handleAction = () => {
    onDismiss(toast.id);
    router.push(toast.actionUrl);
  };

  return (
    <div
      role="alert"
      className="pointer-events-auto p-4 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-indigo-500/40 shadow-2xl shadow-indigo-950/60 transition-all duration-300 transform translate-y-0 opacity-100 flex items-start space-x-3.5"
    >
      {/* Avatar or Icon Badge */}
      <div className="relative shrink-0 mt-0.5">
        {toast.senderPhoto ? (
          <Image
            src={toast.senderPhoto}
            alt={toast.senderName}
            width={40}
            height={40}
            className="w-10 h-10 rounded-full border border-indigo-400/40 bg-slate-800 object-cover"
            unoptimized
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-lg text-white shadow-md">
            {toast.type === "peer_request" ? "📬" : "💬"}
          </div>
        )}
        <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-indigo-500 border-2 border-slate-900 flex items-center justify-center text-[9px] text-white">
          {toast.type === "peer_request" ? "👥" : "✉️"}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-white uppercase tracking-wider text-indigo-300">
            {toast.title}
          </p>
          <button
            type="button"
            onClick={() => onDismiss(toast.id)}
            className="text-slate-400 hover:text-white transition text-xs p-1 -mr-1 -mt-1 cursor-pointer"
            title="Dismiss"
          >
            ✕
          </button>
        </div>

        <p className="text-sm text-slate-200 mt-1 leading-snug break-words">
          {toast.message}
        </p>

        {/* Action button */}
        <div className="mt-2.5 flex items-center space-x-2">
          <button
            type="button"
            onClick={handleAction}
            className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition cursor-pointer flex items-center space-x-1"
          >
            <span>{toast.type === "peer_request" ? "Review Request" : "Reply"}</span>
            <span>&rarr;</span>
          </button>
          <span className="text-[10px] text-slate-400">Just now</span>
        </div>
      </div>
    </div>
  );
}
