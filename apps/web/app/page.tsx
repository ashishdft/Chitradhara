// apps/web/app/page.tsx
"use client";

import { useEffect, useState } from "react";
import PageLayout from "@/components/PageLayout";
import VideoCard from "@/components/VideoCard";
import { useAuth } from "@/hooks/useAuth";
import { getMyVideos } from "@/lib/api";

export default function HomePage() {
  const { user, loading } = useAuth();
  const [videos, setVideos] = useState<any[]>([]);

  useEffect(() => {
    async function fetchVideos() {
      if (loading || !user) return;
      const data = await getMyVideos("/api/videos");
      setVideos(data?.videos ?? []);
    }
    fetchVideos();
  }, [loading, user]);

  return (
    <PageLayout>
      <h1 className="text-2xl font-bold mb-4">Latest Videos</h1>
      {!user ? (
        <p className="text-gray-600">Please log in to see your latest videos.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {videos.map((video) => (
            <VideoCard key={video.id} video={video} onUpdated={() => {}} />
          ))}
        </div>
      )}
    </PageLayout>
  );
}

