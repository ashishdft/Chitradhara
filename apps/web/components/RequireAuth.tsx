"use client";

import { ReactNode, useEffect } from "react";
import { redirect } from "next/navigation";
import { useAuth } from "@/hooks/useAuth"; // ✅ fixed alias — no /src in path

/**
 * Wraps any page/component that should only be visible to logged‑in users.
 * If no user is found and loading is complete, redirects to /login.
 */
export default function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      redirect("/login");
    }
  }, [loading, user]);

  // While checking auth state, render nothing (or a loader if you want)
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500">Checking authentication…</p>
      </div>
    );
  }

  // If user is authenticated, render children
  return <>{children}</>;
}

