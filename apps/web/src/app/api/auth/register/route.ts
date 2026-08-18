import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAuthConfigured } from "@life-community-os/auth";

export const runtime = "nodejs";

function publicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!.trim();
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export async function POST(request: Request) {
  if (!isAuthConfigured()) {
    return NextResponse.json(
      {
        error: "auth_not_configured",
        message:
          "Configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY",
      },
      { status: 503 },
    );
  }

  let body: { email?: string; password?: string; displayName?: string };
  try {
    body = (await request.json()) as {
      email?: string;
      password?: string;
      displayName?: string;
    };
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const email = body.email?.trim();
  const password = body.password ?? "";
  if (!email || password.length < 8) {
    return NextResponse.json(
      { error: "invalid_credentials" },
      { status: 400 },
    );
  }

  const client = publicClient();
  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: body.displayName?.trim() || undefined,
      },
    },
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const response = NextResponse.json({
    user: data.user
      ? { id: data.user.id, email: data.user.email ?? null }
      : null,
    needsEmailConfirmation: !data.session,
  });

  if (data.session) {
    response.cookies.set("lcos-access-token", data.session.access_token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: data.session.expires_in ?? 60 * 60,
    });
    response.cookies.set("lcos-refresh-token", data.session.refresh_token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }

  return response;
}
