"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

/**
 * ==============================================================================
 * Global Authentication Context (AuthContext)
 * ==============================================================================
 * 
 * DESIGN PATTERN: Observer Pattern & React Context API
 * ---------------------------------------------------
 * In Java/Spring, you might check `SecurityContextHolder.getContext().getAuthentication()`.
 * In React, we use the Context API to broadcast the currently authenticated user
 * to the entire component tree without needing to pass props manually ("prop drilling").
 * 
 * Firebase Auth uses the OBSERVER PATTERN via `onAuthStateChanged()`:
 * Whenever the user logs in, logs out, or reloads the tab, Firebase emits an event
 * containing the active user credentials (or null).
 */

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  studentId?: string | null;
  faculty?: string | null;
  semester?: number | null;
  bio?: string | null;
  photoURL?: string | null;
  skills?: string[] | null;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  logout: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper function to fetch the Firestore user document
  const fetchProfile = async (firebaseUser: User) => {
    try {
      const docRef = doc(db, "users", firebaseUser.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setProfile(docSnap.data() as UserProfile);
      }
    } catch (err) {
      console.error("Error fetching Firestore user profile:", err);
    }
  };

  useEffect(() => {
    // Subscribe to Firebase Auth state updates
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await fetchProfile(firebaseUser);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    // Cleanup subscription on component unmount (prevents memory leaks)
    return () => unsubscribe();
  }, []);

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setProfile(null);
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to consume the AuthContext conveniently
export const useAuth = () => useContext(AuthContext);
