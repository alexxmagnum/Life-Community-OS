import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAuthConfigured } from "@life-community-os/auth";
import { ensureDomainMembership } from "@/lib/auth/ensure-domain-membership";
import { AUTH_COOKIE, setAuthCookie } from "@/lib/auth/session-cookies";
import { resolveRequestTenantSlug } from "@/lib/tenant/resolve-request-tenant";

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

  const tenantSlug = resolveRequestTenantSlug(request);
  let membershipPayload: {
    personId: string;
    role: string;
    membershipId: string;
    hasMembership: boolean;
  } | null = null;

  if (data.user) {
    const membership = await ensureDomainMembership({
      tenantSlug,
      providerReference: data.user.id,
      email: data.user.email ?? email,
      displayName: body.displayName?.trim() || null,
    });
    membershipPayload = {
      personId: membership.personId,
      role: membership.role,
      membershipId: membership.membershipId,
      hasMembership: true,
    };
  }

  const response = NextResponse.json({
    user: data.user
      ? { id: data.user.id, email: data.user.email ?? null }
      : null,
    needsEmailConfirmation: !data.session,
    ...membershipPayload,
    tenantSlug,
  });

  if (data.session) {
    setAuthCookie(
      response,
      AUTH_COOKIE.access,
      data.session.access_token,
      data.session.expires_in ?? 60 * 60,
    );
    setAuthCookie(
      response,
      AUTH_COOKIE.refresh,
      data.session.refresh_token,
      60 * 60 * 24 * 30,
    );
  }
  setAuthCookie(response, AUTH_COOKIE.tenant, tenantSlug, 60 * 60 * 24 * 30, false);

  return response;
}
