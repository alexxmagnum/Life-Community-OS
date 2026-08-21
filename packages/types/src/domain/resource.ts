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

export type ResourceStatus =
  | "draft"
  | "active"
  | "inactive"
  | "archived"
  | "maintenance"
  | "retired";

/**
 * Product booking category (Phase 8).
 * Independent from ADR ResourceType (sports_facility, space, …).
 */
export type ResourceCategory =
  | "sport"
  | "facility"
  | "hospitality"
  | "activity"
  | "service";

export const RESOURCE_CATEGORIES: readonly ResourceCategory[] = [
  "sport",
  "facility",
  "hospitality",
  "activity",
  "service",
] as const;

export const RESOURCE_PRODUCT_STATUSES: readonly ResourceStatus[] = [
  "draft",
  "active",
  "inactive",
  "archived",
] as const;

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
  /** Alias of `rules` for product booking copy. */
  bookingRules?: string[];
  slotMinutes?: number;
  capacity?: number;
  requiresApproval?: boolean;
  availabilityPreview?: string;
  /** Geographic Location SoT — coordinates never live on Resource. */
  locationId?: DomainId;
  createdBy?: DomainId;
  category?: ResourceCategory;
  images?: string[];
  /**
   * Optional facility used by an activity Resource (padel class → court).
   * Reservations stay on one Resource row; this is a link, not a second booking type.
   */
  linkedResourceId?: DomainId;
  scheduleStartsAt?: IsoDateTimeString;
  scheduleEndsAt?: IsoDateTimeString;
  communityEventId?: DomainId;
  organizerName?: string;
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
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed"
  | "rejected"
  | "reserved"
  | "expired";

export const RESERVATION_STATUSES: readonly ReservationStatus[] = [
  "pending",
  "confirmed",
  "cancelled",
  "completed",
  "rejected",
  "reserved",
  "expired",
] as const;

export type ResourceAvailabilityStatus = "available" | "blocked";

export type ResourceAvailability = {
  id: DomainId;
  tenantId: DomainId;
  resourceId: DomainId;
  createdBy: DomainId;
  date: string;
  startTime: string;
  endTime: string;
  capacity: number;
  status: ResourceAvailabilityStatus;
  createdAt: IsoDateTimeString;
  updatedAt: IsoDateTimeString;
};

export type Reservation = {
  id: DomainId;
  tenantId?: DomainId;
  resourceId: DomainId;
  createdBy?: DomainId;
  personId?: DomainId;
  participantCount?: number;
  startTime?: IsoDateTimeString;
  endTime?: IsoDateTimeString;
  date: string;
  start: string;
  end: string;
  status: ReservationStatus;
  experienceId?: DomainId;
  createdAt?: IsoDateTimeString;
  updatedAt?: IsoDateTimeString;
  resourceName?: string;
  resourceImageUrl?: string;
  location?: string;
  areaLabel?: string;
};

export type ReservationParticipant = {
  id: DomainId;
  tenantId: DomainId;
  reservationId: DomainId;
  personId: DomainId;
  createdBy: DomainId;
  createdAt: IsoDateTimeString;
  updatedAt: IsoDateTimeString;
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
  if (
    !resource.bookable ||
    resource.status === "retired" ||
    resource.status === "archived" ||
    resource.status === "inactive" ||
    resource.status === "draft" ||
    resource.status === "maintenance"
  ) {
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

export function isResourceCategory(
  value: string,
): value is ResourceCategory {
  return (RESOURCE_CATEGORIES as readonly string[]).includes(value);
}

export function isReservationStatus(
  value: string,
): value is ReservationStatus {
  return (RESERVATION_STATUSES as readonly string[]).includes(value);
}

export function isResourceProductStatus(
  value: string,
): value is ResourceStatus {
  return (
    (RESOURCE_PRODUCT_STATUSES as readonly string[]).includes(value) ||
    value === "maintenance" ||
    value === "retired"
  );
}

export function resourceIsBookable(resource: Pick<CommunityResource, "bookable" | "status">): boolean {
  if (resource.bookable === false) return false;
  return resource.status === "active" || resource.status === undefined;
}

export function reservationIsActive(status: ReservationStatus): boolean {
  return status === "pending" || status === "confirmed" || status === "reserved";
}

export function hhmmToMinutes(value: string): number {
  const [h, m] = value.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

export function intervalsOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string,
): boolean {
  return hhmmToMinutes(aStart) < hhmmToMinutes(bEnd) && hhmmToMinutes(bStart) < hhmmToMinutes(aEnd);
}

export function resourceTypeFromCategory(category: ResourceCategory): ResourceType {
  switch (category) {
    case "sport":
      return "sports_facility";
    case "facility":
      return "space";
    case "hospitality":
      return "amenity";
    case "activity":
      return "custom";
    case "service":
      return "custom";
  }
}

export function resourceCategoryFromType(type: ResourceType): ResourceCategory {
  switch (type) {
    case "sports_facility":
      return "sport";
    case "space":
      return "facility";
    case "amenity":
      return "hospitality";
    case "equipment":
    case "vehicle":
      return "service";
    default:
      return "service";
  }
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

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function minutesToHhmm(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${pad2(h)}:${pad2(m)}`;
}

export function dateOffsetIso(days: number, from = new Date()): string {
  const d = new Date(from);
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function combineDateAndTime(date: string, hhmm: string): IsoDateTimeString {
  const iso = new Date(`${date}T${hhmm}:00`);
  return iso.toISOString();
}

export function splitIsoToDateTime(iso: IsoDateTimeString): {
  date: string;
  start: string;
} {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return { date: iso.slice(0, 10), start: "00:00" };
  }
  return {
    date: d.toISOString().slice(0, 10),
    start: `${pad2(d.getHours())}:${pad2(d.getMinutes())}`,
  };
}

export type CreateBookableResourceInput = {
  tenantId: DomainId;
  createdBy: DomainId;
  name: string;
  description: string;
  category: ResourceCategory;
  location?: string;
  areaLabel?: string;
  locationId?: DomainId;
  images?: string[];
  bookingRules?: string[];
  slotMinutes?: number;
  capacity?: number;
  requiresApproval?: boolean;
  status?: ResourceStatus;
  bookable?: boolean;
  linkedResourceId?: DomainId;
  scheduleStartsAt?: IsoDateTimeString;
  scheduleEndsAt?: IsoDateTimeString;
  organizerName?: string;
  type?: ResourceType;
  ownerKind?: ResourceOwnerKind;
  ownerId?: DomainId;
  id?: DomainId;
};

export function createBookableResourceRecord(
  input: CreateBookableResourceInput,
): CommunityResource {
  const name = input.name.trim();
  const description = input.description.trim();
  if (!name || !description) {
    throw new Error("Invalid Resource: missing_fields");
  }
  if (!isResourceCategory(input.category)) {
    throw new Error("Invalid Resource: invalid_category");
  }
  const status = input.status ?? "active";
  if (!isResourceProductStatus(status)) {
    throw new Error("Invalid Resource: invalid_status");
  }
  const now = new Date().toISOString();
  const images = (input.images ?? []).map((item) => item.trim()).filter(Boolean);
  const rules = (input.bookingRules ?? []).map((item) => item.trim()).filter(Boolean);
  const slotMinutes =
    typeof input.slotMinutes === "number" && input.slotMinutes > 0
      ? input.slotMinutes
      : 60;
  const capacity =
    typeof input.capacity === "number" && input.capacity > 0 ? input.capacity : 1;
  return {
    id: input.id?.trim() || `rs-${cryptoRandomId()}`,
    tenantId: input.tenantId.trim(),
    createdBy: input.createdBy.trim(),
    name,
    description,
    imageUrl: images[0],
    images,
    location: (input.location ?? "").trim() || "Comunidad",
    areaLabel: input.areaLabel?.trim(),
    locationId: input.locationId?.trim() || undefined,
    type: input.type ?? resourceTypeFromCategory(input.category),
    category: input.category,
    ownerKind: input.ownerKind ?? "territory_authority",
    ownerId: input.ownerId?.trim() || input.tenantId.trim(),
    bookable: input.bookable ?? true,
    status,
    rules,
    bookingRules: rules,
    slotMinutes,
    capacity,
    requiresApproval: Boolean(input.requiresApproval),
    linkedResourceId: input.linkedResourceId?.trim() || undefined,
    scheduleStartsAt: input.scheduleStartsAt,
    scheduleEndsAt: input.scheduleEndsAt,
    organizerName: input.organizerName?.trim(),
    createdAt: now,
    updatedAt: now,
  };
}

export type CreateResourceAvailabilityInput = {
  tenantId: DomainId;
  resourceId: DomainId;
  createdBy: DomainId;
  date: string;
  startTime: string;
  endTime: string;
  capacity: number;
  status?: ResourceAvailabilityStatus;
  id?: DomainId;
};

export function createResourceAvailabilityRecord(
  input: CreateResourceAvailabilityInput,
): ResourceAvailability {
  const now = new Date().toISOString();
  return {
    id: input.id?.trim() || `av-${cryptoRandomId()}`,
    tenantId: input.tenantId.trim(),
    resourceId: input.resourceId.trim(),
    createdBy: input.createdBy.trim(),
    date: input.date,
    startTime: input.startTime,
    endTime: input.endTime,
    capacity: Math.max(1, input.capacity),
    status: input.status ?? "available",
    createdAt: now,
    updatedAt: now,
  };
}

export function generateResourceAvailability(input: {
  resource: CommunityResource;
  createdBy: string;
  days?: number;
}): ResourceAvailability[] {
  const resource = input.resource;
  const tenantId = resource.tenantId ?? "";
  const createdBy = input.createdBy;
  const capacity = resource.capacity && resource.capacity > 0 ? resource.capacity : 1;
  if (resource.scheduleStartsAt) {
    const start = splitIsoToDateTime(resource.scheduleStartsAt);
    const end = resource.scheduleEndsAt
      ? splitIsoToDateTime(resource.scheduleEndsAt)
      : {
          date: start.date,
          start: minutesToHhmm(hhmmToMinutes(start.start) + (resource.slotMinutes ?? 60)),
        };
    return [
      createResourceAvailabilityRecord({
        tenantId,
        resourceId: resource.id,
        createdBy,
        date: start.date,
        startTime: start.start,
        endTime: end.start,
        capacity,
      }),
    ];
  }
  const days = input.days ?? 14;
  const step = resource.slotMinutes && resource.slotMinutes > 0 ? resource.slotMinutes : 60;
  const slots: ResourceAvailability[] = [];
  for (let day = 0; day < days; day += 1) {
    const date = dateOffsetIso(day);
    for (let minutes = 8 * 60; minutes + step <= 21 * 60; minutes += step) {
      slots.push(
        createResourceAvailabilityRecord({
          tenantId,
          resourceId: resource.id,
          createdBy,
          date,
          startTime: minutesToHhmm(minutes),
          endTime: minutesToHhmm(minutes + step),
          capacity,
        }),
      );
    }
  }
  return slots;
}

export type CreateReservationInput = {
  tenantId: DomainId;
  resourceId: DomainId;
  createdBy: DomainId;
  date: string;
  start: string;
  end: string;
  status?: ReservationStatus;
  participantCount?: number;
  experienceId?: DomainId;
  resourceName?: string;
  resourceImageUrl?: string;
  location?: string;
  areaLabel?: string;
  id?: DomainId;
};

export function createReservationRecord(input: CreateReservationInput): Reservation {
  const now = new Date().toISOString();
  const status = input.status ?? "confirmed";
  if (!isReservationStatus(status)) {
    throw new Error("Invalid Reservation: invalid_status");
  }
  const participantCount =
    typeof input.participantCount === "number" && input.participantCount > 0
      ? input.participantCount
      : 1;
  return {
    id: input.id?.trim() || `rv-${cryptoRandomId()}`,
    tenantId: input.tenantId.trim(),
    resourceId: input.resourceId.trim(),
    createdBy: input.createdBy.trim(),
    personId: input.createdBy.trim(),
    participantCount,
    date: input.date,
    start: input.start,
    end: input.end,
    startTime: combineDateAndTime(input.date, input.start),
    endTime: combineDateAndTime(input.date, input.end),
    status,
    experienceId: input.experienceId?.trim() || undefined,
    resourceName: input.resourceName,
    resourceImageUrl: input.resourceImageUrl,
    location: input.location,
    areaLabel: input.areaLabel,
    createdAt: now,
    updatedAt: now,
  };
}

export function createReservationParticipantRecord(input: {
  tenantId: DomainId;
  reservationId: DomainId;
  personId: DomainId;
  createdBy: DomainId;
  id?: DomainId;
}): ReservationParticipant {
  const now = new Date().toISOString();
  return {
    id: input.id?.trim() || `rp-${cryptoRandomId()}`,
    tenantId: input.tenantId.trim(),
    reservationId: input.reservationId.trim(),
    personId: input.personId.trim(),
    createdBy: input.createdBy.trim(),
    createdAt: now,
    updatedAt: now,
  };
}

export function usedCapacityForInterval(input: {
  reservations: readonly Reservation[];
  resourceId: string;
  date: string;
  start: string;
  end: string;
}): number {
  return input.reservations.reduce((sum, item) => {
    if (item.resourceId !== input.resourceId) return sum;
    if (item.date !== input.date) return sum;
    if (!reservationIsActive(item.status)) return sum;
    if (!intervalsOverlap(item.start, item.end, input.start, input.end)) return sum;
    return sum + (item.participantCount && item.participantCount > 0 ? item.participantCount : 1);
  }, 0);
}

export function withReservationLifecycle(
  reservation: Reservation,
  now = new Date(),
): Reservation {
  if (!reservationIsActive(reservation.status)) return reservation;
  const end = reservation.endTime
    ? new Date(reservation.endTime)
    : new Date(`${reservation.date}T${reservation.end}:00`);
  if (Number.isNaN(end.getTime()) || end > now) return reservation;
  return {
    ...reservation,
    status: reservation.status === "pending" ? "expired" : "completed",
  };
}
