"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { uploadToCloudinary } from "@/lib/cloudinary";
import ProtectedRoute from "@/components/ProtectedRoute";

/**
 * ==============================================================================
 * Edit Profile Page (`/profile/edit`)
 * ==============================================================================
 * 
 * ARCHITECTURAL CONCEPT:
 * In a traditional relational stack (Java Hibernate / Laravel Eloquent), updating
 * a profile involves:
 *   `UPDATE users SET name = ?, bio = ?, photo_url = ? WHERE id = ?;`
 * along with handling local disk file storage (`storage/app/public/avatars`).
 * 
 * IN PEERCONNECT'S SERVERLESS ARCHITECTURE:
 * 1. Avatars upload directly to Cloudinary CDN via an unsigned preset, returning
 *    a fast, cached HTTPS URL.
 * 2. We perform a partial update in Cloud Firestore (`updateDoc`), persisting:
 *    - Display Name, Bio, Faculty, Semester, Student ID
 *    - Academic Skills array (e.g. `["Python", "Data Structures"]`)
 *    - Permanent CDN Photo URL
 * 3. We sync the Firebase Auth User session (`updateProfile`) so the active
 *    JWT token retains the user's updated display name and avatar.
 * 4. We invoke `refreshProfile()` to immediately broadcast changes across the
 *    entire Next.js app via React's Context API.
 */
export default function EditProfilePage() {
  const { user, profile, refreshProfile } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form fields
  const [name, setName] = useState("");
  const [faculty, setFaculty] = useState("");
  const [semester, setSemester] = useState("1");
  const [studentId, setStudentId] = useState("");
  const [bio, setBio] = useState("");

  // Avatar states
  const [currentPhotoURL, setCurrentPhotoURL] = useState<string | null>(null);
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);

  // Skills tag system
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");

  // Loading and feedback states
  const [isLoading, setIsLoading] = useState(false);
  const [uploadStep, setUploadStep] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Popular academic skill suggestions for fast 1-click addition
  const suggestedSkills = [
    "Python",
    "Java",
    "JavaScript",
    "React",
    "Data Structures",
    "Algorithms",
    "Machine Learning",
    "SQL",
    "UI/UX Design",
    "Cybersecurity",
  ];

  // Pre-fill form when profile loads from Firestore
  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setFaculty(profile.faculty || "");
      setSemester(String(profile.semester || 1));
      setStudentId(profile.studentId || "");
      setBio(profile.bio || "");
      setCurrentPhotoURL(profile.photoURL || null);
      if (Array.isArray(profile.skills)) {
        setSkills(profile.skills);
      }
    }
  }, [profile]);

  // Clean up object URLs when unmounting or changing preview
  useEffect(() => {
    return () => {
      if (avatarPreviewUrl && avatarPreviewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreviewUrl);
      }
    };
  }, [avatarPreviewUrl]);

  // Handle local avatar file selection
  const handleAvatarFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate image MIME type
    if (!file.type.startsWith("image/")) {
      setStatusMessage({ type: "error", text: "Please select a valid image file (PNG, JPG, or WEBP)." });
      return;
    }

    // Validate size (max 5 MB for avatars)
    if (file.size > 5 * 1024 * 1024) {
      setStatusMessage({ type: "error", text: "Avatar image must be under 5 MB in size." });
      return;
    }

    setSelectedAvatarFile(file);
    const objectUrl = URL.createObjectURL(file);
    setAvatarPreviewUrl(objectUrl);
    setStatusMessage(null);
  };

  // Revert back to Dicebear default avatar
  const handleResetToDefaultAvatar = () => {
    setSelectedAvatarFile(null);
    if (avatarPreviewUrl && avatarPreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreviewUrl);
    }
    setAvatarPreviewUrl(null);
    setCurrentPhotoURL(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Add a skill to the tag list
  const handleAddSkill = (skillToAdd?: string) => {
    const raw = skillToAdd !== undefined ? skillToAdd : skillInput;
    const trimmed = raw.trim();

    if (!trimmed) return;

    // Prevent duplicate skill tags (case-insensitive check)
    const exists = skills.some((s) => s.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      setSkillInput("");
      return;
    }

    // Maximum of 12 skills
    if (skills.length >= 12) {
      setStatusMessage({ type: "error", text: "You can add a maximum of 12 skills." });
      return;
    }

    setSkills([...skills, trimmed]);
    setSkillInput("");
  };

  // Remove a skill from the tag list
  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  // Handle Enter key inside the skill input box
  const handleSkillKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      handleAddSkill();
    }
  };

  // Compute the active avatar source URL for preview display
  const activeAvatarSrc =
    avatarPreviewUrl ||
    currentPhotoURL ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name.trim() || "Peer")}`;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!name.trim()) {
      setStatusMessage({ type: "error", text: "Display name cannot be empty." });
      return;
    }

    setIsLoading(true);
    setStatusMessage(null);

    try {
      let finalPhotoURL = currentPhotoURL;

      // 1. Upload new custom avatar to Cloudinary if selected
      if (selectedAvatarFile) {
        setUploadStep("Uploading avatar to secure CDN...");
        const uploadResult = await uploadToCloudinary(selectedAvatarFile);
        finalPhotoURL = uploadResult.url;
      } else if (!currentPhotoURL) {
        // Fallback to dynamic Dicebear avatar
        finalPhotoURL = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name.trim() || "Peer")}`;
      }

      setUploadStep("Saving profile updates...");

      // 2. Update Firestore user document
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, {
        name: name.trim(),
        faculty: faculty.trim() || null,
        semester: Number(semester) || 1,
        studentId: studentId.trim() || null,
        bio: bio.trim() || null,
        photoURL: finalPhotoURL,
        skills: skills,
        updatedAt: serverTimestamp(),
      });

      // 3. Synchronize Firebase Auth's local session
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: name.trim(),
          photoURL: finalPhotoURL,
        });
      }

      // 4. Refresh global AuthContext
      await refreshProfile();

      setStatusMessage({ type: "success", text: "Profile updated successfully! Redirecting..." });
      setTimeout(() => {
        router.push("/dashboard");
      }, 1200);
    } catch (err) {
      console.error("Error updating profile:", err);
      setStatusMessage({ type: "error", text: "Failed to update profile. Please verify your connection and try again." });
    } finally {
      setIsLoading(false);
      setUploadStep(null);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 py-12">
        <div className="w-full max-w-2xl p-6 sm:p-8 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Edit Student Profile</h1>
              <p className="text-slate-300 text-xs sm:text-sm mt-1">
                Customize your academic identity, avatar, and study skills
              </p>
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
              className={`mb-6 p-4 rounded-xl text-sm flex items-center space-x-3 ${
                statusMessage.type === "success"
                  ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-300"
                  : "bg-red-500/20 border border-red-500/40 text-red-300"
              }`}
            >
              <span className="text-lg">{statusMessage.type === "success" ? "✅" : "⚠️"}</span>
              <span className="font-medium">{statusMessage.text}</span>
            </div>
          )}

          {/* Avatar Management Section */}
          <div className="mb-8 p-5 rounded-2xl bg-white/5 border border-white/10">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-3">
              Profile Photo & Avatar
            </label>
            <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-5">
              <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-indigo-400/50 bg-slate-800 shadow-lg shrink-0">
                <Image
                  src={activeAvatarSrc}
                  alt="Profile Avatar"
                  fill
                  className="object-cover"
                  unoptimized={activeAvatarSrc.includes("dicebear") || activeAvatarSrc.startsWith("blob:")}
                />
              </div>

              <div className="flex-1 text-center sm:text-left space-y-2">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleAvatarFileSelect}
                    accept="image/png, image/jpeg, image/webp"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition shadow-md cursor-pointer flex items-center space-x-1.5"
                  >
                    <span>📷</span>
                    <span>Upload Custom Photo</span>
                  </button>

                  {(selectedAvatarFile || currentPhotoURL) && (
                    <button
                      type="button"
                      onClick={handleResetToDefaultAvatar}
                      className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-red-500/20 hover:text-red-300 text-slate-300 text-xs font-medium transition cursor-pointer"
                    >
                      Use Default Initials
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-400">
                  Supported formats: JPG, PNG, or WEBP (Max 5 MB). Uploaded directly to secure Cloudinary CDN.
                </p>
              </div>
            </div>
          </div>

          {/* Main Edit Form */}
          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Full Display Name <span className="text-pink-400">*</span>
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
                  placeholder="e.g. Computer Science & Engineering"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Semester
                </label>
                <select
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition text-sm"
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
                Student ID / Enrollment Number
              </label>
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="e.g. CS-2026-104"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition text-sm"
              />
            </div>

            {/* Academic Skills & Topics Section */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Academic Skills & Topics of Interest ({skills.length}/12)
              </label>
              <div className="flex items-center space-x-2 mb-2.5">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={handleSkillKeyDown}
                  placeholder="Type a skill and press Enter (e.g. Python, SQL, Calculus)..."
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition text-sm"
                />
                <button
                  type="button"
                  onClick={() => handleAddSkill()}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition cursor-pointer"
                >
                  Add
                </button>
              </div>

              {/* Active Skill Badges */}
              {skills.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  {skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium bg-indigo-500/20 border border-indigo-500/40 text-indigo-300"
                    >
                      <span>{skill}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="hover:text-white transition cursor-pointer font-bold ml-1 text-slate-400"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Suggested Quick Add Chips */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
                <span className="mr-1 text-slate-500">Suggested:</span>
                {suggestedSkills
                  .filter((s) => !skills.some((existing) => existing.toLowerCase() === s.toLowerCase()))
                  .slice(0, 6)
                  .map((suggested) => (
                    <button
                      key={suggested}
                      type="button"
                      onClick={() => handleAddSkill(suggested)}
                      className="px-2 py-0.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition cursor-pointer text-xs"
                    >
                      + {suggested}
                    </button>
                  ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                About You (Academic Bio)
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Share your academic interests, study goals, or what subjects you're looking to collaborate on..."
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition text-sm leading-relaxed"
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-white/10 flex items-center justify-end space-x-3">
              <Link
                href="/dashboard"
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-300 hover:text-white transition"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white text-sm font-medium shadow-lg hover:shadow-indigo-500/25 transition disabled:opacity-50 cursor-pointer flex items-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <span className="animate-spin text-xs">⏳</span>
                    <span>{uploadStep || "Saving Changes..."}</span>
                  </>
                ) : (
                  <span>Save Profile</span>
                )}
              </button>
            </div>
          </form>

        </div>
      </div>
    </ProtectedRoute>
  );
}
