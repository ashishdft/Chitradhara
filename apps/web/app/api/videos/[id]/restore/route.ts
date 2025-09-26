// apps/web/app/api/videos/[id]/restore/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAuth } from "firebase-admin/auth";
import { initializeApp, cert, getApps } from "firebase-admin/app";

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID!,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
      privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
    }),
  });
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

function isValidUUID(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

async function getUid(req: Request) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) throw new Error("Missing token");
  const decoded = await getAuth().verifyIdToken(token);
  return decoded.uid;
}

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    if (!isValidUUID(id)) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    const uid = await getUid(req);

    const { data: video } = await supabase
      .from("videos")
      .select("id, creator_id")
      .eq("id", id)
      .maybeSingle();

    if (!video) return NextResponse.json({ error: "Video not found" }, { status: 404 });
    if (video.creator_id !== uid) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { data: updated, error: updErr } = await supabase
      .from("videos")
      .update({ deleted_at: null }) // ✅ only deleted_at
      .eq("id", id)
      .select("id, title, deleted_at")
      .maybeSingle();

    if (updErr) return NextResponse.json({ error: "Failed to restore video" }, { status: 500 });
    if (!updated) return NextResponse.json({ error: "Video not updated" }, { status: 404 });

    return NextResponse.json(updated);
  } catch (e: any) {
    const status = e?.message === "Missing token" ? 401 : 500;
    return NextResponse.json({ error: e?.message || "Internal server error" }, { status });
  }
}

