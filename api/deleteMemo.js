import { getFirestore } from "firebase-admin/firestore";
import { initAdmin } from "./_adminInit.js";
import { getRole, requireUser } from "./_auth.js";

export default async function handler(req, res) {
  if (req.method !== "DELETE") {
    res.status(405).end();
    return;
  }
  await initAdmin();
  const user = await requireUser(req, res);
  if (!user) return;
  const role = await getRole(user);
  if (role !== "teacher") {
    res.status(403).json({ error: "교사만 메모를 지울 수 있습니다." });
    return;
  }
  const { id } = req.query; // e.g., /api/deleteMemo?id=3
  if (!id) {
    res.status(400).json({ error: "Missing id" });
    return;
  }
  const db = getFirestore();
  const docRef = db.collection('memos').doc(id);
  const doc = await docRef.get();
  if (!doc.exists) {
    res.status(404).json({ error: "메모를 찾을 수 없습니다." });
    return;
  }
  await docRef.delete();
  res.status(200).json({ success: true });
}
