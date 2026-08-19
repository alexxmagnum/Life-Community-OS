import { NextResponse } from "next/server";
import { isAuthConfigured } from "@life-community-os/auth";
import { ensureDomainMembership } from "@/lib/auth/ensure-domain-membership";
import { AUTH_COOKIE, setAuthCookie } from "@/lib/auth/session-cookies";
import { resolveRequestTenantSlug } from "@/lib/tenant/resolve-request-tenant";

export const runtime = "nodejs";

/**
 * Local membership join when Supabase Auth is not configured.
 * Role is never taken from the client.
 */
export async function POST(request: Request) {
  if (isAuthConfigured()) {
    return NextResponse.json(
      {
        error: "use_supabase_auth",
        message: "Supabase Auth is configured — use /api/auth/register",
      },
      { status: 400 },
    );
  }

  let body: {
    email?: string;
    displayName?: string;
  };
  try {
    body = (await request.json()) as {
      email?: string;
      displayName?: string;
    };
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }

  const tenantSlug = resolveRequestTenantSlug(request);
  const providerReference = `local:${tenantSlug}:${email}`;
  const membership = await ensureDomainMembership({
    tenantSlug,
    providerReference,
    email,
    displayName: body.displayName?.trim() || email.split("@")[0] || null,
  });

  const response = NextResponse.json({
    authenticated: true,
    local: true,
    user: { id: providerReference, email },
    tenantSlug,
    personId: membership.personId,
    role: membership.role,
    membershipId: membership.membershipId,
    hasMembership: true,
  });
  setAuthCookie(
    response,
    AUTH_COOKIE.localIdentity,
    encodeURIComponent(providerReference),
    60 * 60 * 24 * 30,
  );
  setAuthCookie(response, AUTH_COOKIE.tenant, tenantSlug, 60 * 60 * 24 * 30, false);
  return response;
}
