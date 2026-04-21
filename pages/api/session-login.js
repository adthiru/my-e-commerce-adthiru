import admin from "../../lib/firebase-admin";

const EXPIRES_IN_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  try {
    const { idToken } = req.body;
    await admin.auth().verifyIdToken(idToken);
    const cookie = await admin.auth().createSessionCookie(idToken, { expiresIn: EXPIRES_IN_MS });
    res.setHeader(
      "Set-Cookie",
      `__session=${cookie}; Max-Age=${EXPIRES_IN_MS / 1000}; HttpOnly; Secure; SameSite=Lax; Path=/`
    );
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(401).json({ error: e.message });
  }
}
