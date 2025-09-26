import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { getUserId } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const uid = await getUserId(req);

    const { data, error } = await supabaseServer
      .from("videos")
      .select("id, title, description, deleted_at, created_at")
      .eq("creator_id", uid)
      .not("deleted_at", "is", null)   // ✅ only trashed
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ videos: data ?? [] });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

