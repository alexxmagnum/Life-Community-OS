/**
 * Current Territory Context — request isolation inside a Tenant.
 *
 * Flow: Request → Session → Tenant → Active Territory → Domain Data
 * Never: Request → Tenant Pack → Territory
 */

import type { DomainId } from "../domain/ids";
import type { Territory } from "../domain/territory";
import { territoryBelongsToTenant } from "../domain/territory";

export type TerritoryContext = {
  tenantId: DomainId;
  territoryId: DomainId;
  slug: string;
  status: Territory["status"];
};

export type TerritoryContextIssueCode =
  | "missing_tenant"
  | "no_territory"
  | "unknown_territory"
  | "tenant_mismatch";

export type TerritoryContextIssue = {
  code: TerritoryContextIssueCode;
  message: string;
};

export type ResolveTerritoryContextInput = {
  tenantId: DomainId;
  /** Explicit territory from membership / query. Never a pack import. */
  requestedTerritoryId?: DomainId | null;
  territories: readonly Territory[];
};

export type TerritoryContextResult =
  | { ok: true; context: TerritoryContext }
  | { ok: false; issue: TerritoryContextIssue };

/**
 * Resolve the active Territory for a Tenant-scoped request.
 * Requested id must belong to the Tenant. Otherwise the sole/active Territory.
 */
export function resolveTerritoryContext(
  input: ResolveTerritoryContextInput,
): TerritoryContextResult {
  const tenantId = input.tenantId?.trim();
  if (!tenantId) {
    return {
      ok: false,
      issue: { code: "missing_tenant", message: "tenantId is required" },
    };
  }

  const owned = input.territories.filter((territory) =>
    territoryBelongsToTenant(territory, tenantId),
  );

  const requested = input.requestedTerritoryId?.trim();
  if (requested) {
    const match = owned.find((territory) => territory.id === requested);
    if (!match) {
      const foreign = input.territories.find(
        (territory) => territory.id === requested,
      );
      if (foreign) {
        return {
          ok: false,
          issue: {
            code: "tenant_mismatch",
            message: "Territory does not belong to the active Tenant.",
          },
        };
      }
      return {
        ok: false,
        issue: {
          code: "unknown_territory",
          message: "Requested Territory was not found.",
        },
      };
    }
    return { ok: true, context: toContext(match) };
  }

  const active = owned.filter((territory) => territory.status === "active");
  const candidate = active[0] ?? owned[0];
  if (!candidate) {
    return {
      ok: false,
      issue: {
        code: "no_territory",
        message: "Tenant has no Territory to bind.",
      },
    };
  }
  return { ok: true, context: toContext(candidate) };
}

/** Query shape APIs should accept next — tenant stays, territory is added. */
export type TerritoryScopedQuery = {
  tenantId: DomainId;
  territoryId: DomainId;
};

export function territoryScopedQuery(
  context: TerritoryContext,
): TerritoryScopedQuery {
  return { tenantId: context.tenantId, territoryId: context.territoryId };
}

function toContext(territory: Territory): TerritoryContext {
  return {
    tenantId: territory.tenantId,
    territoryId: territory.id,
    slug: territory.slug,
    status: territory.status,
  };
}
