// apps/web/app/feed/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getMyVideos } from "@/lib/api";
import VideoCard from "@/components/VideoCard";

export default function FeedPage() {
  const { user, loading } = useAuth();
  const [videos, setVideos] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      if (loading || !user) return;
      setBusy(true);
      try {
        const data = await getMyVideos("/api/videos");
        setVideos(data?.videos ?? []);
      } catch (e) {
        console.error("Feed load error:", e);
        setVideos([]);
      } finally {
        setBusy(false);
      }
    })();
  }, [loading, user]);

  if (loading) return <div className="p-6">Loading…</div>;
  if (!user) return <div className="p-6">Please log in to view your feed.</div>;
  if (busy) return <div className="p-6">Loading videos…</div>;
  if (videos.length === 0) return <div className="p-6">No videos yet.</div>;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 p-6">
      {videos.map((v) => (
        <VideoCard key={v.id} video={v} onUpdated={() => {}} />
      ))}
    </div>
  );
}

