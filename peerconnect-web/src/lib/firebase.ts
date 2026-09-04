import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

/**
 * ==============================================================================
 * Firebase Client Configuration & Singleton Initialization
 * ==============================================================================
 * 
 * In Next.js, code runs both on the server (SSR) and on the client (browser),
 * and files are frequently re-executed during development due to "Hot Reloading"
 * (HMR).
 * 
 * DESIGN PATTERN: The Singleton Pattern
 * -------------------------------------
 * In Java or Python, a Singleton ensures a class only ever has ONE active instance.
 * If we called `initializeApp(firebaseConfig)` every time this file was read,
 * Firebase would crash with: `FirebaseError: [DEFAULT] Firebase App already exists`.
 * 
 * By checking `getApps().length > 0`, we reuse the existing instance (`getApp()`)
 * if it already exists, or initialize a new one if it does not.
 */

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase using the Singleton guard
const app: FirebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Export Firebase Authentication instance (handles login, signup, tokens)
export const auth: Auth = getAuth(app);

// Export Cloud Firestore instance (handles real-time NoSQL database queries)
export const db: Firestore = getFirestore(app);

export default app;
