"use client";

import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import PageLayout from "@/components/PageLayout";
import toast, { Toaster } from "react-hot-toast";

export default function UploadPage() {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (loading) return;
    if (!user) return toast.error("You must be logged in to upload.");
    if (!file) return toast.error("Please choose a video file.");

    setLoading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("title", title);
      form.append("userId", user.uid);
      form.append("userEmail", user.email || "");

      const res = await fetch("/api/upload", { method: "POST", body: form });
      const json = await res.json();

      if (!res.ok) throw new Error(json.error || "Upload failed");

      toast.success("Video uploaded!");
      window.location.href = "/profile";
    } catch (e: any) {
      toast.error(e.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout>
      <Toaster position="top-right" />
      <div className="p-6 max-w-xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Upload Video</h1>

        <input
          type="text"
          placeholder="Video title (optional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border p-2 mb-3 w-full"
        />

        <input
          type="file"
          accept="video/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="mb-4"
        />

        <div className="flex gap-2">
          <button
            onClick={handleUpload}
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 text-white rounded disabled:opacity-60"
          >
            {loading ? "Uploading..." : "Upload"}
          </button>
        </div>
      </div>
    </PageLayout>
  );
}

