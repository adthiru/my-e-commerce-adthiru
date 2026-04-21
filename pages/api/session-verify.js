import admin from "../../lib/firebase-admin";

export default async function handler(req, res) {
  const cookie = req.cookies.__session;
  if (!cookie) return res.status(401).end();
  try {
    const decoded = await admin.auth().verifySessionCookie(cookie, true);
    res.status(200).json({ uid: decoded.uid, email: decoded.email });
  } catch {
    res.status(401).end();
  }
}
