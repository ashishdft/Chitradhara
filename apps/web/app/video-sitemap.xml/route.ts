// apps/web/app/video-sitemap.xml/route.ts
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://chitradhara.com";

  // fetch videos using created_at
  const { data: videos, error } = await supabase
    .from("videos")
    .select(
      "id, title, description, thumbnail_url, deleted_at, created_at"
    )
    .order("created_at", { ascending: false });


  const urls = (videos || [])
    .filter((v) => !v.deleted_at)
    .map((v) => {
      const loc = `${baseUrl}/videos/${v.id}`;
      const thumb = v.thumbnail_url
        ? `${baseUrl}/${v.thumbnail_url.replace(/^\/+/, "")}`
        : "";
      const title = v.title || "Chitradhara video";
      const desc = v.description || "Watch this video on Chitradhara.";
      const pubDate = v.created_at || new Date().toISOString();

      return `
        <url>
          <loc>${loc}</loc>
          <video:video>
            <video:thumbnail_loc>${thumb}</video:thumbnail_loc>
            <video:title><![CDATA[${title}]]></video:title>
            <video:description><![CDATA[${desc}]]></video:description>
            <video:player_loc>${loc}</video:player_loc>
            <video:publication_date>${pubDate}</video:publication_date>
          </video:video>
        </url>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:video="http://www.google.com/schemas/sitemap-video/1.1"
>
  ${urls}
</urlset>`;

  return new NextResponse(xml, {
    headers: { "Content-Type": "application/xml" },
  });
}

