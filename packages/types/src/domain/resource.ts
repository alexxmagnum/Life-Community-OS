import type { DomainId, IsoDateTimeString } from "./ids";

/**
 * Shared community resource inventory (ADR-031).
 * Area-scoped access policy (ADR-036).
 * Territorial resources are not owned by resident Persons or by Channels.
 */

export type ResourceType =
  | "sports_facility"
  | "space"
  | "amenity"
  | "equipment"
  | "vehicle"
  | "custom";

/**
 * Who stewards a territorial / shared resource.
 * Residents do not appear as owners of territorial facilities.
 */
export type ResourceOwnerKind =
  | "territory_authority"
  | "official_entity"
  | "community_area"
  | "business_profile";

export type ResourceStatus = "draft" | "active" | "maintenance" | "retired";

/**
 * Who may see public catalog information about a resource (ADR-036).
 * Independent from reservation eligibility.
 */
export type ResourceVisibility =
  | "territory"
  | "community_area"
  | "private"
  | "hidden";

/**
 * Who may attempt to reserve / book (ADR-036).
 * Future values prepare club, guest, and paid paths without implementing them.
 */
export type ResourceReservationScope =
  | "territory"
  | "community_area"
  | "group"
  | "permit_holders"
  | "guests_allowed"
  | "paid";

/**
 * Access policy attached to a Resource.
 * Do not assume all Territory residents share all resources.
 */
export type ResourceAccessPolicy = {
  /** Public information visibility (catalog facts). */
  visibility: ResourceVisibility;
  /** Who may reserve when bookable. */
  reservationScope: ResourceReservationScope;
  /**
   * Eligible Community Area ids when reservationScope is `community_area`.
   * If omitted, evaluators default to the resource home `communityAreaId`.
   */
  reservationCommunityAreaIds?: DomainId[];
  /** Eligible Group ids when reservationScope is `group`. */
  reservationGroupIds?: DomainId[];
  /** Explicit shared territorial amenity (often paired with reservationScope territory). */
  sharedAcrossAreas?: boolean;
  /** Foundation: guests may reserve under Tenant policy — not a product implementation. */
  allowGuestReservation?: boolean;
  /** Foundation: paid path required — no payment engine here. */
  requiresPayment?: boolean;
};

/**
 * Canonical resource aggregate (also known as CommunityResource in product catalogs).
 */
export type CommunityResource = {
  id: DomainId;
  tenantId?: DomainId;
  territoryId?: DomainId;
  name: string;
  description: string;
  imageUrl?: string;
  location: string;
  areaLabel?: string;
  /** Home / location Community Area of the asset (ADR-005 / ADR-036). */
  communityAreaId?: DomainId;
  type: ResourceType;
  ownerKind: ResourceOwnerKind;
  ownerId: DomainId;
  /** Managing Official Entity when distinct from owner (optional). */
  managedByOfficialEntityId?: DomainId;
  bookable: boolean;
  status: ResourceStatus;
  /**
   * Visibility + reservation eligibility.
   * When omitted, evaluators treat visibility/reservation as territory-wide
   * (legacy catalogs) — prefer setting explicitly for area-scoped assets.
   */
  accessPolicy?: ResourceAccessPolicy;
  rules?: string[];
  slotMinutes?: number;
  capacity?: number;
  requiresApproval?: boolean;
  availabilityPreview?: string;
  createdAt?: IsoDateTimeString;
  updatedAt?: IsoDateTimeString;
};

/** Glossary / ADR name — alias of CommunityResource. */
export type Resource = CommunityResource;

export type SlotStatus = "available" | "occupied";

export type TimeSlot = {
  id: DomainId;
  start: string;
  end: string;
  status: SlotStatus;
};

export type ReservationStatus =
  | "reserved"
  | "pending"
  | "cancelled"
  | "expired";

export type Reservation = {
  id: DomainId;
  resourceId: DomainId;
  personId?: DomainId;
  date: string;
  start: string;
  end: string;
  status: ReservationStatus;
  createdAt?: IsoDateTimeString;
  resourceName?: string;
  resourceImageUrl?: string;
  location?: string;
  areaLabel?: string;
};

const TERRITORIAL_OWNER_KINDS: ReadonlySet<ResourceOwnerKind> = new Set([
  "territory_authority",
  "official_entity",
  "community_area",
  "business_profile",
]);

export type ResourceOwnershipIssue = {
  code: "missing_owner" | "invalid_owner_kind" | "missing_ids";
  message: string;
};

/** Domain guard: territorial resources cannot be resident-owned. */
export function validateResourceOwnership(
  resource: Pick<
    CommunityResource,
    "ownerKind" | "ownerId" | "tenantId" | "territoryId"
  >,
): ResourceOwnershipIssue[] {
  const issues: ResourceOwnershipIssue[] = [];
  if (!resource.ownerKind || !resource.ownerId) {
    issues.push({
      code: "missing_owner",
      message: "Resource requires ownerKind and ownerId.",
    });
  } else if (!TERRITORIAL_OWNER_KINDS.has(resource.ownerKind)) {
    issues.push({
      code: "invalid_owner_kind",
      message: `Invalid resource ownerKind: ${String(resource.ownerKind)}.`,
    });
  }
  return issues;
}

export type ResourceAccessPolicyIssue = {
  code:
    | "community_area_scope_missing_areas"
    | "group_scope_missing_groups"
    | "invalid_visibility"
    | "invalid_reservation_scope";
  message: string;
};

const VISIBILITY: ReadonlySet<ResourceVisibility> = new Set([
  "territory",
  "community_area",
  "private",
  "hidden",
]);

const RESERVATION_SCOPES: ReadonlySet<ResourceReservationScope> = new Set([
  "territory",
  "community_area",
  "group",
  "permit_holders",
  "guests_allowed",
  "paid",
]);

/** Validates accessPolicy shape before persistence (ADR-036). */
export function validateResourceAccessPolicy(
  resource: Pick<CommunityResource, "communityAreaId" | "accessPolicy">,
): ResourceAccessPolicyIssue[] {
  const policy = resource.accessPolicy;
  if (!policy) return [];

  const issues: ResourceAccessPolicyIssue[] = [];
  if (!VISIBILITY.has(policy.visibility)) {
    issues.push({
      code: "invalid_visibility",
      message: `Unknown visibility: ${String(policy.visibility)}.`,
    });
  }
  if (!RESERVATION_SCOPES.has(policy.reservationScope)) {
    issues.push({
      code: "invalid_reservation_scope",
      message: `Unknown reservationScope: ${String(policy.reservationScope)}.`,
    });
  }
  if (policy.reservationScope === "community_area") {
    const areas =
      policy.reservationCommunityAreaIds?.filter(Boolean) ??
      (resource.communityAreaId ? [resource.communityAreaId] : []);
    if (areas.length === 0) {
      issues.push({
        code: "community_area_scope_missing_areas",
        message:
          "reservationScope community_area requires reservationCommunityAreaIds or communityAreaId.",
      });
    }
  }
  if (
    policy.reservationScope === "group" &&
    !(policy.reservationGroupIds && policy.reservationGroupIds.length > 0)
  ) {
    issues.push({
      code: "group_scope_missing_groups",
      message: "reservationScope group requires reservationGroupIds.",
    });
  }
  return issues;
}

export type ResourceAccessActor = {
  tenantId: DomainId;
  territoryId: DomainId;
  /**
   * Community Area affiliations for ADR-036 evaluation.
   * MUST be derived from active PropertyPersonRelationships (ADR-037),
   * not hardcoded on Person/User.
   */
  communityAreaIds: readonly DomainId[];
  /** Group memberships when evaluating group-scoped resources. */
  groupIds?: readonly DomainId[];
  /** RBAC: may reserve (capability). */
  canReservePermission: boolean;
  /** RBAC: may manage resources (steward override for reserve paths). */
  canManageResourcePermission?: boolean;
  isGuest?: boolean;
  /** Future: club/permit flags */
  hasPermit?: boolean;
  /** Future: paid entitlement satisfied */
  hasPaidEntitlement?: boolean;
};

export type ResourceAccessDecision = {
  canViewPublicInfo: boolean;
  canReserve: boolean;
  reasons: string[];
};

function effectiveReservationAreaIds(
  resource: Pick<CommunityResource, "communityAreaId" | "accessPolicy">,
): DomainId[] {
  const policy = resource.accessPolicy;
  if (policy?.reservationCommunityAreaIds?.length) {
    return [...policy.reservationCommunityAreaIds];
  }
  return resource.communityAreaId ? [resource.communityAreaId] : [];
}

/**
 * Evaluates public visibility vs reservation eligibility (ADR-036).
 * Does not check slot availability — that remains ADR-031 booking logic.
 */
export function evaluateResourceAccess(
  resource: Pick<
    CommunityResource,
    | "tenantId"
    | "territoryId"
    | "communityAreaId"
    | "bookable"
    | "status"
    | "accessPolicy"
  >,
  actor: ResourceAccessActor,
): ResourceAccessDecision {
  const reasons: string[] = [];
  const policy = resource.accessPolicy ?? {
    visibility: "territory" as const,
    reservationScope: "territory" as const,
  };

  if (resource.tenantId && resource.tenantId !== actor.tenantId) {
    return {
      canViewPublicInfo: false,
      canReserve: false,
      reasons: ["tenant_mismatch"],
    };
  }
  if (resource.territoryId && resource.territoryId !== actor.territoryId) {
    return {
      canViewPublicInfo: false,
      canReserve: false,
      reasons: ["territory_mismatch"],
    };
  }

  let canViewPublicInfo = false;
  switch (policy.visibility) {
    case "hidden":
      canViewPublicInfo = Boolean(actor.canManageResourcePermission);
      if (!canViewPublicInfo) reasons.push("visibility_hidden");
      break;
    case "private":
      canViewPublicInfo = Boolean(
        actor.canManageResourcePermission ||
          (policy.reservationScope === "community_area" &&
            effectiveReservationAreaIds(resource).some((id) =>
              actor.communityAreaIds.includes(id),
            )) ||
          (policy.reservationScope === "group" &&
            policy.reservationGroupIds?.some((id) =>
              actor.groupIds?.includes(id),
            )),
      );
      if (!canViewPublicInfo) reasons.push("visibility_private");
      break;
    case "community_area": {
      // Emphasizes home-area discovery; public facts remain visible to Territory members
      // unless product later tightens listing. Reservation remains separately scoped.
      canViewPublicInfo = true;
      break;
    }
    case "territory":
    default:
      canViewPublicInfo = true;
      break;
  }

  let canReserve = false;
  if (!resource.bookable || resource.status === "retired") {
    reasons.push("not_bookable");
  } else if (actor.canManageResourcePermission) {
    canReserve = true;
    reasons.push("manage_override");
  } else if (!actor.canReservePermission) {
    reasons.push("missing_reserve_permission");
  } else {
    switch (policy.reservationScope) {
      case "territory":
        canReserve = true;
        break;
      case "community_area": {
        const areas = effectiveReservationAreaIds(resource);
        canReserve = areas.some((id) => actor.communityAreaIds.includes(id));
        if (!canReserve) reasons.push("community_area_not_affiliated");
        break;
      }
      case "group": {
        const groups = policy.reservationGroupIds ?? [];
        canReserve = groups.some((id) => actor.groupIds?.includes(id));
        if (!canReserve) reasons.push("group_not_member");
        break;
      }
      case "permit_holders":
        canReserve = Boolean(actor.hasPermit);
        if (!canReserve) reasons.push("permit_required");
        break;
      case "guests_allowed":
        if (actor.isGuest && !policy.allowGuestReservation) {
          canReserve = false;
          reasons.push("guests_not_allowed");
        } else {
          canReserve = true;
        }
        break;
      case "paid":
        canReserve = Boolean(actor.hasPaidEntitlement);
        if (!canReserve) reasons.push("payment_required");
        break;
      default:
        reasons.push("unknown_reservation_scope");
        break;
    }
  }

  return { canViewPublicInfo, canReserve, reasons };
}
