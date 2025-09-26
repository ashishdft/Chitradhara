"use client";

import React, { ReactNode, useEffect, useState, useMemo } from "react";
import { onAuthStateChanged, getAuth, User } from "firebase/auth";
import { app } from "@/lib/firebase"; // ✅ fixed alias

type AuthContextType = {
  user: User | null;
  loading: boolean;
};

export const AuthContext = React.createContext<AuthContextType>({
  user: null,
  loading: true,
});

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
      // console.log("Auth state changed:", firebaseUser); // 🔍 Debug if needed
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const contextValue = useMemo(
    () => ({ user, loading }),
    [user, loading]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

