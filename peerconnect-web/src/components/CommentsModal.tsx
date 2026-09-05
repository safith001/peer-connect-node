"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  increment,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { validateCommentContent } from "@/lib/validation";

/**
 * ==============================================================================
 * CommentsModal Component (Subcollection Real-Time Discussion)
 * ==============================================================================
 * 
 * In SQL/Laravel:
 * Handled by `CommentController::store()` inserting into a `comments` table
 * with foreign key `post_id`.
 * 
 * In Cloud Firestore NoSQL:
 * Comments live inside a **Subcollection**: `posts/{postId}/comments`.
 * 
 * SYNTAX & ATOMIC OPERATIONS:
 * 1. `collection(db, "posts", postId, "comments")`: Points to the subcollection.
 * 2. `increment(1)`: An atomic database operation. If two classmates submit a comment
 *    at the exact same millisecond, `increment(1)` guarantees both are counted
 *    correctly without race conditions.
 */

export interface CommentItem {
  id: string;
  authorId: string;
  authorName: string;
  authorPhoto?: string;
  content: string;
  createdAt?: { seconds: number; nanoseconds: number } | null;
}

interface CommentsModalProps {
  postId: string;
  postTitle?: string;
  onClose: () => void;
}

export default function CommentsModal({ postId, onClose }: CommentsModalProps) {
  const { user, profile } = useAuth();

  const [comments, setComments] = useState<CommentItem[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Subscribe to real-time comments on this specific post
  useEffect(() => {
    if (!postId) return;

    const commentsQuery = query(
      collection(db, "posts", postId, "comments"),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(commentsQuery, (snapshot) => {
      const fetched: CommentItem[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<CommentItem, "id">),
      }));
      setComments(fetched);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [postId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !postId) return;

    // Validate and sanitize comment content
    const validation = validateCommentContent(newComment);
    if (!validation.isValid) {
      alert(validation.error || "Please enter a valid comment.");
      return;
    }

    setIsSubmitting(true);
    const commentText = validation.sanitized;
    setNewComment("");

    try {
      // 1. Add comment to subcollection
      await addDoc(collection(db, "posts", postId, "comments"), {
        authorId: user.uid,
        authorName: profile?.name || user.displayName || "Student",
        authorPhoto:
          profile?.photoURL ||
          `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
            profile?.name || "Student"
          )}`,
        content: commentText,
        createdAt: serverTimestamp(),
      });

      // 2. Atomically increment the parent post's comment counter
      await updateDoc(doc(db, "posts", postId), {
        commentsCount: increment(1),
      });
    } catch (err) {
      console.error("Error adding comment:", err);
      alert("Failed to post comment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Delete this comment?")) return;

    try {
      await deleteDoc(doc(db, "posts", postId, "comments", commentId));
      await updateDoc(doc(db, "posts", postId), {
        commentsCount: increment(-1),
      });
    } catch (err) {
      console.error("Error deleting comment:", err);
    }
  };

  const formatCommentTime = (ts?: { seconds: number } | null) => {
    if (!ts?.seconds) return "Just now";
    return new Date(ts.seconds * 1000).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-white/20 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-white/5">
          <div className="flex items-center space-x-2">
            <span className="text-lg">💬</span>
            <h3 className="font-bold text-white text-base">Discussion & Comments</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition cursor-pointer text-sm"
          >
            ✕
          </button>
        </div>

        {/* Comments Scrollable List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {isLoading ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              Loading discussion...
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-3xl block mb-2">💭</span>
              <p className="text-slate-300 font-medium text-sm">No comments yet</p>
              <p className="text-slate-500 text-xs mt-1">Start the conversation with your classmates!</p>
            </div>
          ) : (
            comments.map((comment) => {
              const isCommentAuthor = user?.uid === comment.authorId;
              return (
                <div key={comment.id} className="flex items-start space-x-3 group">
                  <Image
                    src={
                      comment.authorPhoto ||
                      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                        comment.authorName
                      )}`
                    }
                    alt={comment.authorName}
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-full border border-indigo-400/30 bg-slate-800 shrink-0 mt-0.5"
                    unoptimized
                  />
                  <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-3 text-xs sm:text-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-white text-xs">{comment.authorName}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] text-slate-400">
                          {formatCommentTime(comment.createdAt)}
                        </span>
                        {isCommentAuthor && (
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="text-slate-500 hover:text-red-400 transition"
                            title="Delete comment"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-slate-200 whitespace-pre-line leading-relaxed">
                      {comment.content}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Comment Input Box */}
        <form onSubmit={handleSubmit} className="p-4 border-t border-white/10 bg-white/5 flex items-center space-x-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a helpful comment (max 500 characters)..."
            maxLength={500}
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          />
          <button
            type="submit"
            disabled={isSubmitting || !newComment.trim()}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition disabled:opacity-50 cursor-pointer shrink-0"
          >
            {isSubmitting ? "..." : "Send"}
          </button>
        </form>
      </div>
    </div>
  );
}
