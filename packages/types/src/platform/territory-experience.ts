/**
 * Territory Experience Layer — Active Territory as the user's living context.
 *
 * Tenant = SaaS customer. Territory = the world the person is in.
 * Never resolved from a tenant pack, Panorámica hardcode, or slug comparison.
 */

import type { CapabilityKey } from "./capabilities";
import type { DomainId } from "../domain/ids";
import type { Territory, TerritoryBounds } from "../domain/territory";
import { territoryBelongsToTenant } from "../domain/territory";

export type TerritoryExperienceContext = {
  tenantId: string;
  territoryId: string | null;
  territoryName: string | null;
  slug: string | null;
  locale: string;
  timezone: string;
  bounds?: TerritoryBounds;
  capabilities?: readonly CapabilityKey[] | readonly string[];
};

export type ActiveTerritorySource =
  | "membership"
  | "selected"
  | "default"
  | "first"
  | "none";

export type ResolveActiveTerritoryInput = {
  tenantId: DomainId;
  membershipTerritoryId?: DomainId | null;
  selectedTerritoryId?: DomainId | null;
  defaultTerritoryId?: DomainId | null;
  territories: readonly Territory[];
  capabilities?: readonly CapabilityKey[] | readonly string[];
};

export type ResolveActiveTerritoryResult =
  | {
      ok: true;
      context: TerritoryExperienceContext;
      source: ActiveTerritorySource;
    }
  | { ok: false; error: "territory_forbidden" };

export type TerritorySwitcherOption = {
  territoryId: DomainId;
  name: string;
  slug: string;
};

/**
 * Prepared contract — no UI in this phase.
 * A Tenant (SaaS client) may own many Territories.
 */
export type TerritorySwitcherContract = {
  tenantId: DomainId;
  tenantName: string;
  territories: readonly TerritorySwitcherOption[];
  activeTerritoryId: DomainId | null;
};

export type DiscoverQueryContext = {
  tenantId: string;
  territoryId: string | null;
  capabilities: readonly string[];
  locale: string;
};

export const TERRITORY_HOME_SOURCES = [
  "experience",
  "reservation",
  "community",
  "resources",
  "events",
] as const;

export type TerritoryHomeSource = (typeof TERRITORY_HOME_SOURCES)[number];

export type TerritoryHomeQuery = {
  tenantId: string;
  territoryId: string | null;
  sources: readonly TerritoryHomeSource[];
};

export type LifeMapTerritoryBinding = {
  territoryId: string | null;
  name: string | null;
  bounds?: TerritoryBounds;
  metadata: Record<string, unknown>;
};

const DEFAULT_LOCALE = "es";
const DEFAULT_TIMEZONE = "UTC";

export function emptyTerritoryExperienceContext(
  tenantId: string,
): TerritoryExperienceContext {
  return {
    tenantId: tenantId.trim(),
    territoryId: null,
    territoryName: null,
    slug: null,
    locale: DEFAULT_LOCALE,
    timezone: DEFAULT_TIMEZONE,
  };
}

function toExperienceContext(
  tenantId: string,
  territory: Territory | null,
  capabilities?: readonly CapabilityKey[] | readonly string[],
): TerritoryExperienceContext {
  if (!territory) {
    return {
      ...emptyTerritoryExperienceContext(tenantId),
      ...(capabilities ? { capabilities } : {}),
    };
  }
  return {
    tenantId,
    territoryId: territory.id,
    territoryName: territory.name,
    slug: territory.slug,
    locale: territory.locale?.trim() || DEFAULT_LOCALE,
    timezone: territory.timezone?.trim() || DEFAULT_TIMEZONE,
    ...(territory.bounds ? { bounds: territory.bounds } : {}),
    ...(capabilities ? { capabilities } : {}),
  };
}

function ownedForTenant(
  territories: readonly Territory[],
  tenantId: string,
): Territory[] {
  return territories.filter((territory) =>
    territoryBelongsToTenant(territory, tenantId),
  );
}

function findOwned(
  owned: readonly Territory[],
  id: string | null | undefined,
): Territory | undefined {
  const trimmed = id?.trim();
  if (!trimmed) return undefined;
  return owned.find((territory) => territory.id === trimmed);
}

/**
 * Resolve the Territory the person is living in.
 *
 * Eligible set = Territories owned by the Tenant (never a pack).
 * Among eligible: selected (if allowed) → membership → tenant default → first → null.
 * A foreign id is never silently swapped — it is territory_forbidden.
 */
export function resolveActiveTerritory(
  input: ResolveActiveTerritoryInput,
): ResolveActiveTerritoryResult {
  const tenantId = input.tenantId.trim();
  const owned = ownedForTenant(input.territories, tenantId);
  const capabilities = input.capabilities;

  const selected = input.selectedTerritoryId?.trim() || "";
  if (selected) {
    const match = findOwned(owned, selected);
    if (!match) {
      return { ok: false, error: "territory_forbidden" };
    }
    return {
      ok: true,
      source: "selected",
      context: toExperienceContext(tenantId, match, capabilities),
    };
  }

  const membership = findOwned(owned, input.membershipTerritoryId);
  if (membership) {
    return {
      ok: true,
      source: "membership",
      context: toExperienceContext(tenantId, membership, capabilities),
    };
  }

  const fallbackDefault = findOwned(owned, input.defaultTerritoryId);
  if (fallbackDefault) {
    return {
      ok: true,
      source: "default",
      context: toExperienceContext(tenantId, fallbackDefault, capabilities),
    };
  }

  const active = owned.filter((territory) => territory.status === "active");
  const first = active[0] ?? owned[0] ?? null;
  return {
    ok: true,
    source: first ? "first" : "none",
    context: toExperienceContext(tenantId, first, capabilities),
  };
}

export function canSwitchTerritory(input: {
  tenantId: DomainId;
  actorTenantId: DomainId;
  requestedTerritoryId: DomainId;
  territories: readonly Territory[];
}): boolean {
  if (input.tenantId.trim() !== input.actorTenantId.trim()) return false;
  const requested = input.requestedTerritoryId.trim();
  if (!requested) return false;
  return Boolean(
    findOwned(ownedForTenant(input.territories, input.tenantId), requested),
  );
}

export function createTerritorySwitcher(input: {
  tenantId: DomainId;
  tenantName: string;
  territories: readonly Territory[];
  activeTerritoryId?: DomainId | null;
}): TerritorySwitcherContract {
  const owned = ownedForTenant(input.territories, input.tenantId);
  return {
    tenantId: input.tenantId,
    tenantName: input.tenantName.trim(),
    territories: owned.map((territory) => ({
      territoryId: territory.id,
      name: territory.name,
      slug: territory.slug,
    })),
    activeTerritoryId: input.activeTerritoryId?.trim() || null,
  };
}

export function discoverQueryFromActive(
  context: TerritoryExperienceContext,
): DiscoverQueryContext {
  return {
    tenantId: context.tenantId,
    territoryId: context.territoryId,
    capabilities: (context.capabilities ?? []).map(String),
    locale: context.locale,
  };
}

export function territoryHomeQuery(
  context: TerritoryExperienceContext,
): TerritoryHomeQuery {
  return {
    tenantId: context.tenantId,
    territoryId: context.territoryId,
    sources: TERRITORY_HOME_SOURCES,
  };
}

export function lifeMapBindingFromActive(
  context: TerritoryExperienceContext,
): LifeMapTerritoryBinding {
  return {
    territoryId: context.territoryId,
    name: context.territoryName,
    ...(context.bounds ? { bounds: context.bounds } : {}),
    metadata: {
      slug: context.slug,
      locale: context.locale,
      timezone: context.timezone,
    },
  };
}
