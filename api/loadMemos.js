import { getFirestore } from "firebase-admin/firestore";
import { initAdmin } from "./_adminInit.js";
import { getRole, requireUser } from "./_auth.js";

export default async function handler(req, res) {
  await initAdmin();
  const user = await requireUser(req, res);
  if (!user) return;
  const role = await getRole(user);
  const db = getFirestore();
  const snapshot = await db.collection('memos').orderBy('createdAt').get();
  const memos = [];
  snapshot.forEach(doc => {
    const data = doc.data();
    memos.push({
      id: doc.id,
      text: data.text,
      createdAt: data.createdAt,
      canDelete: role === "teacher",
    });
  });
  res.status(200).json(memos);
}
