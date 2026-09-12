import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { initAdmin } from "./_adminInit.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).end();
    return;
  }
  await initAdmin();
  const { text, uid } = req.body;
  const db = getFirestore();
  const docRef = await db.collection('memos').add({
    text,
    createdAt: Timestamp.now(),
    uid: uid || null,
  });
  const doc = await docRef.get();
  res.status(201).json({ id: doc.id, ...doc.data() });
}
