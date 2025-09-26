"use client";

import Link from "next/link";
import React from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <nav className="max-w-6xl mx-auto p-4 flex items-center gap-4">
          <Link href="/" className="font-bold text-lg">Chitradhara 🎥</Link>
          <div className="ml-auto flex items-center gap-4">
            <Link href="/feed" className="hover:underline">Feed</Link>
            <Link href="/profile" className="hover:underline">Profile</Link>
            <Link href="/videos/trash" className="hover:underline">Trash</Link>
            <Link href="/upload" className="hover:underline">Upload</Link>
          </div>
        </nav>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t">
        <div className="max-w-6xl mx-auto p-4 text-sm text-gray-500">
          © {new Date().getFullYear()} Chitradhara
        </div>
      </footer>
    </div>
  );
}

