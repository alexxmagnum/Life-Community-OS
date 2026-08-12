/**
 * Life Map — spatial object projection registry (platform Core).
 *
 * LifeMapObject is never the source of truth. Domain entities remain
 * authoritative; this module only registers / queries spatial projections.
 *
 * Tenant-neutral — no Life Panoramica catalogs, demo objects, binaries, or UI.
 */

import type { DomainId } from "./ids";
import type {
  LifeMapActionKind,
  LifeMapDomainRef,
  LifeMapLayerId,
  LifeMapObject,
  LifeMapObjectState,
  LifeMapObjectType,
  LifeMapPosition,
  LifeMapTerritory,
} from "./life-map";

// ── Domain ownership map ─────────────────────────────────────

/**
 * Expected platform module id for domain-backed spatial object types.
 * Decorative / POI types have no owning Business Domain.
 */
export const LIFE_MAP_DOMAIN_MODULE_BY_TYPE: Readonly<
  Partial<Record<LifeMapObjectType, string>>
> = {
  housing: "housing",
  experience: "experiences",
  place: "community",
  service: "services",
  resource: "reservations",
  community: "community",
  official: "official",
};

/** Default layer when the caller does not override. */
export const LIFE_MAP_DEFAULT_LAYER_BY_TYPE: Readonly<
  Record<LifeMapObjectType, LifeMapLayerId>
> = {
  housing: "housing",
  experience: "experiences",
  place: "places",
  service: "services",
  resource: "resources",
  community: "community",
  official: "official",
  poi: "places",
  decoration: "places",
};

/**
 * Types that must carry a LifeMapDomainRef — they project an owning domain.
 * Housing → Housing, Experience → Experiences, Place → Place/local life,
 * Service → Services. Community / official / resource follow the same rule.
 */
export const LIFE_MAP_DOMAIN_BACKED_OBJECT_TYPES: readonly LifeMapObjectType[] =
  [
    "housing",
    "experience",
    "place",
    "service",
    "resource",
    "community",
    "official",
  ];

export function isLifeMapDomainBackedObjectType(
  type: LifeMapObjectType,
): boolean {
  return (LIFE_MAP_DOMAIN_BACKED_OBJECT_TYPES as readonly string[]).includes(
    type,
  );
}

export function requiresLifeMapDomainRef(type: LifeMapObjectType): boolean {
  return isLifeMapDomainBackedObjectType(type);
}

// ── Projection input ─────────────────────────────────────────

/**
 * Input used to project a spatial object from a domain entity (or decoration).
 * Callers supply domain ids + pose; Core does not invent business data.
 */
export type LifeMapObjectProjectionInput = {
  tenantId: DomainId;
  territoryId: DomainId;
  objectId: DomainId;
  type: LifeMapObjectType;
  /** Defaults from LIFE_MAP_DEFAULT_LAYER_BY_TYPE when omitted. */
  layerId?: LifeMapLayerId;
  /**
   * Required for domain-backed types. Omitted only for decoration / poi
   * anchors that have no Business Domain root.
   */
  ref?: LifeMapDomainRef;
  position: LifeMapPosition;
  /** Optional AssetKey — never binary payload. */
  asset3DKey?: string;
  /** Defaults to "idle". */
  state?: LifeMapObjectState;
  /** Defaults to ["open"] when domain-backed; [] for decoration. */
  availableActions?: LifeMapActionKind[];
  label?: string;
  communityAreaId?: DomainId;
};

export type LifeMapObjectIssueCode =
  | "missing_domain_ref"
  | "unexpected_domain_ref_module"
  | "tenant_mismatch"
  | "territory_mismatch"
  | "module_disabled"
  | "unknown_layer"
  | "missing_ids"
  | "duplicate_object";

export type LifeMapObjectIssue = {
  code: LifeMapObjectIssueCode;
  message: string;
};

export type LifeMapObjectListFilter = {
  layerId?: LifeMapLayerId;
  type?: LifeMapObjectType;
  /** When true, exclude state === "hidden". Default false. */
  excludeHidden?: boolean;
  communityAreaId?: DomainId;
};

export type LifeMapObjectRegistry = {
  readonly territory: LifeMapTerritory;
  /** Project + upsert. Fails closed when moduleEnabled is false. */
  register(
    input: LifeMapObjectProjectionInput | LifeMapObject,
  ): { ok: true; object: LifeMapObject } | { ok: false; issues: LifeMapObjectIssue[] };
  get(objectId: DomainId): LifeMapObject | undefined;
  remove(objectId: DomainId): boolean;
  list(filter?: LifeMapObjectListFilter): LifeMapObject[];
  findByDomainRef(ref: LifeMapDomainRef): LifeMapObject[];
  has(objectId: DomainId): boolean;
  size(): number;
  clear(): void;
};

// ── Validation & projection ──────────────────────────────────

function isLifeMapObject(
  value: LifeMapObjectProjectionInput | LifeMapObject,
): value is LifeMapObject {
  return (
    "availableActions" in value &&
    Array.isArray(value.availableActions) &&
    "state" in value &&
    typeof value.state === "string" &&
    "layerId" in value &&
    typeof value.layerId === "string"
  );
}

/**
 * Structural checks for a spatial projection.
 * Does not authorize actors — AuthZ stays in RBAC + owning domains.
 */
export function validateLifeMapObjectProjection(
  input: LifeMapObjectProjectionInput | LifeMapObject,
  territory?: LifeMapTerritory,
): LifeMapObjectIssue[] {
  const issues: LifeMapObjectIssue[] = [];

  if (!input.tenantId || !input.territoryId || !input.objectId) {
    issues.push({
      code: "missing_ids",
      message: "tenantId, territoryId, and objectId are required.",
    });
  }

  if (territory) {
    if (!territory.moduleEnabled) {
      issues.push({
        code: "module_disabled",
        message:
          "Life Map is disabled for this territory — spatial registry fails closed.",
      });
    }
    if (input.tenantId !== territory.tenantId) {
      issues.push({
        code: "tenant_mismatch",
        message: "Object tenantId does not match territory.tenantId.",
      });
    }
    if (input.territoryId !== territory.territoryId) {
      issues.push({
        code: "territory_mismatch",
        message: "Object territoryId does not match territory.territoryId.",
      });
    }
    const layerId =
      ("layerId" in input && input.layerId) ||
      LIFE_MAP_DEFAULT_LAYER_BY_TYPE[input.type];
    if (
      territory.layers.length > 0 &&
      !territory.layers.some((layer) => layer.id === layerId)
    ) {
      issues.push({
        code: "unknown_layer",
        message: `Layer "${String(layerId)}" is not configured on this territory.`,
      });
    }
  }

  const ref = input.ref;
  if (requiresLifeMapDomainRef(input.type)) {
    if (!ref?.moduleId || !ref.entityId) {
      issues.push({
        code: "missing_domain_ref",
        message: `LifeMapObject type "${input.type}" must reference its owning domain (not SoT).`,
      });
    } else {
      const expected = LIFE_MAP_DOMAIN_MODULE_BY_TYPE[input.type];
      if (expected && ref.moduleId !== expected) {
        issues.push({
          code: "unexpected_domain_ref_module",
          message: `Expected domain module "${expected}" for type "${input.type}", got "${ref.moduleId}".`,
        });
      }
    }
  }

  return issues;
}

/**
 * Build a LifeMapObject projection from input.
 * Does not mutate domain entities. Does not persist.
 */
export function projectLifeMapObject(
  input: LifeMapObjectProjectionInput | LifeMapObject,
): LifeMapObject {
  if (isLifeMapObject(input)) {
    return {
      ...input,
      availableActions: [...input.availableActions],
    };
  }

  const domainBacked = requiresLifeMapDomainRef(input.type);
  return {
    tenantId: input.tenantId,
    territoryId: input.territoryId,
    objectId: input.objectId,
    type: input.type,
    layerId: input.layerId ?? LIFE_MAP_DEFAULT_LAYER_BY_TYPE[input.type],
    ref: input.ref,
    position: input.position,
    asset3DKey: input.asset3DKey,
    state: input.state ?? "idle",
    availableActions:
      input.availableActions ?? (domainBacked ? (["open"] as LifeMapActionKind[]) : []),
    label: input.label,
    communityAreaId: input.communityAreaId,
  };
}

export function assertLifeMapObjectProjection(
  input: LifeMapObjectProjectionInput | LifeMapObject,
  territory?: LifeMapTerritory,
): LifeMapObject {
  const issues = validateLifeMapObjectProjection(input, territory);
  if (issues.length > 0) {
    throw new Error(
      `Invalid LifeMapObject projection: ${issues.map((i) => i.code).join(", ")}`,
    );
  }
  return projectLifeMapObject(input);
}

export function lifeMapObjectsMatchDomainRef(
  object: LifeMapObject,
  ref: LifeMapDomainRef,
): boolean {
  if (!object.ref) return false;
  if (object.ref.moduleId !== ref.moduleId) return false;
  if (object.ref.entityId !== ref.entityId) return false;
  if (ref.entityKind !== undefined && object.ref.entityKind !== ref.entityKind) {
    return false;
  }
  return true;
}

export function filterLifeMapObjects(
  objects: readonly LifeMapObject[],
  filter: LifeMapObjectListFilter = {},
): LifeMapObject[] {
  return objects.filter((object) => {
    if (filter.layerId !== undefined && object.layerId !== filter.layerId) {
      return false;
    }
    if (filter.type !== undefined && object.type !== filter.type) {
      return false;
    }
    if (filter.excludeHidden && object.state === "hidden") {
      return false;
    }
    if (
      filter.communityAreaId !== undefined &&
      object.communityAreaId !== filter.communityAreaId
    ) {
      return false;
    }
    return true;
  });
}

/**
 * In-memory spatial projection registry scoped to one LifeMapTerritory.
 * Not a database. Not a Business Domain store.
 */
export function createLifeMapObjectRegistry(
  territory: LifeMapTerritory,
): LifeMapObjectRegistry {
  const byId = new Map<string, LifeMapObject>();

  return {
    territory,

    register(input) {
      const issues = validateLifeMapObjectProjection(input, territory);
      if (issues.length > 0) {
        return { ok: false, issues };
      }
      const object = projectLifeMapObject(input);
      byId.set(object.objectId, object);
      return { ok: true, object };
    },

    get(objectId) {
      if (!territory.moduleEnabled) return undefined;
      return byId.get(objectId);
    },

    remove(objectId) {
      return byId.delete(objectId);
    },

    list(filter = {}) {
      if (!territory.moduleEnabled) return [];
      return filterLifeMapObjects([...byId.values()], filter);
    },

    findByDomainRef(ref) {
      if (!territory.moduleEnabled) return [];
      return [...byId.values()].filter((object) =>
        lifeMapObjectsMatchDomainRef(object, ref),
      );
    },

    has(objectId) {
      if (!territory.moduleEnabled) return false;
      return byId.has(objectId);
    },

    size() {
      if (!territory.moduleEnabled) return 0;
      return byId.size;
    },

    clear() {
      byId.clear();
    },
  };
}
