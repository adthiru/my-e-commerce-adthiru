import React, { useEffect } from "react";

import { auth } from "@/config/firebase";
import { useRouter } from "next/router";

export default function Logout() {
  const router = useRouter();

  useEffect(() => {
    fetch("/api/session-logout", { method: "POST" })
      .finally(() => auth.signOut())
      .finally(() => {
        if (typeof window !== "undefined") router.push("/login");
      });
  }, []);

  return <div></div>;
}
