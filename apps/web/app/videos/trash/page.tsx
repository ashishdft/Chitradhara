"use client";

import { useEffect, useState } from "react";
import { getMyVideos, restoreVideo, deleteVideo } from "@/lib/api";

export default function TrashPage() {
  const [videos, setVideos] = useState<any[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    const data = await getMyVideos("/api/videos/trash");
    setVideos(data?.videos ?? []); // expect { videos: [...] }
  };

  useEffect(() => {
    load();
  }, []);

  const handleRestore = async (id: string) => {
    if (!confirm("Restore this video to My Videos?")) return;
    setBusy(id);
    try {
      await restoreVideo(id); // PATCH { action: "restore" }
      await load();
    } finally {
      setBusy(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Permanently delete this video?")) return;
    setBusy(id);
    try {
      await deleteVideo(id); // PATCH { action: "delete" }
      await load();
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Trash</h1>
      {videos.length === 0 ? (
        <p>No trashed videos.</p>
      ) : (
        <ul className="space-y-4">
          {videos.map((v) => (
            <li key={v.id} className="border rounded p-4 flex justify-between items-center">
              <span>{v.title || "Untitled"}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleRestore(v.id)}
                  disabled={busy === v.id}
                  className="px-3 py-1 bg-green-600 text-white rounded"
                >
                  Restore
                </button>
                <button
                  onClick={() => handleDelete(v.id)}
                  disabled={busy === v.id}
                  className="px-3 py-1 bg-red-600 text-white rounded"
                >
                  Delete Permanently
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

