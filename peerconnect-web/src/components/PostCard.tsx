"use client";

import React, { useState } from "react";
import Image from "next/image";
import { doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { formatFileSize, AttachmentCategory } from "@/lib/cloudinary";

/**
 * ==============================================================================
 * PostCard Component
 * ==============================================================================
 * 
 * Displays an individual social post with:
 * - Author metadata (Avatar, Name, Faculty, Semester)
 * - Category badge (Question, Study Group, etc.)
 * - Timestamp formatting
 * - Post body content & optional image / document attachment (PDF, PPTX, etc.)
 * - Delete action (restricted to the post's author)
 * - Like counter and Comment counter triggers
 */

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorEmail?: string;
  authorPhoto?: string;
  authorFaculty?: string;
  authorSemester?: number;
  content: string;
  category: string;
  mediaUrl?: string | null;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  attachmentType?: AttachmentCategory | string | null;
  attachmentSize?: number | null;
  likesCount: number;
  likedBy: string[];
  commentsCount: number;
  createdAt?: { seconds: number; nanoseconds: number } | null;
}

interface PostCardProps {
  post: Post;
  onLikeToggle?: (postId: string) => void;
  onOpenComments?: (postId: string) => void;
}

export default function PostCard({ post, onLikeToggle, onOpenComments }: PostCardProps) {
  const { user } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);

  const isAuthor = user?.uid === post.authorId;
  const isLikedByMe = user ? post.likedBy?.includes(user.uid) : false;

  // Cross-origin safe file downloader using blob fetch
  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename || "download";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(url, "_blank");
    }
  };

  // Format relative or friendly date from Firestore timestamp
  const formatTime = () => {
    if (!post.createdAt?.seconds) return "Just now";
    const postDate = new Date(post.createdAt.seconds * 1000);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - postDate.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return postDate.toLocaleDateString();
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    setIsDeleting(true);

    try {
      await deleteDoc(doc(db, "posts", post.id));
    } catch (err) {
      console.error("Error deleting post:", err);
      alert("Failed to delete post. Please check permissions.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <article className="p-6 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/15 shadow-xl transition hover:border-white/25">
      {/* Header: Author Info & Category Badge */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Image
            src={
              post.authorPhoto ||
              `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                post.authorName || "User"
              )}`
            }
            alt={post.authorName}
            width={44}
            height={44}
            className="w-11 h-11 rounded-full border border-indigo-400/30 bg-slate-800 shrink-0"
            unoptimized
          />
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-white text-sm sm:text-base">{post.authorName}</h3>
              {post.authorFaculty && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-medium hidden sm:inline-block">
                  {post.authorFaculty}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Semester {post.authorSemester || 1} &bull; {formatTime()}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Category Tag */}
          <span className="px-2.5 py-1 rounded-full bg-white/10 text-slate-300 text-xs font-medium border border-white/10">
            {post.category || "General"}
          </span>

          {/* Delete Button (Only for Author) */}
          {isAuthor && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              title="Delete your post"
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition cursor-pointer"
            >
              🗑️
            </button>
          )}
        </div>
      </div>

      {/* Post Text Content */}
      <p className="text-slate-200 text-sm sm:text-base leading-relaxed whitespace-pre-line mb-4">
        {post.content}
      </p>

      {/* 1. Image Attachment (Photo) - Clickable with Action Overlay */}
      {(post.attachmentType === "image" || (!post.attachmentType && post.mediaUrl)) && (
        <div className="relative group mb-4 rounded-2xl overflow-hidden border border-white/10 bg-slate-900/80">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.attachmentUrl || post.mediaUrl || ""}
            alt={post.attachmentName || "Post attachment"}
            className="w-full max-h-96 object-cover cursor-pointer transition-transform duration-300 group-hover:scale-[1.01]"
            loading="lazy"
            onClick={() => window.open(post.attachmentUrl || post.mediaUrl || "", "_blank")}
            title="Click to view full image in a new tab"
          />

          {/* Floating Action Overlay for Images */}
          <div className="absolute top-3 right-3 flex items-center space-x-2 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/15 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200 shadow-xl">
            <button
              type="button"
              onClick={() => window.open(post.attachmentUrl || post.mediaUrl || "", "_blank")}
              className="text-xs text-white/90 hover:text-white flex items-center space-x-1 cursor-pointer font-medium"
              title="Open full size image in new tab"
            >
              <span>🔍</span>
              <span className="hidden sm:inline">View Full</span>
            </button>
            <span className="text-white/30 text-xs">|</span>
            <button
              type="button"
              onClick={() =>
                handleDownload(
                  post.attachmentUrl || post.mediaUrl || "",
                  post.attachmentName || "peerconnect_image.jpg"
                )
              }
              className="text-xs text-indigo-300 hover:text-indigo-100 flex items-center space-x-1 cursor-pointer font-semibold"
              title="Download image to your device"
            >
              <span>⬇️</span>
              <span>Download</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. Document & Slide Attachment (PDF, PPT, PPTX, Docs) */}
      {post.attachmentUrl && post.attachmentType && post.attachmentType !== "image" && (
        <div className="mb-4 p-4 rounded-2xl bg-slate-800/80 border border-white/10 hover:border-indigo-500/40 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-2xl shrink-0">
              {post.attachmentType === "pdf" && "📄"}
              {post.attachmentType === "presentation" && "📊"}
              {post.attachmentType === "document" && "📝"}
              {post.attachmentType === "raw" && "📎"}
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <p className="text-sm font-semibold text-white truncate max-w-[180px] sm:max-w-xs">
                  {post.attachmentName || "Academic Resource"}
                </p>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                  {post.attachmentType}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {post.attachmentSize ? formatFileSize(post.attachmentSize) : "Cloudinary Asset"} &bull; Document
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0 self-end sm:self-auto">
            <a
              href={post.attachmentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition flex items-center space-x-1 cursor-pointer"
              title="Open document in new tab"
            >
              <span>👁️</span>
              <span>View</span>
            </a>
            <button
              type="button"
              onClick={() =>
                handleDownload(
                  post.attachmentUrl || "",
                  post.attachmentName || "document.pdf"
                )
              }
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs font-semibold transition flex items-center space-x-1.5 shadow-md shadow-indigo-600/20 cursor-pointer"
              title="Download file to your device"
            >
              <span>⬇️</span>
              <span>Download</span>
            </button>
          </div>
        </div>
      )}

      {/* Interactions Footer: Likes & Comments */}
      <div className="flex items-center space-x-6 pt-3 border-t border-white/10 text-xs font-semibold text-slate-300">
        {/* Like Button */}
        <button
          onClick={() => onLikeToggle && onLikeToggle(post.id)}
          className={`flex items-center space-x-1.5 py-1 px-2.5 rounded-xl transition cursor-pointer ${
            isLikedByMe
              ? "bg-pink-500/20 text-pink-400 border border-pink-500/30"
              : "hover:bg-white/10 text-slate-300"
          }`}
        >
          <span>{isLikedByMe ? "❤️" : "🤍"}</span>
          <span>{post.likesCount || 0} {post.likesCount === 1 ? "Like" : "Likes"}</span>
        </button>

        {/* Comment Drawer Trigger */}
        <button
          onClick={() => onOpenComments && onOpenComments(post.id)}
          className="flex items-center space-x-1.5 py-1 px-2.5 rounded-xl hover:bg-white/10 transition cursor-pointer text-slate-300"
        >
          <span>💬</span>
          <span>{post.commentsCount || 0} {post.commentsCount === 1 ? "Comment" : "Comments"}</span>
        </button>
      </div>
    </article>
  );
}
