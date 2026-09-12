import { getFirestore } from "firebase-admin/firestore";
import { initAdmin } from "./_adminInit.js";
import { getUser } from "./_auth.js";

export default async function handler(req, res) {
  await initAdmin();
  const user = await getUser(req);
  const db = getFirestore();
  const snapshot = await db.collection('memos').orderBy('createdAt').get();
  const memos = [];
  snapshot.forEach(doc => {
    const data = doc.data();
    memos.push({
      id: doc.id,
      text: data.text,
      createdAt: data.createdAt,
      canDelete: Boolean(user && data.uid === user.uid),
    });
  });
  res.status(200).json(memos);
}
