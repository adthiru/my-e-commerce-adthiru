import { auth } from "../config/firebase";

export default async function emailLogin({ email, password }) {
  const result = await auth.signInWithEmailAndPassword(email, password);
  const idToken = await result.user.getIdToken();
  await fetch("/api/session-login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  return result;
}
