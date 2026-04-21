import React, { useState, useEffect, useContext, createContext } from "react";
import { firebase, db } from "../config/firebase";

const authContext = createContext();
export function AuthProvider({ children }) {
  const auth = useProvideAuth();
  return <authContext.Provider value={auth}>{children}</authContext.Provider>;
}
export const useAuth = () => useContext(authContext);

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
    // Session-cookie path: __session is HttpOnly/opaque, so ask the server who it belongs to.
    // Covers agent runs (cookie-only, no IndexedDB) and returning human users.
    fetch("/api/session-verify")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.uid) loadUserDoc(data.uid);
        else setLoading(false);
      })
      .catch(() => setLoading(false));

    // SDK path for humans: re-mint session cookie as the 1h ID token rotates,
    // extending the 14-day window transparently.
    const unsubscribe = firebase.auth().onIdTokenChanged(async (fbUser) => {
      if (fbUser) {
        const idToken = await fbUser.getIdToken();
        fetch("/api/session-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken }),
        });
        loadUserDoc(fbUser.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  return { user, loading, setUser };
}
