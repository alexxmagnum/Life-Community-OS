import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAuthConfigured } from "@life-community-os/auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!isAuthConfigured()) {
    return NextResponse.json({
      configured: false,
      authenticated: false,
      user: null,
    });
  }

  const cookieHeader = request.headers.get("cookie") ?? "";
  const access = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("lcos-access-token="))
    ?.slice("lcos-access-token=".length);

  if (!access) {
    return NextResponse.json({
      configured: true,
      authenticated: false,
      user: null,
    });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!.trim();
  const client = createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${access}` } },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  const { data, error } = await client.auth.getUser(access);
  if (error || !data.user) {
    return NextResponse.json({
      configured: true,
      authenticated: false,
      user: null,
    });
  }

  return NextResponse.json({
    configured: true,
    authenticated: true,
    user: {
      id: data.user.id,
      email: data.user.email ?? null,
    },
  });
}
