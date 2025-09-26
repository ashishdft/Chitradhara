import { createClient } from "@supabase/supabase-js";
import type { Metadata } from "next";
import Script from "next/script";
import WatchClient from "./WatchClient";

// Supabase client (service role for server-side)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

// --- SEO metadata ---
export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params; // ✅ await params
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://chitradhara.com";
  const pageUrl = `${baseUrl}/videos/${id}`;

  const { data: video } = await supabase
    .from("videos")
    .select("title, description, thumbnail_url, deleted_at")
    .eq("id", id)
    .maybeSingle();

  if (!video || video.deleted_at) {
    return {
      title: "Video not found",
      description: "This video could not be found.",
      metadataBase: new URL(baseUrl),
      alternates: { canonical: pageUrl },
    };
  }

  const title = video.title ?? "Chitradhara video";
  const description = video.description ?? "Watch this video on Chitradhara.";

  // ✅ Fix: ensure leading slash is handled
  const ogImage = video.thumbnail_url
    ? [{ url: `${baseUrl}/${video.thumbnail_url.replace(/^\/+/, "")}` }]
    : undefined;

  return {
    title,
    description,
    metadataBase: new URL(baseUrl),
    alternates: { canonical: pageUrl },
    openGraph: {
      title,
      description,
      type: "video.other",
      url: pageUrl,
      images: ogImage,
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title,
      description,
      images: ogImage?.map((i) => i.url),
    },
  };
}

// --- Page component ---
export default async function WatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params; // ✅ await params
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://chitradhara.com";
  const pageUrl = `${baseUrl}/videos/${id}`;

  // Fetch video info
  const { data: video } = await supabase
    .from("videos")
    .select("title, description, file_path, url, deleted_at, thumbnail_url")
    .eq("id", id)
    .maybeSingle();

  if (!video || video.deleted_at) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Video not found</h1>
      </div>
    );
  }

  // Signed video URL (private playback only)
  let signedUrl: string | null = null;
  const storageKey = video.file_path ?? video.url ?? null;
  if (storageKey) {
    const cleanKey = storageKey.startsWith("/") ? storageKey.slice(1) : storageKey;
    const { data: signed } = await supabase.storage
      .from("videos")
      .createSignedUrl(cleanKey, 60 * 60);
    signedUrl = signed?.signedUrl ?? null;
  }

  // ✅ Public thumbnail with safe leading slash
  const publicThumb = video.thumbnail_url
    ? `${baseUrl}/${video.thumbnail_url.replace(/^\/+/, "")}`
    : null;

  // JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: video.title ?? "Chitradhara video",
    description: video.description ?? "Watch this video on Chitradhara.",
    thumbnailUrl: publicThumb ? [publicThumb] : [],
    uploadDate: new Date().toISOString(),
    contentUrl: signedUrl ?? undefined,
    embedUrl: pageUrl,
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">{video.title ?? "Untitled video"}</h1>
      {video.description && <p className="text-gray-600">{video.description}</p>}

      {publicThumb && (
        <img
          src={publicThumb}
          alt="Thumbnail"
          className="w-full max-w-md rounded shadow"
        />
      )}

      <div>
        <WatchClient id={id} signedUrl={signedUrl} />
      </div>

      {/* ✅ JSON-LD schema (pretty printed) */}
      <Script
        id="ld-video"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd, null, 2) }}
      />
    </div>
  );
}

