import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAuthConfigured } from "@life-community-os/auth";
import {
  ensureDomainMembership,
  resolveMembershipForAuthUser,
} from "@/lib/auth/ensure-domain-membership";
import { resolveRequestTenantSlug } from "@/lib/tenant/resolve-request-tenant";

export const runtime = "nodejs";

function readCookie(request: Request, name: string): string | null {
  const cookieHeader = request.headers.get("cookie") ?? "";
  return (
    cookieHeader
      .split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${name}=`))
      ?.slice(name.length + 1) ?? null
  );
}

export async function GET(request: Request) {
  const tenantSlug = resolveRequestTenantSlug(request);

  if (!isAuthConfigured()) {
    const localId = readCookie(request, "lcos-local-identity");
    if (!localId) {
      return NextResponse.json({
        configured: false,
        authenticated: false,
        user: null,
        tenantSlug,
        role: null,
        personId: null,
        membership: null,
      });
    }
    const membership =
      (await resolveMembershipForAuthUser({
        tenantSlug,
        providerReference: decodeURIComponent(localId),
      })) ??
      (await ensureDomainMembership({
        tenantSlug,
        providerReference: decodeURIComponent(localId),
        email: null,
        displayName: null,
      }));
    return NextResponse.json({
      configured: false,
      authenticated: true,
      local: true,
      user: {
        id: decodeURIComponent(localId),
        email: null,
      },
      tenantSlug,
      role: membership.role,
      personId: membership.personId,
      membership: {
        id: membership.membershipId,
        territoryId: membership.territoryId,
        membershipType: membership.role,
        status: "active",
      },
    });
  }

  const access = readCookie(request, "lcos-access-token");
  if (!access) {
    return NextResponse.json({
      configured: true,
      authenticated: false,
      user: null,
      tenantSlug,
      role: null,
      personId: null,
      membership: null,
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
      tenantSlug,
      role: null,
      personId: null,
      membership: null,
    });
  }

  const membership = await ensureDomainMembership({
    tenantSlug,
    providerReference: data.user.id,
    email: data.user.email ?? null,
    displayName:
      (data.user.user_metadata?.display_name as string | undefined) ?? null,
  });

  return NextResponse.json({
    configured: true,
    authenticated: true,
    user: {
      id: data.user.id,
      email: data.user.email ?? null,
    },
    tenantSlug,
    role: membership.role,
    personId: membership.personId,
    membership: {
      id: membership.membershipId,
      territoryId: membership.territoryId,
      membershipType: membership.role,
      status: "active",
    },
  });
}
