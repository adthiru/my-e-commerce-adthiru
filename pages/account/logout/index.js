import React from "react";

import { auth } from "@/config/firebase";
import { clearTokenCookie } from "firebase/cookie";
import { useRouter } from "next/router";

export default function Logout() {
  const router = useRouter();

  auth
    .signOut()
    .finally(() => {
      clearTokenCookie();
      if (typeof window !== "undefined") router.push("/login");
    });
  return <div></div>;
}
