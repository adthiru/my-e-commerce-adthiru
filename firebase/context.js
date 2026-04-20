import React, { useState, useEffect, useContext, createContext } from "react";
import { firebase, auth, db } from "../config/firebase";
import { readTokenCookie, decodeTokenPayload, setTokenCookie, clearTokenCookie } from "./cookie";

const authContext = createContext();
export function AuthProvider({ children }) {
  const auth = useProvideAuth();
  return <authContext.Provider value={auth}>{children}</authContext.Provider>;
}
export const useAuth = () => {
  console.log("useAuth");
  return useContext(authContext);
};
function useProvideAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUserDoc = (uid) =>
    db
      .collection("Users")
      .doc(uid)
      .get()
      .then((doc) => {
        setUser(doc.data());
        setLoading(false);
      })
      .catch(() => setLoading(false));

  useEffect(() => {
    // Cookie-first path: if a fb_token cookie exists (e.g. replayed by an agent
    // with no IndexedDB), trust its uid claim and load the user doc directly.
    const token = readTokenCookie();
    const payload = token ? decodeTokenPayload(token) : null;
    const cookieUid = payload?.user_id || payload?.sub;
    if (cookieUid) {
      loadUserDoc(cookieUid);
    }

    // Firebase SDK path: runs for normal users whose IndexedDB is intact, and
    // keeps the cookie in sync as the ID token rotates (~hourly).
    const unsubscribe = firebase.auth().onIdTokenChanged(async (fbUser) => {
      if (fbUser) {
        const fresh = await fbUser.getIdToken();
        setTokenCookie(fresh);
        loadUserDoc(fbUser.uid);
      } else if (!cookieUid) {
        clearTokenCookie();
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  return {
    user,
    loading,
    setUser,
  };
}
