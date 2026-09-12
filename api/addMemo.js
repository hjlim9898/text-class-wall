import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { initAdmin } from "./_adminInit.js";
import { requireUser } from "./_auth.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).end();
    return;
  }
  await initAdmin();
  const user = await requireUser(req, res);
  if (!user) return;
  const text = req.body?.text?.trim();
  if (!text) {
    res.status(400).json({ error: "메모 내용을 입력해 주세요." });
    return;
  }
  const db = getFirestore();
  const docRef = await db.collection('memos').add({
    text,
    createdAt: Timestamp.now(),
    uid: user.uid,
  });
  const doc = await docRef.get();
  res.status(201).json({ id: doc.id, ...doc.data() });
}
