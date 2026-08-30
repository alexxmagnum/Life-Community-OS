/**
 * Bind Active Territory for a Tenant-scoped request.
 *
 * Flow: Request → Session → Tenant → Active Territory → Domain Data
 * Never: Request → Tenant Pack → Territory
 *
 * Existing clients that omit territoryId keep tenant-only lists.
 * When a Territory is present (membership, query, or 1:1 default), APIs
 * filter stamped domain rows with recordMatchesTerritoryScope.
 */

import { NextResponse } from "next/server";
import {
  recordMatchesTerritoryScope,
  type ActiveTerritoryContext,
  type TerritoryScopedQuery,
} from "@life-community-os/types";
import {
  listTerritoryUuidsForTenant,
  tenantSlugToTerritoryUuid,
} from "./ids";

export type { ActiveTerritoryContext, TerritoryScopedQuery };

export function asTerritoryUuid(value?: string | null): string | null {
  if (!value?.trim()) return null;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  )
    ? value
    : null;
}

export function defaultTerritoryIdForTenant(tenantId: string): string | null {
  return tenantSlugToTerritoryUuid(tenantId);
}

export function resolveStampTerritoryId(input: {
  tenantId: string;
  explicit?: string | null;
  inherited?: string | null;
}): string | undefined {
  const explicit = input.explicit?.trim();
  if (explicit) return explicit;
  const inherited = input.inherited?.trim();
  if (inherited) return inherited;
  return tenantSlugToTerritoryUuid(input.tenantId) ?? undefined;
}

export function resolveActiveTerritoryContext(input: {
  tenantId: string;
  actorTerritoryId?: string | null;
  queryTerritoryId?: string | null;
  selectedTerritoryId?: string | null;
}):
  | { context: ActiveTerritoryContext }
  | { error: NextResponse } {
  const allowed = listTerritoryUuidsForTenant(input.tenantId);
  const requested =
    input.queryTerritoryId?.trim() ||
    input.selectedTerritoryId?.trim() ||
    null;

  if (requested) {
    if (allowed.length > 0 && !allowed.includes(requested)) {
      return {
        error: NextResponse.json(
          { error: "territory_forbidden" },
          { status: 403 },
        ),
      };
    }
    if (
      allowed.length === 0 &&
      requested !== tenantSlugToTerritoryUuid(input.tenantId)
    ) {
      return {
        error: NextResponse.json(
          { error: "territory_forbidden" },
          { status: 403 },
        ),
      };
    }
    return {
      context: { tenantId: input.tenantId, territoryId: requested },
    };
  }

  const fromActor = input.actorTerritoryId?.trim() || null;
  if (fromActor && (allowed.length === 0 || allowed.includes(fromActor))) {
    return {
      context: { tenantId: input.tenantId, territoryId: fromActor },
    };
  }

  return {
    context: {
      tenantId: input.tenantId,
      territoryId: defaultTerritoryIdForTenant(input.tenantId),
    },
  };
}

export function territoryScopedFromContext(
  context: ActiveTerritoryContext,
): TerritoryScopedQuery | null {
  if (!context.territoryId) return null;
  return { tenantId: context.tenantId, territoryId: context.territoryId };
}

export function filterForActiveTerritory<
  T extends { territoryId?: string | null },
>(items: readonly T[], territoryId: string | null | undefined): T[] {
  if (!territoryId) return [...items];
  return items.filter((item) =>
    recordMatchesTerritoryScope(item.territoryId, territoryId),
  );
}

export function recordVisibleInTerritory(
  recordTerritoryId: string | null | undefined,
  scopeTerritoryId: string | null | undefined,
): boolean {
  return recordMatchesTerritoryScope(recordTerritoryId, scopeTerritoryId);
}
