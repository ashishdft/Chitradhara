// apps/web/app/sitemap.ts
import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://chitradhara.com";

  // fetch videos with correct timestamp column
  const { data: videos, error } = await supabase
    .from("videos")
    .select("id, created_at, deleted_at");


  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];

  const videoPages: MetadataRoute.Sitemap = (videos || [])
    .filter((v) => !v.deleted_at)
    .map((v) => ({
      url: `${baseUrl}/videos/${v.id}`,
      lastModified: v.created_at ? new Date(v.created_at) : new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    }));

  return [...staticPages, ...videoPages];
}

