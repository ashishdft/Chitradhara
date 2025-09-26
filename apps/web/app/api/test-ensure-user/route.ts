import { NextResponse } from "next/server";
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

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

export async function POST(req: Request) {
  try {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Not allowed in production" }, { status: 403 });
    }

    const { email, password } = await req.json().catch(() => ({} as any));
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    const auth = getAuth();
    let user;
    try {
      user = await auth.getUserByEmail(email);
      await auth.updateUser(user.uid, { password });
    } catch {
      user = await auth.createUser({ email, password, emailVerified: true, disabled: false });
    }

    return NextResponse.json({ ok: true, uid: user.uid });
  } catch (e: any) {
    console.error("ensure-user error:", e);
    return NextResponse.json({ error: e.message || "Failed" }, { status: 500 });
  }
}

