import type { DomainId, IsoDateTimeString } from "./ids";

/**
 * Geographical or functional community environment.
 * Belongs to exactly one Tenant. Source: public.territories + ADR-001.
 *
 * Tenant = SaaS customer (billing, branding, capabilities).
 * Territory = physical world (places, people, organisations, community life).
 * One Tenant may own many Territories.
 */
export const TERRITORY_STATUSES = [
  "draft",
  "active",
  "inactive",
  "archived",
] as const;

export type TerritoryStatus = (typeof TERRITORY_STATUSES)[number];

/** WGS84 bounding box — geographic envelope, not a map renderer contract. */
export type TerritoryBounds = {
  south: number;
  west: number;
  north: number;
  east: number;
};

export type Territory = {
  id: DomainId;
  tenantId: DomainId;
  name: string;
  slug: string;
  description: string | null;
  status: TerritoryStatus;
  locale?: string;
  timezone?: string;
  bounds?: TerritoryBounds;
  metadata: Record<string, unknown>;
  createdAt: IsoDateTimeString;
  updatedAt: IsoDateTimeString;
};

export type TerritoryIssueCode =
  | "missing_id"
  | "missing_tenant"
  | "missing_name"
  | "missing_slug"
  | "invalid_slug"
  | "invalid_status"
  | "invalid_bounds"
  | "tenant_mismatch";

export type TerritoryIssue = {
  code: TerritoryIssueCode;
  message: string;
};

export function isTerritoryStatus(value: string): value is TerritoryStatus {
  return (TERRITORY_STATUSES as readonly string[]).includes(value);
}

export function slugifyTerritoryName(name: string): string {
  const ascii = name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return ascii || "territory";
}

function isValidBounds(bounds: TerritoryBounds): boolean {
  return (
    Number.isFinite(bounds.south) &&
    Number.isFinite(bounds.west) &&
    Number.isFinite(bounds.north) &&
    Number.isFinite(bounds.east) &&
    bounds.south >= -90 &&
    bounds.north <= 90 &&
    bounds.south <= bounds.north &&
    bounds.west >= -180 &&
    bounds.east <= 180
  );
}

export function validateTerritory(input: Territory): TerritoryIssue[] {
  const issues: TerritoryIssue[] = [];
  if (!input.id?.trim()) {
    issues.push({ code: "missing_id", message: "id is required" });
  }
  if (!input.tenantId?.trim()) {
    issues.push({ code: "missing_tenant", message: "tenantId is required" });
  }
  if (!input.name?.trim()) {
    issues.push({ code: "missing_name", message: "name is required" });
  }
  if (!input.slug?.trim()) {
    issues.push({ code: "missing_slug", message: "slug is required" });
  } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.slug)) {
    issues.push({
      code: "invalid_slug",
      message: "slug must be lowercase kebab-case",
    });
  }
  if (!isTerritoryStatus(input.status)) {
    issues.push({
      code: "invalid_status",
      message: `Unknown status: ${String(input.status)}`,
    });
  }
  if (input.bounds && !isValidBounds(input.bounds)) {
    issues.push({
      code: "invalid_bounds",
      message: "bounds must be a valid WGS84 envelope",
    });
  }
  return issues;
}

export type CreateTerritoryInput = {
  tenantId: DomainId;
  name: string;
  slug?: string;
  description?: string | null;
  status?: TerritoryStatus;
  locale?: string;
  timezone?: string;
  bounds?: TerritoryBounds;
  metadata?: Record<string, unknown>;
  id?: DomainId;
};

/**
 * Empty Territory factory — name + tenant produce a Territory without
 * Panorámica catalogs, packs, or product if-slug.
 */
export function createTerritory(input: CreateTerritoryInput): Territory {
  const now = new Date().toISOString();
  const name = input.name.trim();
  const slug = (input.slug?.trim() || slugifyTerritoryName(name)).toLowerCase();
  const locale = input.locale?.trim();
  const timezone = input.timezone?.trim();
  const territory: Territory = {
    id: input.id?.trim() || `terr-${cryptoRandomId()}`,
    tenantId: input.tenantId.trim(),
    name,
    slug,
    description: input.description?.trim() || null,
    status: input.status ?? "draft",
    metadata: { ...(input.metadata ?? {}) },
    createdAt: now,
    updatedAt: now,
    ...(locale ? { locale } : {}),
    ...(timezone ? { timezone } : {}),
    ...(input.bounds ? { bounds: input.bounds } : {}),
  };
  const issues = validateTerritory(territory);
  if (issues.length > 0) {
    throw new Error(
      `Invalid Territory: ${issues.map((issue) => issue.code).join(", ")}`,
    );
  }
  return territory;
}

export function territoryBelongsToTenant(
  territory: Pick<Territory, "tenantId">,
  tenantId: DomainId,
): boolean {
  return Boolean(territory.tenantId && territory.tenantId === tenantId);
}

export function filterTerritoriesForTenant(
  territories: readonly Territory[],
  tenantId: DomainId,
): Territory[] {
  return territories.filter((territory) =>
    territoryBelongsToTenant(territory, tenantId),
  );
}

function cryptoRandomId(): string {
  const c =
    typeof globalThis !== "undefined"
      ? (globalThis as { crypto?: { randomUUID?: () => string } }).crypto
      : undefined;
  if (typeof c?.randomUUID === "function") {
    return c.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
