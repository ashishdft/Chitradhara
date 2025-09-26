"use client";

import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function ProfileHeader() {
  const handleLogout = async () => {
    await signOut(auth);
    // Redirect to login after logout
    window.location.href = "/login";
  };

  return (
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-2xl font-bold">My Videos</h2>
      <button
        onClick={handleLogout}
        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
      >
        Logout
      </button>
    </div>
  );
}

