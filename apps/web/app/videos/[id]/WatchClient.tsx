// apps/web/app/videos/[id]/WatchClient.tsx
"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { getFreshSignedUrl } from "@/lib/api";

interface Props {
  id: string;
}

export default function WatchClient({ id }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 2;

  const fetchSignedUrl = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const json = await getFreshSignedUrl(id); // includes Bearer token via api.ts
      const signed = json.signed_url ?? json.url ?? json.signedUrl ?? null;
      if (!signed) {
        setError("No signed URL returned.");
        return;
      }

      setSrc(signed);
      const v = videoRef.current;
      if (v) {
        v.pause();
        v.src = signed;
        v.load();
        v.play().catch(() => {});
      }
    } catch (e: any) {
      // map common error strings to friendly messages
      const msg = String(e?.message || "Unknown error");
      if (/Unauthorized/i.test(msg)) setError("You must sign in to view this video (401).");
      else if (/Forbidden/i.test(msg)) setError("Access forbidden (403). You don't have permission to view this video.");
      else if (/Not found/i.test(msg)) setError("Video not found (404).");
      else setError(msg);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSignedUrl();
  }, [fetchSignedUrl]);

  const onVideoError = async () => {
    if (retryCount >= MAX_RETRIES) {
      setError("Playback error and retry limit reached.");
      return;
    }
    setRetryCount((c) => c + 1);
    await fetchSignedUrl();
  };

  if (loading) return <div className="w-full max-w-3xl h-64 bg-gray-200 animate-pulse rounded" />;

  if (error)
    return (
      <div className="p-4">
        <p className="text-red-500">{error}</p>
        <div className="mt-2">
          <button
            onClick={() => {
              setRetryCount(0);
              fetchSignedUrl();
            }}
            className="px-3 py-1 bg-blue-600 text-white rounded"
          >
            Retry
          </button>
        </div>
      </div>
    );

  return (
    <div>
      {src ? (
        <video
          ref={videoRef}
          src={src}
          controls
          className="w-full max-w-3xl rounded shadow"
          onError={onVideoError}
        />
      ) : (
        <p className="text-gray-500">No video source available.</p>
      )}
    </div>
  );
}

