/**
 * Resolve acting identity from request cookies (local or Supabase session).
 * Tenant is bound from memberships — never from a client-declared grant.
 */

import type { CurrentUserContext } from "@life-community-os/auth";
import type { MembershipRole } from "@life-community-os/types";
import { resolveAuthSession } from "@/lib/auth/resolve-session";
import { resolveRequestTenantSlug } from "@/lib/tenant/resolve-request-tenant";

export type RequestActor = {
  authenticated: boolean;
  hasMembership: boolean;
  providerReference: string | null;
  personId: string | null;
  role: MembershipRole | null;
  tenantSlug: string;
  membershipId: string | null;
  permissions: readonly string[];
  tenantDenied: boolean;
  currentUser: CurrentUserContext;
};

export async function resolveRequestActor(
  request: Request,
): Promise<RequestActor> {
  const session = await resolveAuthSession(request);
  const fallbackTenant = resolveRequestTenantSlug(request);
  const currentUser = session.currentUser;

  return {
    authenticated: currentUser.authenticated,
    hasMembership: currentUser.hasMembership,
    providerReference: currentUser.userId,
    personId: currentUser.personId,
    role: currentUser.role,
    tenantSlug: currentUser.tenantId ?? fallbackTenant,
    membershipId: currentUser.membershipId,
    permissions: currentUser.permissions,
    tenantDenied: session.tenantDenied,
    currentUser,
  };
}

export function requireAdministrator(actor: RequestActor): boolean {
  return (
    actor.authenticated &&
    actor.hasMembership &&
    actor.role === "administrator"
  );
}
