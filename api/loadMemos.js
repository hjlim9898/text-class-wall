import { getFirestore } from "firebase-admin/firestore";
import { initAdmin } from "./_adminInit.js";

export default async function handler(req, res) {
  await initAdmin();
  const db = getFirestore();
  const snapshot = await db.collection('memos').orderBy('createdAt').get();
  const memos = [];
  snapshot.forEach(doc => {
    memos.push({ id: doc.id, ...doc.data() });
  });
  res.status(200).json(memos);
}
