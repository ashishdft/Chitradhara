"use client";

import { useEffect, useState } from "react";
import { getMyVideos } from "@/lib/api";
import VideoCard from "@/components/VideoCard";
import ProfileHeader from "./ProfileHeader";

export default function ProfilePage() {
  const [videos, setVideos] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [sort, setSort] = useState("created_at");
  const [filter, setFilter] = useState("");
  const [showTrashed, setShowTrashed] = useState(false);

  const load = async (reset = false) => {
    const q = new URLSearchParams();
    q.set("page", reset ? "1" : String(page));
    q.set("limit", "9");
    q.set("sort", sort);
    if (filter) q.set("title", filter);

    const endpoint = showTrashed
      ? "/api/videos/trash"
      : `/api/videos?${q.toString()}`;

    const data = await getMyVideos(endpoint);
    const list = data?.videos ?? [];

    if (reset) {
      setVideos(list);
      setPage(2);
      setHasMore(list.length > 0);
    } else {
      setVideos((prev) => [...prev, ...list]);
      setPage((p) => p + 1);
      setHasMore(list.length > 0);
    }
  };

  useEffect(() => {
    load(true);
  }, [sort, filter, showTrashed]);

  return (
    <div className="p-6">
      <ProfileHeader /> {/* 👈 Logout button now visible */}

      <div className="flex gap-4 mb-4">
        <input
          placeholder="Filter by title"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border px-2 py-1 rounded"
        />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="border px-2 py-1 rounded"
        >
          <option value="created_at">Sort by Date</option>
          <option value="title">Sort by Title</option>
        </select>
        <label className="flex items-center gap-1 text-sm">
          <input
            type="checkbox"
            checked={showTrashed}
            onChange={(e) => setShowTrashed(e.target.checked)}
          />
          Show trashed
        </label>
      </div>

      {videos.length === 0 ? (
        <p>No videos found.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {videos.map((v) => (
            <VideoCard key={v.id} video={v} onUpdated={() => load(true)} />
          ))}
        </div>
      )}

      {hasMore && (
        <div className="mt-4">
          <button
            onClick={() => load()}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
}

