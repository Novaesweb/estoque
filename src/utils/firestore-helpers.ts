import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { OperationType, FirestoreErrorInfo } from "../types";

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function triggerWebhook(url: string, payload: any) {
  if (!url || !url.startsWith("http")) return;
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...payload,
        source: "OperaRank",
        timestamp: new Date().toISOString()
      })
    });
    if (!response.ok) console.warn("Webhook failed:", response.statusText);
  } catch (err) {
    console.error("Webhook error:", err);
  }
}

export async function sendNotification(userId: string, title: string, body: string, type: string, relatedId?: string) {
  try {
    await addDoc(collection(db, "users", userId, "notifications"), {
      title,
      body,
      type,
      relatedId: relatedId || null,
      read: false,
      createdAt: serverTimestamp()
    });
  } catch (err) {
    console.error("Error sending notification:", err);
  }
}
