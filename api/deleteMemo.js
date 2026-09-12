import { getFirestore } from "firebase-admin/firestore";
import { initAdmin } from "./_adminInit.js";

export default async function handler(req, res) {
  if (req.method !== "DELETE") {
    res.status(405).end();
    return;
  }
  await initAdmin();
  const { id } = req.query; // e.g., /api/deleteMemo?id=3
  if (!id) {
    res.status(400).json({ error: "Missing id" });
    return;
  }
  const db = getFirestore();
  await db.collection('memos').doc(id).delete();
  res.status(200).json({ success: true });
}
