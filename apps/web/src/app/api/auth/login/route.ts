import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAuthConfigured } from "@life-community-os/auth";
import { listMembershipsForAuthUser } from "@/lib/auth/ensure-domain-membership";
import { bindActiveTenant, membershipSummary } from "@life-community-os/auth";
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

  let body: { email?: string; password?: string };
  try {
    body = (await request.json()) as { email?: string; password?: string };
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
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });
  if (error || !data.session) {
    return NextResponse.json(
      { error: error?.message ?? "sign_in_failed" },
      { status: 401 },
    );
  }

  const requestedTenantId = resolveRequestTenantSlug(request);
  const rows = await listMembershipsForAuthUser({
    providerReference: data.user.id,
  });
  const memberships = rows
    .filter((row) => row.tenantSlug)
    .map((row) =>
      membershipSummary({
        tenantId: row.tenantSlug!,
        membershipId: row.membershipId,
        personId: row.personId,
        role: row.role,
      }),
    );
  const bind = bindActiveTenant({
    requestedTenantId,
    memberships,
  });

  const boundTenant =
    bind.status === "bound"
      ? bind.membership.tenantId
      : bind.status === "tenant_forbidden"
        ? memberships[0]?.tenantId ?? requestedTenantId
        : requestedTenantId;
  const membership = bind.status === "bound" ? bind.membership : null;

  const response = NextResponse.json({
    user: {
      id: data.user.id,
      email: data.user.email ?? null,
    },
    personId: membership?.personId ?? null,
    role: membership?.role ?? null,
    membershipId: membership?.membershipId ?? null,
    tenantSlug: boundTenant,
    hasMembership: Boolean(membership),
    tenantDenied: bind.status === "tenant_forbidden",
  });
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
  setAuthCookie(response, AUTH_COOKIE.tenant, boundTenant, 60 * 60 * 24 * 30, false);
  return response;
}
