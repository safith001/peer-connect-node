"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

/**
 * ==============================================================================
 * Edit Profile Page (`/profile/edit`)
 * ==============================================================================
 * 
 * In SQL/Laravel, updating a profile executes:
 * `UPDATE users SET bio = ?, faculty = ? WHERE id = ?;`
 * 
 * In Cloud Firestore NoSQL:
 * We use `updateDoc(doc(db, "users", user.uid), { ...fields })`.
 * This surgically updates specified keys without wiping or replacing
 * unchanged fields in the document.
 */
export default function EditProfilePage() {
  const { user, profile, refreshProfile } = useAuth();
  const router = useRouter();

  // Local form state
  const [name, setName] = useState("");
  const [faculty, setFaculty] = useState("");
  const [semester, setSemester] = useState("1");
  const [studentId, setStudentId] = useState("");
  const [bio, setBio] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Pre-fill form when profile loads from Firestore
  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setFaculty(profile.faculty || "");
      setSemester(String(profile.semester || 1));
      setStudentId(profile.studentId || "");
      setBio(profile.bio || "");
    }
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    setStatusMessage(null);

    try {
      const userDocRef = doc(db, "users", user.uid);

      // Perform partial update in Cloud Firestore
      await updateDoc(userDocRef, {
        name: name.trim(),
        faculty: faculty.trim() || null,
        semester: Number(semester) || 1,
        studentId: studentId.trim() || null,
        bio: bio.trim() || null,
        photoURL: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name.trim() || "Peer")}`,
      });

      // Refresh the global AuthContext so the Navbar and Dashboard update immediately
      await refreshProfile();

      setStatusMessage({ type: "success", text: "Profile updated successfully!" });
      setTimeout(() => {
        router.push("/dashboard");
      }, 1200);
    } catch (err) {
      console.error("Error updating profile:", err);
      setStatusMessage({ type: "error", text: "Failed to update profile. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-xl p-8 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Edit Student Profile</h1>
              <p className="text-slate-300 text-xs sm:text-sm mt-1">Keep your campus academic credentials up to date</p>
            </div>
            <Link
              href="/dashboard"
              className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 text-xs font-semibold transition"
            >
              &larr; Back
            </Link>
          </div>

          {/* Status Alert */}
          {statusMessage && (
            <div
              className={`mb-6 p-3.5 rounded-xl text-sm flex items-center space-x-2 ${
                statusMessage.type === "success"
                  ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-300"
                  : "bg-red-500/20 border border-red-500/40 text-red-300"
              }`}
            >
              <span>{statusMessage.type === "success" ? "✅" : "⚠️"}</span>
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Avatar Preview */}
          <div className="flex items-center space-x-4 mb-6 p-4 rounded-2xl bg-white/5 border border-white/10">
            <Image
              src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name || "Peer")}`}
              alt="Avatar Preview"
              width={64}
              height={64}
              className="w-16 h-16 rounded-2xl border border-indigo-400/40 bg-slate-800 shadow-md"
              unoptimized
            />
            <div>
              <p className="text-xs uppercase text-indigo-300 font-semibold tracking-wider">Dynamic Avatar</p>
              <p className="text-xs text-slate-400 mt-0.5">Automatically generated from your display name.</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Full Display Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alex Morgan"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Faculty / Department
                </label>
                <input
                  type="text"
                  value={faculty}
                  onChange={(e) => setFaculty(e.target.value)}
                  placeholder="e.g. Computer Science"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Semester
                </label>
                <select
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition text-sm"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                    <option key={sem} value={sem} className="bg-slate-900 text-white">
                      Semester {sem}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Student ID
              </label>
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="e.g. CS-2026-104"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                About You (Bio)
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell other students about your academic interests, hobbies, or study goals..."
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition text-sm"
              />
            </div>

            <div className="pt-2 flex items-center justify-end space-x-3">
              <Link
                href="/dashboard"
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-300 hover:text-white transition"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white text-sm font-medium shadow-lg hover:shadow-indigo-500/25 transition disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
}
