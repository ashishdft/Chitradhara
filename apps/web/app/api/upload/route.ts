// apps/web/app/api/upload/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { v4 as uuid } from "uuid";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const title = formData.get("title") as string;
    const userId = formData.get("userId") as string;
    const userEmail = formData.get("userEmail") as string;

    if (!file || !userId) {
      return NextResponse.json({ error: "Missing file or user" }, { status: 400 });
    }

    // generate storage key
    const key = `uploads/${userId}/${uuid()}-${file.name}`;

    // upload to Supabase Storage
    const { error: uploadError } = await supabase
      .storage
      .from("videos")
      .upload(key, file, { contentType: file.type });

    if (uploadError) throw uploadError;

    // insert DB row
    const { error: insertError } = await supabase.from("videos").insert({
      title: title || file.name,
      file_path: key,
      creator_id: userId,
      creator_email: userEmail,
      deleted_at: null, // ✅ only this
    });

    if (insertError) throw insertError;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("UPLOAD error:", err);
    return NextResponse.json({ error: err.message || "Upload failed" }, { status: 500 });
  }
}

