/**
 * Ensure Person + Identity + Membership for an Auth user in the active tenant.
 * Prefer Supabase when service role is available; always mirror to file store.
 */

import {
  coerceMembershipRole,
  type MembershipRole,
} from "@life-community-os/types";
import {
  LIFE_PANORAMICA_TERRITORY_UUID,
  LIFE_VALLEY_TERRITORY_UUID,
  resolveTenantPublicId,
  tenantSlugToUuid,
} from "@/lib/tenant/ids";
import {
  findIdentityByProvider,
  findMembershipForPerson,
  upsertFileMembership,
  type StoredMembership,
} from "./membership-store";

export type DomainMembershipResult = {
  personId: string;
  membershipId: string;
  territoryId: string;
  role: MembershipRole;
  source: "supabase" | "file";
};

function territoryForTenant(tenantSlug: string): string {
  const slug = resolveTenantPublicId(tenantSlug);
  if (slug === "life-valley") return LIFE_VALLEY_TERRITORY_UUID;
  return LIFE_PANORAMICA_TERRITORY_UUID;
}

function hasServiceEnv(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim(),
  );
}

async function ensureSupabaseMembership(input: {
  tenantSlug: string;
  providerReference: string;
  email: string | null;
  displayName: string | null;
  role?: MembershipRole;
}): Promise<DomainMembershipResult | null> {
  if (!hasServiceEnv()) return null;
  const tenantUuid = tenantSlugToUuid(input.tenantSlug);
  if (!tenantUuid) return null;
  const territoryId = territoryForTenant(input.tenantSlug);

  try {
    const { createServiceDatabaseClient } = await import(
      "@life-community-os/database"
    );
    const client = createServiceDatabaseClient();

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
      .select("id, membership_type, status, territory_id")
      .eq("person_id", personId)
      .eq("territory_id", territoryId)
      .maybeSingle();

    if (!existingMembership) {
      const { count: activeCount } = await client
        .from("memberships")
        .select("id", { count: "exact", head: true })
        .eq("territory_id", territoryId)
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
      };
    }

    return {
      personId,
      membershipId: (existingMembership as { id: string }).id,
      territoryId,
      role: coerceMembershipRole(
        (existingMembership as { membership_type: string }).membership_type,
      ),
      source: "supabase",
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

  const file = await upsertFileMembership({
    tenantSlug,
    territoryId: territoryForTenant(tenantSlug),
    providerReference: input.providerReference,
    email: input.email ?? null,
    displayName: input.displayName ?? null,
    // Prefer DB role when present; otherwise let file store auto-promote
    // first membership when the tenant directory is empty.
    role: fromDb?.role ?? input.role,
  });

  if (fromDb) {
    return fromDb;
  }

  return {
    personId: file.identity.personId,
    membershipId: file.membership.id,
    territoryId: file.membership.territoryId,
    role: file.membership.role,
    source: "file",
  };
}

export async function resolveMembershipForAuthUser(input: {
  tenantSlug: string;
  providerReference: string;
}): Promise<DomainMembershipResult | null> {
  const tenantSlug = resolveTenantPublicId(input.tenantSlug);
  const identity = await findIdentityByProvider(
    tenantSlug,
    input.providerReference,
  );
  if (!identity) return null;
  const membership = await findMembershipForPerson(
    tenantSlug,
    identity.personId,
  );
  if (!membership) return null;
  return {
    personId: identity.personId,
    membershipId: membership.id,
    territoryId: membership.territoryId,
    role: membership.role,
    source: "file",
  };
}

export type { StoredMembership };
