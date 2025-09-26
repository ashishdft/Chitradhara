import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { getUserId } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const uid = await getUserId(req);
    const { error } = await supabaseServer.from("videos").delete().eq("creator_id", uid);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

