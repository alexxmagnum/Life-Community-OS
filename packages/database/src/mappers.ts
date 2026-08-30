/**
 * Optional mappers between persistence rows and domain types.
 * Keep mapping explicit to preserve Domain ↔ Persistence separation.
 */

import type {
  Identity,
  Membership,
  Person,
  Tenant,
  Territory,
} from "@life-community-os/types";
import {
  isTerritoryStatus,
  slugifyTerritoryName,
} from "@life-community-os/types";

import type {
  IdentityRow,
  MembershipRow,
  PersonRow,
  TenantRow,
  TerritoryRow,
} from "./schema";

export function mapTenantRow(row: TenantRow): Tenant {
  return {
    id: row.id,
    publicSlug: row.public_slug,
    displayName: row.display_name,
    configuration: row.configuration,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapTerritoryRow(row: TerritoryRow): Territory {
  const status = isTerritoryStatus(row.status) ? row.status : "active";
  return {
    id: row.id,
    tenantId: row.tenant_id,
    name: row.name,
    slug: row.slug?.trim() || slugifyTerritoryName(row.name),
    description: row.description,
    status,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ...(row.locale ? { locale: row.locale } : {}),
    ...(row.timezone ? { timezone: row.timezone } : {}),
    ...(row.bounds ? { bounds: row.bounds } : {}),
  };
}

export function mapPersonRow(row: PersonRow): Person {
  return {
    id: row.id,
    displayName: row.display_name,
    email: row.email,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapIdentityRow(row: IdentityRow): Identity {
  return {
    id: row.id,
    providerReference: row.provider_reference,
    personId: row.person_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapMembershipRow(row: MembershipRow): Membership {
  return {
    id: row.id,
    personId: row.person_id,
    tenantId: row.tenant_id,
    territoryId: row.territory_id,
    membershipType: row.membership_type,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
