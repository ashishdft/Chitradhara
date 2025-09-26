"use client";

import { useState } from "react";
import Link from "next/link";
import { updateVideo, moveToTrash, restoreVideo } from "@/lib/api";

interface Props {
  video: any;
  onUpdated: () => void;
}

export default function VideoCard({ video, onUpdated }: Props) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(video.title || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    try {
      await updateVideo(video.id, { title });
      setEditing(false);
      onUpdated();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTrash = async () => {
    if (!confirm("Move this video to trash?")) return;
    setLoading(true);
    try {
      await moveToTrash(video.id); // PATCH { action: "trash" }
      onUpdated();
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    if (!confirm("Restore this video?")) return;
    setLoading(true);
    try {
      await restoreVideo(video.id); // PATCH { action: "restore" }
      onUpdated();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative border rounded-lg p-4 shadow bg-white">
      {loading && (
        <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10 rounded-lg">
          <div className="w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      <div className="flex items-center gap-2">
        {editing ? (
          <>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="border px-2 py-1 rounded flex-1"
            />
            <button onClick={handleSave} className="px-3 py-1 bg-blue-600 text-white rounded">
              Save
            </button>
            <button onClick={() => setEditing(false)} className="px-3 py-1 border rounded">
              Cancel
            </button>
          </>
        ) : (
          <>
            <h3 className="font-semibold flex-1">
              <Link href={`/videos/${video.id}`} className="hover:underline">
                {video.title || "Untitled"}
              </Link>
            </h3>
            <button onClick={() => setEditing(true)} className="px-3 py-1 border rounded">
              Edit
            </button>
          </>
        )}
      </div>

      {video.signed_url ? (
        <video controls src={video.signed_url} className="w-full h-48 object-cover mt-2 rounded" />
      ) : (
        <p className="text-sm text-gray-500 mt-2">No video file</p>
      )}

      <div className="flex gap-2 mt-3">
        {!video.is_deleted ? (
          <button onClick={handleTrash} className="px-3 py-1 bg-red-600 text-white rounded">
            Move to Trash
          </button>
        ) : (
          <button onClick={handleRestore} className="px-3 py-1 bg-green-600 text-white rounded">
            Restore
          </button>
        )}
      </div>

      {error && <p className="text-red-600 mt-2">{error}</p>}
    </div>
  );
}

