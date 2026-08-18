/**
 * Resolve acting identity from request cookies (local or Supabase session).
 */

import { createClient } from "@supabase/supabase-js";
import { isAuthConfigured } from "@life-community-os/auth";
import {
  coerceMembershipRole,
  type MembershipRole,
} from "@life-community-os/types";
import { resolveMembershipForAuthUser } from "@/lib/auth/ensure-domain-membership";
import { resolveRequestTenantSlug } from "@/lib/tenant/resolve-request-tenant";

export type RequestActor = {
  authenticated: boolean;
  providerReference: string | null;
  personId: string | null;
  role: MembershipRole | null;
  tenantSlug: string;
};

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

export async function resolveRequestActor(
  request: Request,
): Promise<RequestActor> {
  const tenantSlug = resolveRequestTenantSlug(request);

  if (!isAuthConfigured()) {
    const localId = readCookie(request, "lcos-local-identity");
    if (!localId) {
      return {
        authenticated: false,
        providerReference: null,
        personId: null,
        role: null,
        tenantSlug,
      };
    }
    const providerReference = decodeURIComponent(localId);
    const membership = await resolveMembershipForAuthUser({
      tenantSlug,
      providerReference,
    });
    return {
      authenticated: Boolean(membership),
      providerReference,
      personId: membership?.personId ?? null,
      role: membership ? coerceMembershipRole(membership.role) : null,
      tenantSlug,
    };
  }

  const access = readCookie(request, "lcos-access-token");
  if (!access) {
    return {
      authenticated: false,
      providerReference: null,
      personId: null,
      role: null,
      tenantSlug,
    };
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
    return {
      authenticated: false,
      providerReference: null,
      personId: null,
      role: null,
      tenantSlug,
    };
  }

  const membership = await resolveMembershipForAuthUser({
    tenantSlug,
    providerReference: data.user.id,
  });

  return {
    authenticated: true,
    providerReference: data.user.id,
    personId: membership?.personId ?? null,
    role: membership ? coerceMembershipRole(membership.role) : null,
    tenantSlug,
  };
}

export function requireAdministrator(actor: RequestActor): boolean {
  return actor.authenticated && actor.role === "administrator";
}
