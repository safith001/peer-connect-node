"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  limit,
  doc,
  updateDoc,
  increment,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import CreatePostCard from "@/components/CreatePostCard";
import PostCard, { Post } from "@/components/PostCard";
import CommentsModal from "@/components/CommentsModal";

/**
 * ==============================================================================
 * Live Social Campus Feed (`/feed`)
 * ==============================================================================
 * 
 * ARCHITECTURE: Real-time Event-Driven Data Stream & Atomic Interactions
 * ---------------------------------------------------------------------
 * 1. Feed Stream: Uses `onSnapshot()` for real-time post synchronization.
 * 2. Likes: Uses Firestore atomic operators `increment(1)` and `arrayUnion()`
 *    to prevent concurrency race conditions.
 * 3. Comments: Opens real-time `<CommentsModal />` targeting the post's subcollection.
 */

const CATEGORIES = ["All", "General", "Question", "Study Group", "Resources", "Campus News"];

export default function FeedPage() {
  const { user, profile, logout } = useAuth();

  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Like Toggle Handler (Atomic Array & Increment Operation)
  const handleLikeToggle = async (postId: string) => {
    if (!user) return;
    const targetPost = posts.find((p) => p.id === postId);
    if (!targetPost) return;

    const postDocRef = doc(db, "posts", postId);
    const isLiked = targetPost.likedBy?.includes(user.uid);

    try {
      if (isLiked) {
        // Unlike: Decrement count and remove UID from array
        await updateDoc(postDocRef, {
          likesCount: increment(-1),
          likedBy: arrayRemove(user.uid),
        });
      } else {
        // Like: Increment count and add UID to array
        await updateDoc(postDocRef, {
          likesCount: increment(1),
          likedBy: arrayUnion(user.uid),
        });
      }
    } catch (err) {
      console.error("Error toggling like:", err);
    }
  };

  useEffect(() => {
    // 1. Build the Firestore query
    // Equivalent in SQL: SELECT * FROM posts ORDER BY created_at DESC LIMIT 50;
    const postsQuery = query(
      collection(db, "posts"),
      orderBy("createdAt", "desc"),
      limit(50)
    );

    // 2. Attach the real-time listener (Observer Pattern)
    const unsubscribe = onSnapshot(
      postsQuery,
      (snapshot) => {
        const fetchedPosts: Post[] = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<Post, "id">),
        }));

        setPosts(fetchedPosts);
        setIsLoading(false);
      },
      (error) => {
        console.error("Firestore feed listener error:", error);
        setIsLoading(false);
      }
    );

    // 3. Cleanup subscription when unmounting
    return () => unsubscribe();
  }, []);

  // Filter posts based on selected category
  const filteredPosts =
    selectedCategory === "All"
      ? posts
      : posts.filter((p) => p.category === selectedCategory);

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
              <Link href="/feed" className="text-indigo-400 font-semibold">
                Feed
              </Link>
              <Link href="/peers" className="hover:text-white transition">
                Peers
              </Link>
              <Link href="/messages" className="hover:text-white transition">
                Messages
              </Link>
            </nav>

            <div className="flex items-center space-x-3">
              {profile?.photoURL && (
                <Image
                  src={profile.photoURL}
                  alt={profile.name || "User Avatar"}
                  width={34}
                  height={34}
                  className="w-8.5 h-8.5 rounded-full border border-indigo-400/40 bg-slate-800"
                  unoptimized
                />
              )}
              <button
                onClick={() => logout()}
                className="px-3 py-1 rounded-lg text-xs font-semibold bg-white/10 hover:bg-red-500/20 hover:text-red-300 border border-white/10 transition cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          </div>
        </header>

        {/* Main Feed Container */}
        <main className="flex-1 max-w-2xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
          {/* Post Creation Box */}
          <CreatePostCard />

          {/* Category Filter Pills */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition shrink-0 cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Feed Stream */}
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="p-6 rounded-3xl bg-white/5 border border-white/10 animate-pulse space-y-4"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-slate-800" />
                    <div className="space-y-2 flex-1">
                      <div className="h-3.5 bg-slate-800 rounded w-1/4" />
                      <div className="h-2.5 bg-slate-800 rounded w-1/6" />
                    </div>
                  </div>
                  <div className="h-4 bg-slate-800 rounded w-3/4" />
                  <div className="h-4 bg-slate-800 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-16 px-4 rounded-3xl bg-white/5 border border-white/10">
              <div className="text-4xl mb-3">📭</div>
              <h3 className="text-lg font-bold text-white">No posts in this category</h3>
              <p className="text-slate-400 text-sm mt-1 max-w-sm mx-auto">
                Be the first classmate to publish an update, question, or study resource!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onLikeToggle={handleLikeToggle}
                  onOpenComments={(id) => setActiveCommentPostId(id)}
                />
              ))}
            </div>
          )}
        </main>

        {/* Real-time Discussion / Comments Modal */}
        {activeCommentPostId && (
          <CommentsModal
            postId={activeCommentPostId}
            onClose={() => setActiveCommentPostId(null)}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}
