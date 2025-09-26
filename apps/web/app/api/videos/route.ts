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

export async function GET(req: Request) {
  try {
    const uid = await getUserId(req);

    const url = new URL(req.url);
    const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
    const limit = Math.min(50, Math.max(5, Number(url.searchParams.get("limit") ?? "12")));
    const sort = url.searchParams.get("sort") ?? "created_at";
    const order = (url.searchParams.get("order") ?? "desc").toLowerCase() === "asc" ? "asc" : "desc";
    const title = url.searchParams.get("title") ?? "";

    const start = (page - 1) * limit;
    const end = start + limit - 1;

    let query = supabase
      .from("videos")
      .select(
        "id, title, description, url, file_path, creator_id, deleted_at, is_private, thumbnail_url, created_at",
        { count: "exact" }
      )
      .eq("creator_id", uid)
      .is("deleted_at", null)
      .order(sort, { ascending: order === "asc" })
      .range(start, end);

    if (title) {
      query = query.ilike("title", `%${title}%`);
    }

    const { data, error, count } = await query;
    if (error) {
      console.error("[GET /api/videos] error:", error);
      return NextResponse.json({ error: "Failed to fetch videos" }, { status: 500 });
    }

    const videos = await Promise.all(
      (data ?? []).map(async (v) => {
        let signed_url: string | null = null;
        let storageKey = v.file_path ?? v.url ?? null;
        if (storageKey?.startsWith("/")) storageKey = storageKey.slice(1);
        if (storageKey) {
          const { data: signedData } = await supabase.storage
            .from("videos")
            .createSignedUrl(storageKey, 60 * 60);
          signed_url = signedData?.signedUrl ?? null;
        }
        return { ...v, signed_url };
      })
    );

    return NextResponse.json({
      page,
      limit,
      total: count ?? videos.length,
      videos,
    });
  } catch (e: any) {
    const status = e?.message === "Missing token" ? 401 : 500;
    return NextResponse.json({ error: e?.message || "Internal server error" }, { status });
  }
}

