"use client";

import { useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";

export default function IdTokenProvider() {
  useEffect(() => {
    const auth = getAuth();
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        const token = await user.getIdToken();
        (window as any).__ID_TOKEN__ = token;
      } else {
        (window as any).__ID_TOKEN__ = null;
      }
    });
  }, []);

  return null; // nothing to render
}

