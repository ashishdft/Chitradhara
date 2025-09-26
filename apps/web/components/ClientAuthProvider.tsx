"use client";

import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function ClientAuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (process.env.NODE_ENV === "development") {
        // @ts-ignore
        window.__TEST_ID_TOKEN__ = user ? await user.getIdToken() : null;
      }
    });
    return () => unsub();
  }, []);

  return <>{children}</>;
}

