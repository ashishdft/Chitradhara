import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { getUserId } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const uid = await getUserId(req);
    const filePath = `${uid}/seed-${Date.now()}.mp4`;

    const { error } = await supabaseServer.from("videos").insert({
      title: "Seeded Test Video",
      file_path: filePath,
      creator_id: uid,
      creator_email: "test@seed.local",
      is_deleted: false,
      deleted_at: null,
      is_private: true,
    });

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

