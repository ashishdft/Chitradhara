// apps/web/app/api/videos/[id]/signed-url/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { getUserId } from "@/lib/auth";

function isUUID(id?: string) {
  return !!id && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    if (!isUUID(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    // Require auth and ownership for ALL videos
    const uid = await getUserId(req); // throws if missing/invalid token

    const { data: video, error: fetchErr } = await supabaseServer
      .from("videos")
      .select("id, file_path, url, creator_id, deleted_at")
      .eq("id", id.trim())
      .maybeSingle();

    if (fetchErr) {
      console.error("[signed-url] supabase fetch:", fetchErr);
      return NextResponse.json({ error: "Internal" }, { status: 500 });
    }

    if (!video || video.deleted_at) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (video.creator_id !== uid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const storageKey = (video.file_path ?? video.url ?? "").replace(/^\//, "");
    if (!storageKey) return NextResponse.json({ error: "No storage key" }, { status: 400 });

    const { data: signedData, error: signErr } = await supabaseServer.storage
      .from("videos")
      .createSignedUrl(storageKey, 60 * 5);

    if (signErr || !signedData?.signedUrl) {
      console.error("Signed url error:", signErr);
      return NextResponse.json({ error: "Failed to generate signed url" }, { status: 500 });
    }

    return NextResponse.json({ signed_url: signedData.signedUrl });
  } catch (e: any) {
    console.error("/signed-url error:", e);
    const status = e?.message === "Missing token" ? 401 : 500;
    return NextResponse.json({ error: e?.message || "Internal server error" }, { status });
  }
}

