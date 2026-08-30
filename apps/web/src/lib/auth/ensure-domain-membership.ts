/**
 * Ensure Person + Identity + Membership for an Auth user in the active tenant.
 * Postgres is SoT when configured. File store is a development fixture only.
 */

import {
  coerceMembershipRole,
  type MembershipRole,
} from "@life-community-os/types";
import {
  isDatabaseConfigured,
  isFilePersistenceAllowed,
  PersistenceUnavailableError,
} from "@/lib/data/data-plane";
import { createServiceDatabaseClientSafe } from "@/lib/data/database-access";
import {
  resolveTenantPublicId,
  tenantSlugToTerritoryUuid,
  tenantSlugToUuid,
  tenantUuidToSlug,
} from "@/lib/tenant/ids";
import {
  findIdentityByProvider,
  findMembershipForPerson,
  listFileMembershipDirectory,
  listMembershipsForProvider,
  updateFileMembershipRole,
  updateFileMembershipStatus,
  upsertFileMembership,
  type StoredMembership,
} from "./membership-store";

export type DomainMembershipResult = {
  personId: string;
  membershipId: string;
  territoryId: string;
  role: MembershipRole;
  source: "supabase" | "file";
  tenantSlug?: string;
  displayName?: string | null;
  email?: string | null;
};

function territoryForTenant(tenantSlug: string): string {
  const slug = resolveTenantPublicId(tenantSlug);
  const territory = tenantSlugToTerritoryUuid(slug);
  if (!territory) {
    throw new Error(`unknown_tenant_territory:${slug}`);
  }
  return territory;
}

type IdentityMembershipRpcRow = {
  person_id: string;
  membership_id: string;
  tenant_id: string;
  tenant_slug: string;
  territory_id: string;
  role: string;
  display_name: string | null;
  email: string | null;
};

async function listSupabaseMemberships(
  providerReference: string,
): Promise<DomainMembershipResult[] | null> {
  const client = await createServiceDatabaseClientSafe();
  if (!client) return null;
  try {
    const { data, error } = await client.rpc(
      "app_resolve_identity_memberships",
      { p_provider_reference: providerReference },
    );
    if (!error && Array.isArray(data)) {
      return (data as IdentityMembershipRpcRow[]).map((row) => ({
        personId: row.person_id,
        membershipId: row.membership_id,
        territoryId: row.territory_id,
        role: coerceMembershipRole(row.role),
        source: "supabase" as const,
        tenantSlug:
          row.tenant_slug ||
          tenantUuidToSlug(row.tenant_id) ||
          undefined,
        displayName: row.display_name,
        email: row.email,
      }));
    }

    const { data: identity, error: identityError } = await client
      .from("identities")
      .select("person_id")
      .eq("provider_reference", providerReference)
      .maybeSingle();
    if (identityError || !identity?.person_id) {
      if (identityError) {
        console.warn("[membership] identity lookup failed", identityError.message);
      }
      return [];
    }

    const { data: memberships, error: memError } = await client
      .from("memberships")
      .select("id, person_id, tenant_id, territory_id, membership_type, status")
      .eq("person_id", identity.person_id)
      .eq("status", "active");
    if (memError) {
      console.warn("[membership] list failed", memError.message);
      return null;
    }

    const personId = identity.person_id as string;
    const { data: person } = await client
      .from("persons")
      .select("display_name, email")
      .eq("id", personId)
      .maybeSingle();

    return (memberships ?? []).map((row) => {
      const tenantId = (row as { tenant_id?: string }).tenant_id;
      return {
        personId,
        membershipId: row.id as string,
        territoryId: row.territory_id as string,
        role: coerceMembershipRole(row.membership_type as string),
        source: "supabase" as const,
        tenantSlug: tenantId ? tenantUuidToSlug(tenantId) ?? undefined : undefined,
        displayName: (person as { display_name?: string | null } | null)
          ?.display_name,
        email: (person as { email?: string | null } | null)?.email,
      };
    });
  } catch (err) {
    console.warn("[membership] supabase list failed", err);
    return null;
  }
}

async function ensureSupabaseMembership(input: {
  tenantSlug: string;
  providerReference: string;
  email: string | null;
  displayName: string | null;
  role?: MembershipRole;
}): Promise<DomainMembershipResult | null> {
  const client = await createServiceDatabaseClientSafe();
  if (!client) return null;
  const tenantUuid = tenantSlugToUuid(input.tenantSlug);
  if (!tenantUuid) return null;
  const territoryId = territoryForTenant(input.tenantSlug);

  try {
    const { data: existingIdentity } = await client
      .from("identities")
      .select("id, person_id, provider_reference")
      .eq("provider_reference", input.providerReference)
      .maybeSingle();

    let personId = existingIdentity?.person_id as string | undefined;

    if (!personId) {
      const { data: person, error: personError } = await client
        .from("persons")
        .insert({
          display_name: input.displayName,
          email: input.email,
          status: "active",
        } as never)
        .select("id")
        .single();
      if (personError || !person) {
        console.warn("[membership] person insert failed", personError?.message);
        return null;
      }
      personId = (person as { id: string }).id;

      const { error: identityError } = await client.from("identities").insert({
        provider_reference: input.providerReference,
        person_id: personId,
      } as never);
      if (identityError) {
        console.warn(
          "[membership] identity insert failed",
          identityError.message,
        );
        return null;
      }
    }

    const { data: existingMembership } = await client
      .from("memberships")
      .select("id, membership_type, status, territory_id, tenant_id")
      .eq("person_id", personId)
      .eq("tenant_id", tenantUuid)
      .maybeSingle();

    if (!existingMembership) {
      const { count: activeCount } = await client
        .from("memberships")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantUuid)
        .eq("status", "active");
      const role =
        !activeCount || activeCount === 0
          ? "administrator"
          : coerceMembershipRole(input.role);
      const { data: membership, error: memError } = await client
        .from("memberships")
        .insert({
          person_id: personId,
          territory_id: territoryId,
          tenant_id: tenantUuid,
          membership_type: role,
          status: "active",
        } as never)
        .select("id, membership_type")
        .single();
      if (memError || !membership) {
        console.warn("[membership] membership insert failed", memError?.message);
        return null;
      }
      return {
        personId,
        membershipId: (membership as { id: string }).id,
        territoryId,
        role: coerceMembershipRole(
          (membership as { membership_type: string }).membership_type,
        ),
        source: "supabase",
        tenantSlug: input.tenantSlug,
        displayName: input.displayName,
        email: input.email,
      };
    }

    return {
      personId,
      membershipId: (existingMembership as { id: string }).id,
      territoryId: (existingMembership as { territory_id: string }).territory_id,
      role: coerceMembershipRole(
        (existingMembership as { membership_type: string }).membership_type,
      ),
      source: "supabase",
      tenantSlug: input.tenantSlug,
      displayName: input.displayName,
      email: input.email,
    };
  } catch (err) {
    console.warn("[membership] supabase ensure failed", err);
    return null;
  }
}

export async function ensureDomainMembership(input: {
  tenantSlug: string;
  providerReference: string;
  email?: string | null;
  displayName?: string | null;
  role?: MembershipRole;
}): Promise<DomainMembershipResult> {
  const tenantSlug = resolveTenantPublicId(input.tenantSlug);
  const fromDb = await ensureSupabaseMembership({
    tenantSlug,
    providerReference: input.providerReference,
    email: input.email ?? null,
    displayName: input.displayName ?? null,
    role: input.role,
  });

  if (fromDb) {
    return fromDb;
  }

  if (!isFilePersistenceAllowed()) {
    throw new PersistenceUnavailableError(
      "Membership write requires Postgres",
    );
  }

  const file = await upsertFileMembership({
    tenantSlug,
    territoryId: territoryForTenant(tenantSlug),
    providerReference: input.providerReference,
    email: input.email ?? null,
    displayName: input.displayName ?? null,
    role: input.role,
  });

  return {
    personId: file.identity.personId,
    membershipId: file.membership.id,
    territoryId: file.membership.territoryId,
    role: file.membership.role,
    source: "file",
    tenantSlug,
    displayName: file.identity.displayName,
    email: file.identity.email,
  };
}

export async function listMembershipsForAuthUser(input: {
  providerReference: string;
}): Promise<DomainMembershipResult[]> {
  if (isDatabaseConfigured()) {
    const fromDb = await listSupabaseMemberships(input.providerReference);
    if (fromDb) return fromDb;
    if (!isFilePersistenceAllowed()) return [];
  }

  if (!isFilePersistenceAllowed()) return [];

  const rows = await listMembershipsForProvider(input.providerReference);
  return rows.map(({ membership, identity }) => ({
    personId: membership.personId,
    membershipId: membership.id,
    territoryId: membership.territoryId,
    role: membership.role,
    source: "file" as const,
    tenantSlug: membership.tenantSlug,
    displayName: identity.displayName,
    email: identity.email,
  }));
}

export async function resolveMembershipForAuthUser(input: {
  tenantSlug: string;
  providerReference: string;
}): Promise<DomainMembershipResult | null> {
  const tenantSlug = resolveTenantPublicId(input.tenantSlug);
  const all = await listMembershipsForAuthUser({
    providerReference: input.providerReference,
  });
  return all.find((row) => row.tenantSlug === tenantSlug) ?? null;
}

export async function listMembershipDirectory(
  tenantSlug: string,
  options?: { includeInactive?: boolean },
): Promise<
  Array<{
    membership: StoredMembership;
    identity: {
      email: string | null;
      displayName: string | null;
    } | null;
  }>
> {
  const slug = resolveTenantPublicId(tenantSlug);
  const tenantUuid = tenantSlugToUuid(slug);
  if (isDatabaseConfigured() && tenantUuid) {
    const client = await createServiceDatabaseClientSafe();
    if (client) {
      const { data, error } = await client
        .from("memberships")
        .select("id, person_id, territory_id, membership_type, status, created_at, updated_at")
        .eq("tenant_id", tenantUuid);
      if (!error && data) {
        const rows = options?.includeInactive
          ? data
          : data.filter((row) => row.status === "active");
        const personIds = [
          ...new Set(rows.map((row) => row.person_id as string)),
        ];
        const { data: persons } = personIds.length
          ? await client
              .from("persons")
              .select("id, display_name, email")
              .in("id", personIds)
          : { data: [] as Array<{ id: string; display_name: string | null; email: string | null }> };
        const byPerson = new Map(
          (persons ?? []).map((p) => [
            p.id as string,
            p as { id: string; display_name: string | null; email: string | null },
          ]),
        );
        return rows
          .map((row) => {
            const person = byPerson.get(row.person_id as string);
            const membership: StoredMembership = {
              id: row.id as string,
              personId: row.person_id as string,
              tenantSlug: slug,
              territoryId: row.territory_id as string,
              role: coerceMembershipRole(row.membership_type as string),
              status: (row.status as StoredMembership["status"]) ?? "active",
              createdAt: row.created_at as string,
              updatedAt: row.updated_at as string,
            };
            return {
              membership,
              identity: person
                ? {
                    email: person.email,
                    displayName: person.display_name,
                  }
                : null,
            };
          })
          .sort((a, b) =>
            (a.identity?.displayName ?? a.identity?.email ?? a.membership.personId).localeCompare(
              b.identity?.displayName ??
                b.identity?.email ??
                b.membership.personId,
            ),
          );
      }
    }
    if (!isFilePersistenceAllowed()) return [];
  }
  return listFileMembershipDirectory(slug, options?.includeInactive === true);
}

export async function updateMembershipRole(input: {
  tenantSlug: string;
  personId: string;
  role: MembershipRole;
}): Promise<StoredMembership | null> {
  const slug = resolveTenantPublicId(input.tenantSlug);
  const tenantUuid = tenantSlugToUuid(slug);
  const role = coerceMembershipRole(input.role);
  if (isDatabaseConfigured() && tenantUuid) {
    const client = await createServiceDatabaseClientSafe();
    if (client) {
      const { data, error } = await client
        .from("memberships")
        .update({
          membership_type: role,
          updated_at: new Date().toISOString(),
        } as never)
        .eq("tenant_id", tenantUuid)
        .eq("person_id", input.personId)
        .eq("status", "active")
        .select("id, person_id, territory_id, membership_type, status, created_at, updated_at")
        .maybeSingle();
      if (!error && data) {
        return {
          id: data.id as string,
          personId: data.person_id as string,
          tenantSlug: slug,
          territoryId: data.territory_id as string,
          role: coerceMembershipRole(data.membership_type as string),
          status: (data.status as StoredMembership["status"]) ?? "active",
          createdAt: data.created_at as string,
          updatedAt: data.updated_at as string,
        };
      }
      if (error) {
        console.warn("[membership] role update failed", error.message);
      }
      if (!isFilePersistenceAllowed()) return null;
    }
  }
  if (!isFilePersistenceAllowed()) return null;
  return updateFileMembershipRole({
    tenantSlug: slug,
    personId: input.personId,
    role,
  });
}

export async function updateMembershipStatus(input: {
  tenantSlug: string;
  personId: string;
  status: StoredMembership["status"];
}): Promise<StoredMembership | null> {
  const slug = resolveTenantPublicId(input.tenantSlug);
  const tenantUuid = tenantSlugToUuid(slug);
  if (isDatabaseConfigured() && tenantUuid) {
    const client = await createServiceDatabaseClientSafe();
    if (client) {
      const { data, error } = await client
        .from("memberships")
        .update({
          status: input.status,
          updated_at: new Date().toISOString(),
        } as never)
        .eq("tenant_id", tenantUuid)
        .eq("person_id", input.personId)
        .select("id, person_id, territory_id, membership_type, status, created_at, updated_at")
        .maybeSingle();
      if (!error && data) {
        return {
          id: data.id as string,
          personId: data.person_id as string,
          tenantSlug: slug,
          territoryId: data.territory_id as string,
          role: coerceMembershipRole(data.membership_type as string),
          status: (data.status as StoredMembership["status"]) ?? "inactive",
          createdAt: data.created_at as string,
          updatedAt: data.updated_at as string,
        };
      }
      if (!isFilePersistenceAllowed()) return null;
    }
  }
  if (!isFilePersistenceAllowed()) return null;
  return updateFileMembershipStatus({
    tenantSlug: slug,
    personId: input.personId,
    status: input.status,
  });
}

export { findIdentityByProvider, findMembershipForPerson };
export type { StoredMembership };
