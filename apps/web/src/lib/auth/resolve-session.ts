/**
 * Resolve CurrentUserContext from request cookies.
 * Never auto-creates membership. Never trusts client-declared roles.
 */

import { createClient } from "@supabase/supabase-js";
import {
  authenticatedWithoutMembership,
  bindActiveTenant,
  currentUserFromMembership,
  EMPTY_CURRENT_USER,
  isAuthConfigured,
  membershipSummary,
  type CurrentUserContext,
  type MembershipSummary,
} from "@life-community-os/auth";
import {
  listMembershipsForAuthUser,
  type DomainMembershipResult,
} from "@/lib/auth/ensure-domain-membership";
import { permissionsForRole } from "@/lib/auth/permissions";
import { AUTH_COOKIE, readCookie } from "@/lib/auth/session-cookies";
import { resolveRequestTenantSlug } from "@/lib/tenant/resolve-request-tenant";

export type ResolvedAuthSession = {
  currentUser: CurrentUserContext;
  memberships: MembershipSummary[];
  requestedTenantId: string;
  tenantDenied: boolean;
  configured: boolean;
  local: boolean;
};

function toSummaries(
  rows: DomainMembershipResult[],
): MembershipSummary[] {
  return rows
    .filter((row) => row.tenantSlug)
    .map((row) =>
      membershipSummary({
        tenantId: row.tenantSlug!,
        membershipId: row.membershipId,
        personId: row.personId,
        role: row.role,
        status: row.status,
        territoryId: row.territoryId,
      }),
    );
}

function bindUser(input: {
  userId: string;
  email: string | null;
  displayName: string | null;
  requestedTenantId: string;
  memberships: MembershipSummary[];
}): Pick<
  ResolvedAuthSession,
  "currentUser" | "tenantDenied"
> {
  const bind = bindActiveTenant({
    requestedTenantId: input.requestedTenantId,
    memberships: input.memberships,
  });

  if (bind.status === "no_membership") {
    return {
      tenantDenied: false,
      currentUser: authenticatedWithoutMembership({
        user: { userId: input.userId, email: input.email },
        displayName: input.displayName,
      }),
    };
  }

  if (bind.status === "tenant_forbidden") {
    const fallback = bindActiveTenant({
      requestedTenantId: null,
      memberships: input.memberships,
    });
    if (fallback.status !== "bound") {
      return {
        tenantDenied: true,
        currentUser: authenticatedWithoutMembership({
          user: { userId: input.userId, email: input.email },
          displayName: input.displayName,
        }),
      };
    }
    return {
      tenantDenied: true,
      currentUser: currentUserFromMembership({
        user: { userId: input.userId, email: input.email },
        person: {
          personId: fallback.membership.personId,
          displayName: input.displayName,
        },
        membership: fallback.membership,
        permissions: permissionsForRole(
          fallback.membership.role,
          fallback.membership.tenantId,
        ),
      }),
    };
  }

  return {
    tenantDenied: false,
    currentUser: currentUserFromMembership({
      user: { userId: input.userId, email: input.email },
      person: {
        personId: bind.membership.personId,
        displayName: input.displayName,
      },
      membership: bind.membership,
      permissions: permissionsForRole(
        bind.membership.role,
        bind.membership.tenantId,
      ),
    }),
  };
}

async function resolveLocalSession(
  request: Request,
  requestedTenantId: string,
): Promise<ResolvedAuthSession> {
  const localId = readCookie(request, AUTH_COOKIE.localIdentity);
  if (!localId) {
    return {
      currentUser: EMPTY_CURRENT_USER,
      memberships: [],
      requestedTenantId,
      tenantDenied: false,
      configured: false,
      local: true,
    };
  }

  const providerReference = decodeURIComponent(localId);
  const rows = await listMembershipsForAuthUser({ providerReference });
  const memberships = toSummaries(rows);
  const identityEmail =
    rows[0]?.email ??
    (providerReference.startsWith("local:")
      ? providerReference.split(":").slice(2).join(":") || null
      : null);
  const bound = bindUser({
    userId: providerReference,
    email: identityEmail,
    displayName: rows[0]?.displayName ?? null,
    requestedTenantId,
    memberships,
  });

  return {
    ...bound,
    memberships,
    requestedTenantId,
    configured: false,
    local: true,
  };
}

async function resolveSupabaseSession(
  request: Request,
  requestedTenantId: string,
): Promise<ResolvedAuthSession> {
  const access = readCookie(request, AUTH_COOKIE.access);
  if (!access) {
    return {
      currentUser: EMPTY_CURRENT_USER,
      memberships: [],
      requestedTenantId,
      tenantDenied: false,
      configured: true,
      local: false,
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
      currentUser: EMPTY_CURRENT_USER,
      memberships: [],
      requestedTenantId,
      tenantDenied: false,
      configured: true,
      local: false,
    };
  }

  const rows = await listMembershipsForAuthUser({
    providerReference: data.user.id,
  });
  const memberships = toSummaries(rows);
  const displayName =
    (data.user.user_metadata?.display_name as string | undefined) ??
    data.user.email ??
    null;
  const bound = bindUser({
    userId: data.user.id,
    email: data.user.email ?? null,
    displayName,
    requestedTenantId,
    memberships,
  });

  return {
    ...bound,
    memberships,
    requestedTenantId,
    configured: true,
    local: false,
  };
}

export async function resolveAuthSession(
  request: Request,
): Promise<ResolvedAuthSession> {
  const requestedTenantId = resolveRequestTenantSlug(request);
  if (!isAuthConfigured()) {
    return resolveLocalSession(request, requestedTenantId);
  }
  return resolveSupabaseSession(request, requestedTenantId);
}

export function sessionPayload(session: ResolvedAuthSession) {
  const { currentUser } = session;
  return {
    configured: session.configured,
    authenticated: currentUser.authenticated,
    local: session.local,
    user: currentUser.userId
      ? { id: currentUser.userId, email: currentUser.email }
      : null,
    userId: currentUser.userId,
    personId: currentUser.personId,
    tenantId: currentUser.tenantId,
    tenantSlug: currentUser.tenantId ?? session.requestedTenantId,
    territoryId: currentUser.territoryId,
    membershipId: currentUser.membershipId,
    role: currentUser.role,
    permissions: currentUser.permissions,
    displayName: currentUser.displayName,
    hasMembership: currentUser.hasMembership,
    memberships: session.memberships.map((m) => ({
      tenantId: m.tenantId,
      membershipId: m.membershipId,
      role: m.role,
      territoryId: m.territoryId ?? null,
    })),
    tenantDenied: session.tenantDenied,
    membership: currentUser.hasMembership || currentUser.membershipStatus
      ? {
          id: currentUser.membershipId,
          tenantId: currentUser.tenantId,
          territoryId: currentUser.territoryId,
          membershipType: currentUser.role,
          status: currentUser.membershipStatus ?? "active",
        }
      : null,
    membershipStatus: currentUser.membershipStatus,
  };
}
