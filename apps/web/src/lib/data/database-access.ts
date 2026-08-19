/**
 * Choose a database client for domain data.
 *
 * JWT user client → RLS applies (auth.uid() membership).
 * Service role → bootstrap / anonymous public reads only; caller MUST filter tenant_id.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { isDatabaseConfigured } from "@/lib/data/data-plane";
import { createUserDatabaseClient } from "@/lib/tenant/rls-bound-client";
import { AUTH_COOKIE, readCookie } from "@/lib/auth/session-cookies";

export type DomainClientScope = {
  accessToken?: string | null;
  personId?: string | null;
  tenantSlug: string;
};

export function accessTokenFromRequest(request: Request): string | null {
  return readCookie(request, AUTH_COOKIE.access);
}

export function persistenceScopeFromRequest(
  request: Request,
  personId?: string | null,
): { accessToken: string | null; personId: string | null } {
  return {
    accessToken: accessTokenFromRequest(request),
    personId: personId ?? null,
  };
}

export async function createDomainDatabaseClient(
  scope?: Pick<DomainClientScope, "accessToken">,
): Promise<SupabaseClient | null> {
  if (!isDatabaseConfigured()) return null;
  const token = scope?.accessToken?.trim();
  if (token) {
    const user = createUserDatabaseClient({ accessToken: token });
    if (user) return user;
  }
  try {
    const { createServiceDatabaseClient } = await import(
      "@life-community-os/database"
    );
    return createServiceDatabaseClient();
  } catch {
    return null;
  }
}

export async function createServiceDatabaseClientSafe(): Promise<SupabaseClient | null> {
  if (!isDatabaseConfigured()) return null;
  try {
    const { createServiceDatabaseClient } = await import(
      "@life-community-os/database"
    );
    return createServiceDatabaseClient();
  } catch {
    return null;
  }
}
