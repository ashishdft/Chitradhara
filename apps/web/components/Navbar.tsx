"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { signOut, onAuthStateChanged, User } from "firebase/auth";

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    alert("👋 Logged out!");
  };

  return (
    <nav className="flex justify-between items-center px-6 py-4 bg-indigo-600 text-white">
      {/* Logo / Title */}
      <Link href="/" className="text-xl font-bold hover:underline">
        Chitradhara 🎥
      </Link>

      {/* Navigation Links */}
      <div className="flex items-center gap-4">
        <Link href="/about" className="hover:underline">
          About
        </Link>

        {!user ? (
          <>
            <Link href="/login" className="hover:underline">
              Login
            </Link>
            <Link href="/signup" className="hover:underline">
              Sign Up
            </Link>
          </>
        ) : (
          <>
            <span className="text-sm text-gray-200">
              {user.email}
            </span>
            <button
              onClick={handleLogout}
              className="bg-red-500 px-3 py-1 rounded-lg hover:bg-red-600"
            >
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
}

