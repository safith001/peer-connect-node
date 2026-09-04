"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import {
  uploadToCloudinary,
  categorizeFile,
  formatFileSize,
  AttachmentCategory,
} from "@/lib/cloudinary";

/**
 * ==============================================================================
 * CreatePostCard Component
 * ==============================================================================
 * 
 * In SQL/Laravel:
 * Handled by `PostController::store()`:
 * `INSERT INTO posts (user_id, content, created_at) VALUES (?, ?, NOW());`
 * 
 * In Cloud Firestore NoSQL + Cloudinary:
 * 1. If a local file (photo, PDF, PPTX) is attached, we upload it directly to
 *    Cloudinary via client-side multipart/form-data.
 * 2. We use `addDoc(collection(db, "posts"), { ...postData })` with the CDN URL.
 * 
 * SYNTAX EXPLANATIONS:
 * 1. `collection(db, "posts")`: References the "posts" collection.
 * 2. `addDoc()`: Generates a unique ID and writes the post document atomically.
 * 3. `serverTimestamp()`: Uses Google's synchronized atomic clock.
 */

interface CreatePostCardProps {
  onPostCreated?: () => void;
}

export default function CreatePostCard({ onPostCreated }: CreatePostCardProps) {
  const { user, profile } = useAuth();

  const [content, setContent] = useState("");
  const [category, setCategory] = useState("General");
  const [mediaUrl, setMediaUrl] = useState("");
  const [showUrlInput, setShowUrlInput] = useState(false);

  // File Attachment State (Photos, PDFs, Presentations)
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [fileCategory, setFileCategory] = useState<AttachmentCategory | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle local file selection from device
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (25 MB)
    if (file.size > 25 * 1024 * 1024) {
      setError("File is too large. Maximum size is 25 MB.");
      return;
    }

    setError(null);
    setSelectedFile(file);
    const cat = categorizeFile(file);
    setFileCategory(cat);

    // Create thumbnail preview if image
    if (cat === "image") {
      const previewUrl = URL.createObjectURL(file);
      setFilePreview(previewUrl);
    } else {
      setFilePreview(null);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setFileCategory(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !user) return;

    setIsSubmitting(true);
    setError(null);

    let finalAttachmentUrl: string | null = null;
    let finalAttachmentName: string | null = null;
    let finalAttachmentType: string | null = null;
    let finalAttachmentSize: number | null = null;

    try {
      // Step 1: Upload file to Cloudinary if attached
      if (selectedFile) {
        setUploadStatus(`Uploading ${selectedFile.name}...`);
        const uploadResult = await uploadToCloudinary(selectedFile);
        finalAttachmentUrl = uploadResult.url;
        finalAttachmentName = uploadResult.originalFilename;
        finalAttachmentType = uploadResult.attachmentType;
        finalAttachmentSize = uploadResult.bytes;
      } else if (mediaUrl.trim()) {
        finalAttachmentUrl = mediaUrl.trim();
        finalAttachmentName = "Image Link";
        finalAttachmentType = "image";
      }

      setUploadStatus("Publishing post...");

      // Step 2: Save post with attachment metadata to Firestore
      await addDoc(collection(db, "posts"), {
        authorId: user.uid,
        authorName: profile?.name || user.displayName || "Student",
        authorEmail: user.email,
        authorPhoto:
          profile?.photoURL ||
          `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
            profile?.name || "Student"
          )}`,
        authorFaculty: profile?.faculty || "General",
        authorSemester: profile?.semester || 1,
        content: content.trim(),
        category: category,
        mediaUrl: finalAttachmentType === "image" ? finalAttachmentUrl : null,
        attachmentUrl: finalAttachmentUrl,
        attachmentName: finalAttachmentName,
        attachmentType: finalAttachmentType,
        attachmentSize: finalAttachmentSize,
        likesCount: 0,
        likedBy: [], // Array of user UIDs who liked this post
        commentsCount: 0,
        createdAt: serverTimestamp(),
      });

      // Clear form inputs
      setContent("");
      setMediaUrl("");
      setShowUrlInput(false);
      handleRemoveFile();
      setCategory("General");

      if (onPostCreated) {
        onPostCreated();
      }
    } catch (err: unknown) {
      console.error("Error creating post:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to publish post. Please check your connection.";
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
      setUploadStatus(null);
    }
  };

  return (
    <div className="p-6 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/15 shadow-xl">
      <div className="flex items-start space-x-3 mb-4">
        <Image
          src={
            profile?.photoURL ||
            `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
              profile?.name || "User"
            )}`
          }
          alt={profile?.name || "User Avatar"}
          width={40}
          height={40}
          className="w-10 h-10 rounded-full border border-indigo-400/40 bg-slate-800 shrink-0"
          unoptimized
        />
        <div className="flex-1">
          <p className="text-sm font-bold text-white">
            {profile?.name || user?.displayName || "Student"}
          </p>
          <p className="text-xs text-indigo-300">
            {profile?.faculty ? `${profile.faculty} • ` : ""}Semester {profile?.semester || 1}
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs">
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          rows={3}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Share an academic update, ask a question, or start a peer discussion..."
          required
          className="w-full px-4 py-3 rounded-2xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition text-sm resize-none"
        />

        {/* Hidden File Input for Device Uploads (Images, PDFs, PPT/PPTX) */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf,.ppt,.pptx,.doc,.docx,.txt"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Staging Preview for Selected Local File */}
        {selectedFile && (
          <div className="p-3 rounded-2xl bg-slate-800/90 border border-indigo-500/30 flex items-center justify-between gap-3">
            <div className="flex items-center space-x-3 min-w-0">
              {fileCategory === "image" && filePreview ? (
                <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-white/10 shrink-0 bg-slate-900">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={filePreview}
                    alt="Staged upload"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-xl shrink-0">
                  {fileCategory === "pdf" && "📄"}
                  {fileCategory === "presentation" && "📊"}
                  {fileCategory === "document" && "📝"}
                  {fileCategory === "raw" && "📎"}
                </div>
              )}

              <div className="min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-semibold text-white truncate max-w-[180px] sm:max-w-xs">
                    {selectedFile.name}
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                    {fileCategory}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {formatFileSize(selectedFile.size)} &bull; Ready to upload to Cloudinary
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleRemoveFile}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition cursor-pointer text-xs"
              title="Remove attachment"
            >
              ✕
            </button>
          </div>
        )}

        {/* Fallback Image URL input */}
        {showUrlInput && !selectedFile && (
          <div className="flex items-center space-x-2">
            <input
              type="url"
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              placeholder="Paste an image URL (e.g. https://images.unsplash.com/...)"
              className="flex-1 px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition text-xs"
            />
            <button
              type="button"
              onClick={() => {
                setMediaUrl("");
                setShowUrlInput(false);
              }}
              className="px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>
        )}

        {mediaUrl && !selectedFile && (
          <div className="relative rounded-xl overflow-hidden border border-white/10 max-h-48 bg-slate-900">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={mediaUrl}
              alt="Post preview attachment"
              className="w-full h-48 object-cover"
              onError={() => setError("The image URL provided could not be loaded.")}
            />
          </div>
        )}

        {/* Upload Status Banner */}
        {uploadStatus && (
          <div className="p-2.5 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs flex items-center space-x-2 animate-pulse">
            <span>⏳</span>
            <span>{uploadStatus}</span>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10">
          <div className="flex items-center space-x-2">
            {/* Tag / Category Selector */}
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            >
              <option value="General">🏷️ General</option>
              <option value="Question">❓ Question</option>
              <option value="Study Group">📚 Study Group</option>
              <option value="Resources">📎 Resources</option>
              <option value="Campus News">📢 Campus News</option>
            </select>

            {/* Attach File Button (Images, PDFs, PPT/PPTX) */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 text-xs text-indigo-200 hover:text-white transition flex items-center space-x-1.5 cursor-pointer font-medium"
            >
              <span>📎</span>
              <span>Attach File</span>
            </button>

            {/* Paste URL Toggle */}
            {!selectedFile && (
              <button
                type="button"
                onClick={() => setShowUrlInput(!showUrlInput)}
                className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-400 hover:text-slate-200 transition flex items-center space-x-1 cursor-pointer"
                title="Paste an image URL instead"
              >
                <span>🔗</span>
                <span className="hidden sm:inline">URL</span>
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || (!content.trim() && !selectedFile)}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white text-xs font-semibold shadow-lg shadow-indigo-500/25 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSubmitting ? "Publishing..." : "Publish Post"}
          </button>
        </div>
      </form>
    </div>
  );
}
