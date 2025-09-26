// apps/web/app/api/videos/[id]/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAuth } from "firebase-admin/auth";
import { initializeApp, cert, getApps } from "firebase-admin/app";

export const dynamic = "force-dynamic";

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID!,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
      privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
    }),
  });
}

// server-side supabase (service role)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

async function getUserId(req: Request) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) throw new Error("Missing token");
  const decoded = await getAuth().verifyIdToken(token);
  return decoded.uid;
}

function isUUID(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

async function resolveParams(context: any) {
  if (!context) return null;
  const p = context.params;
  if (!p) return null;
  if (typeof (p as any).then === "function") return await p;
  return p;
}

/* ---------- GET /api/videos/[id] ---------- */
export async function GET(req: Request, context: any) {
  try {
    const p = await resolveParams(context);
    const id = p?.id;
    if (!id || !isUUID(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const { data, error } = await supabase
      .from("videos")
      .select("id, title, description, url, file_path, creator_id, deleted_at, is_private, thumbnail_url")
      .eq("id", id)
      .maybeSingle();

    if (error) return NextResponse.json({ error: "Internal" }, { status: 500 });
    if (!data || data.deleted_at) return NextResponse.json({ error: "Video not found" }, { status: 404 });

    let uid: string | null = null;
    try { uid = await getUserId(req); } catch { uid = null; }

    if (data.is_private && data.creator_id !== uid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let signed_url: string | null = null;
    const storageKey = data.file_path ?? data.url ?? null;
    if (storageKey) {
      const key = storageKey.startsWith("/") ? storageKey.slice(1) : storageKey;
      const { data: signedData } = await supabase.storage.from("videos").createSignedUrl(key, 60 * 60);
      signed_url = signedData?.signedUrl ?? null;
    }

    return NextResponse.json({ ...data, signed_url });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Internal server error" }, { status: 500 });
  }
}

/* ---------- PATCH /api/videos/[id] ---------- */
/* Accepts:
   { action: "trash" }   -> set deleted_at
   { action: "restore" } -> clear deleted_at
   { action: "delete" }  -> permanent delete
   { title, description } -> update fields
*/
export async function PATCH(req: Request, context: any) {
  try {
    const p = await resolveParams(context);
    const id = p?.id;
    if (!id || !isUUID(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const uid = await getUserId(req);
    let body: any = {};
    try { body = await req.json(); } catch { body = {}; }

    const { action, title, description } = body ?? {};
    const effectiveAction = action ?? "trash";

    const { data: video } = await supabase.from("videos").select("creator_id").eq("id", id).maybeSingle();
    if (!video) return NextResponse.json({ error: "Video not found" }, { status: 404 });
    if (video.creator_id !== uid) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    if (effectiveAction === "delete") {
      const { error: delErr } = await supabase.from("videos").delete().eq("id", id);
      if (delErr) return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    const updateData: any = {};
    if (effectiveAction === "trash") updateData.deleted_at = new Date().toISOString();
    else if (effectiveAction === "restore") updateData.deleted_at = null;
    else {
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
    }

    const { data: updated, error: updErr } = await supabase
      .from("videos")
      .update(updateData)
      .eq("id", id)
      .select()
      .maybeSingle();

    if (updErr) return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    return NextResponse.json({ success: true, updated });
  } catch (e: any) {
    const status = e?.message === "Missing token" ? 401 : 500;
    return NextResponse.json({ error: e?.message || "Internal server error" }, { status });
  }
}

/* ---------- DELETE /api/videos/[id] ---------- */
export async function DELETE(req: Request, context: any) {
  try {
    const p = await resolveParams(context);
    const id = p?.id;
    if (!id || !isUUID(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const uid = await getUserId(req);

    const { data: video } = await supabase
      .from("videos")
      .select("id, creator_id, file_path, url")
      .eq("id", id)
      .maybeSingle();

    if (!video) return NextResponse.json({ error: "Video not found" }, { status: 404 });
    if (video.creator_id !== uid) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    let storageKey: string | null = video.file_path ?? video.url ?? null;
    if (storageKey?.startsWith("/")) storageKey = storageKey.slice(1);
    if (storageKey) {
      await supabase.storage.from("videos").remove([storageKey]);
    }

    const { error: delErr } = await supabase.from("videos").delete().eq("id", id);
    if (delErr) return NextResponse.json({ error: "Failed to delete video" }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    const status = e?.message === "Missing token" ? 401 : 500;
    return NextResponse.json({ error: e?.message || "Internal server error" }, { status });
  }
}

