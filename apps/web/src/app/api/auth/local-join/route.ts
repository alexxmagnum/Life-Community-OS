import { NextResponse } from "next/server";
import { isAuthConfigured } from "@life-community-os/auth";
import { coerceMembershipRole } from "@life-community-os/types";
import { ensureDomainMembership } from "@/lib/auth/ensure-domain-membership";
import { resolveRequestTenantSlug } from "@/lib/tenant/resolve-request-tenant";

export const runtime = "nodejs";

/**
 * Local membership join when Supabase Auth is not configured.
 * Creates Person+Identity+Membership in the durable file store.
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
    role?: string;
  };
  try {
    body = (await request.json()) as {
      email?: string;
      displayName?: string;
      role?: string;
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
    role: coerceMembershipRole(body.role),
  });

  const response = NextResponse.json({
    authenticated: true,
    local: true,
    user: { id: providerReference, email },
    tenantSlug,
    personId: membership.personId,
    role: membership.role,
    membershipId: membership.membershipId,
  });
  response.cookies.set(
    "lcos-local-identity",
    encodeURIComponent(providerReference),
    {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    },
  );
  response.cookies.set("lcos-tenant-slug", tenantSlug, {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
