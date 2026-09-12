import { getAuth } from "firebase-admin/auth";
import { initAdmin } from "./_adminInit.js";

// 브라우저가 보낸 Firebase 로그인 토큰을 확인합니다.
export async function getUser(req) {
  const authorization = req.headers.authorization || "";
  if (!authorization.startsWith("Bearer ")) return null;

  await initAdmin();
  const token = authorization.slice("Bearer ".length);
  try {
    return await getAuth().verifyIdToken(token);
  } catch {
    return null;
  }
}

export async function requireUser(req, res) {
  const user = await getUser(req);
  if (!user) res.status(401).json({ error: "로그인이 필요합니다." });
  return user;
}
