import { initializeApp, cert, getApps } from "firebase-admin/app";
let initialized = false;
export async function initAdmin() {
  if (initialized) return;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const adminConfig = {
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey,
    }),
  };
  initializeApp(adminConfig);
  initialized = true;
}
