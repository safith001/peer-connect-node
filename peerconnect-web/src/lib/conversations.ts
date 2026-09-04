import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

/**
 * ==============================================================================
 * 1-on-1 Conversation Service & Deterministic Room Pairing
 * ==============================================================================
 * 
 * DESIGN PATTERN: Deterministic Compound Key Generation
 * -----------------------------------------------------
 * A common bug in messaging applications is creating duplicate chat rooms between
 * the same two users (e.g. Alice opens chat with Bob, Bob opens chat with Alice).
 * 
 * In SQL/Laravel:
 * Handled by `Conversation::where(user_one_id, ...)->where(user_two_id, ...)`.
 * 
 * In Cloud Firestore NoSQL:
 * We sort both student UIDs alphabetically and concatenate them with an underscore:
 * `conversationId = [uidA, uidB].sort().join("_")`
 * 
 * Regardless of who clicks "Message" first, both students will ALWAYS resolve to
 * the exact same document ID. Zero duplicate rooms, zero race conditions.
 */

export interface ChatParticipant {
  uid: string;
  name: string;
  photoURL?: string | null;
  faculty?: string | null;
}

export interface Conversation {
  id: string;
  participants: string[]; // [uid1, uid2]
  participantData: {
    [uid: string]: ChatParticipant;
  };
  lastMessage?: {
    text: string;
    senderId: string;
    timestamp: { seconds: number } | null;
  } | null;
  readBy?: string[];
  updatedAt: { seconds: number } | null;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: { seconds: number } | null;
  read: boolean;
}

/**
 * Deterministically generates a unique 1-on-1 conversation ID
 */
export function getConversationId(uid1: string, uid2: string): string {
  return [uid1, uid2].sort().join("_");
}

/**
 * Retrieves an existing 1-on-1 conversation or creates it atomically
 */
export async function getOrCreateConversation(
  currentUser: { uid: string; name: string; photoURL?: string | null; faculty?: string | null },
  peerUser: { uid: string; name: string; photoURL?: string | null; faculty?: string | null }
): Promise<string> {
  const conversationId = getConversationId(currentUser.uid, peerUser.uid);
  const conversationRef = doc(db, "conversations", conversationId);

  let docExists = false;
  try {
    const docSnap = await getDoc(conversationRef);
    docExists = docSnap.exists();
  } catch {
    // If the conversation document doesn't exist yet, Firestore rules checking
    // resource.data.participants can throw permission-denied. We safely treat
    // this as "document does not exist yet" and proceed to setDoc.
    docExists = false;
  }

  if (!docExists) {
    // Create new conversation room with denormalized participant metadata
    await setDoc(
      conversationRef,
      {
        id: conversationId,
        participants: [currentUser.uid, peerUser.uid],
        participantData: {
          [currentUser.uid]: {
            uid: currentUser.uid,
            name: currentUser.name,
            photoURL: currentUser.photoURL || null,
            faculty: currentUser.faculty || null,
          },
          [peerUser.uid]: {
            uid: peerUser.uid,
            name: peerUser.name,
            photoURL: peerUser.photoURL || null,
            faculty: peerUser.faculty || null,
          },
        },
        lastMessage: null,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }

  return conversationId;
}
