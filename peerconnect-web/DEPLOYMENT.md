# 🚀 PeerConnect Deployment & Cloud Setup Guide

This guide walks you through deploying **PeerConnect** to Google Firebase with live Authentication, Cloud Firestore, and Hosting.

---

## 1. Create Your Free Google Firebase Project

1. Navigate to the [Firebase Console](https://console.firebase.google.com/) and sign in with your Google account.
2. Click **Add project** (or **Create a project**).
   - Project Name: `peerconnect-live` (or any unique name).
   - Google Analytics: Optional (can disable for development).
3. Once the project is provisioned, click **Continue**.

---

## 2. Enable Authentication & Database Services

### A. Enable Firebase Authentication
1. In the left sidebar, go to **Build ➔ Authentication**.
2. Click **Get started**.
3. Under the **Sign-in method** tab, click **Email/Password**.
4. Toggle **Enable** to ON and click **Save**.

### B. Provision Cloud Firestore (NoSQL Database)
1. In the left sidebar, go to **Build ➔ Firestore Database**.
2. Click **Create database**.
3. Select your preferred database location (e.g. `nam5 (us-central)` or `asia-south1`).
4. Select **Start in production mode** (we already wrote custom production rules in `firestore.rules`!).
5. Click **Create**.

---

## 3. Register Your Web App & Link Environment Variables

1. On the Project Overview home page, click the **Web icon (`</>`)** to register a web app.
2. App nickname: `PeerConnect Web`.
3. Firebase will generate your 6 configuration keys:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "peerconnect-live.firebaseapp.com",
     projectId: "peerconnect-live",
     storageBucket: "peerconnect-live.appspot.com",
     messagingSenderId: "...",
     appId: "..."
   };
   ```
4. Open [`peerconnect-web/.env.local`](file:///c:/Users/MSMSAFITH/Downloads/projects/antigravity/peerconnect/peerconnect/peerconnect-web/.env.local) and paste these keys:
   ```dotenv
   NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSy..."
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="peerconnect-live.firebaseapp.com"
   NEXT_PUBLIC_FIREBASE_PROJECT_ID="peerconnect-live"
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="peerconnect-live.appspot.com"
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="..."
   NEXT_PUBLIC_FIREBASE_APP_ID="..."
   ```

---

## 4. Deploy Cloud Security Rules

To push our production [`firestore.rules`](file:///c:/Users/MSMSAFITH/Downloads/projects/antigravity/peerconnect/peerconnect/peerconnect-web/firestore.rules) to Google's servers:

```bash
cd peerconnect-web
npx -y firebase-tools login
npx -y firebase-tools use --add
npx -y firebase-tools deploy --only firestore:rules
```

*(Alternatively, you can copy the contents of `firestore.rules` and paste them directly into the **Firestore Database ➔ Rules** tab in the Firebase Console and click **Publish**).*

---

## 5. Deployment Options for the Frontend

### Option A: Deploy to Firebase App Hosting (Google Cloud)
Google's official serverless Next.js hosting solution:
1. In Firebase Console, go to **Build ➔ App Hosting**.
2. Connect your GitHub repository.
3. Set root directory to `peerconnect-web`.
4. Firebase App Hosting automatically builds and deploys your Next.js application with zero server maintenance.

### Option B: Deploy to Vercel (1-Click)
1. Push your code to GitHub.
2. Go to [vercel.com](https://vercel.com) and import the repository.
3. Set the Root Directory to `peerconnect-web`.
4. Under **Environment Variables**, paste the 6 `NEXT_PUBLIC_FIREBASE_*` keys from `.env.local`.
5. Click **Deploy** — your site will be live worldwide on a `.vercel.app` domain with free SSL!

### Option C: Run Local Production Server
To preview the production bundle locally:
```bash
npm run start -- -p 3001
```
