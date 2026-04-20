import { auth } from "../config/firebase";
import { setTokenCookie } from "./cookie";

export default async function emailLogin({ email, password }) {
  const result = await auth.signInWithEmailAndPassword(email, password);
  const token = await result.user.getIdToken();
  setTokenCookie(token);
  return result;
}
