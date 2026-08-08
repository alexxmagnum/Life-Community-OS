import type { DomainId, IsoDateTimeString } from "./ids";
import type { Address } from "./address";
import type { Property } from "./property";

/**
 * Time-aware Person ↔ Property association (ADR-008 / ADR-009 / ADR-037 / ADR-038).
 * Source of residency for Community Area–derived resource access.
 * Not a security boundary and not a Permission.
 *
 * Claims start as pending_verification and do not grant restricted access
 * until verification completes and status becomes active (ADR-038).
 *
 * Field mapping to Foundation SQL:
 * - validFrom → start_date
 * - validTo → end_date
 */

export type PropertyPersonRelationshipType =
  | "owner"
  | "resident"
  | "tenant"
  | "family_member"
  | "guest"
  | "staff"
  | "authorized_person"
  | "manager";

export type PropertyPersonRelationshipStatus =
  | "pending_verification"
  | "active"
  | "inactive"
  | "ended"
  | "archived"
  | "rejected";

export type PropertyPersonRelationship = {
  id: DomainId;
  propertyId: DomainId;
  personId: DomainId;
  relationshipType: PropertyPersonRelationshipType;
  /** When the relationship begins (maps to start_date). */
  validFrom?: string;
  /** When the relationship ends; omit while open (maps to end_date). */
  validTo?: string;
  status: PropertyPersonRelationshipStatus;
  /** Set when activated via ResidencyVerification (ADR-038). */
  verifiedAt?: IsoDateTimeString;
  /** ResidencyVerification id that activated this relationship, when applicable. */
  verificationId?: DomainId;
  metadata?: Record<string, unknown>;
  createdAt?: IsoDateTimeString;
  updatedAt?: IsoDateTimeString;
};

/**
 * Roles that typically contribute Community Area resource eligibility (ADR-037).
 * Guests/staff may be included or excluded by Tenant policy later.
 */
export const DEFAULT_RESIDENCY_ELIGIBILITY_ROLES: ReadonlySet<PropertyPersonRelationshipType> =
  new Set(["owner", "resident", "tenant", "family_member"]);

/**
 * Roles that require verification before becoming active by default (ADR-038).
 */
export const DEFAULT_ROLES_REQUIRING_VERIFICATION: ReadonlySet<PropertyPersonRelationshipType> =
  new Set(["owner", "resident", "tenant", "family_member", "guest"]);

export type ResidencyDerivationContext = {
  relationships: readonly PropertyPersonRelationship[];
  propertiesById: ReadonlyMap<DomainId, Property>;
  addressesById: ReadonlyMap<DomainId, Address>;
  /** Roles that count for area resource eligibility. */
  eligibilityRoles?: ReadonlySet<PropertyPersonRelationshipType>;
  /** Instant for temporal validity — ISO date or datetime string. */
  at?: string;
};

function toTime(value: string | undefined): number | null {
  if (!value) return null;
  const t = Date.parse(value);
  return Number.isNaN(t) ? null : t;
}

/**
 * Whether a relationship is a verified, temporally valid residency at `at`.
 * pending_verification / rejected never grant restricted access (ADR-038).
 */
export function isRelationshipActiveAt(
  relationship: PropertyPersonRelationship,
  at: string = new Date().toISOString(),
): boolean {
  if (relationship.status !== "active") return false;
  const t = toTime(at) ?? Date.now();
  const from = toTime(relationship.validFrom);
  const to = toTime(relationship.validTo);
  if (from !== null && t < from) return false;
  if (to !== null && t > to) return false;
  return true;
}

/** Alias emphasizing verification gate for product language. */
export function isVerifiedResidencyActiveAt(
  relationship: PropertyPersonRelationship,
  at?: string,
): boolean {
  return isRelationshipActiveAt(relationship, at);
}

/**
 * Derives Community Area ids from active verified residencies for a Person.
 * Do not read area access lists from Person/User entities.
 * Pending claims contribute nothing.
 */
export function deriveCommunityAreaIdsFromResidencies(
  personId: DomainId,
  context: ResidencyDerivationContext,
): DomainId[] {
  return resolveResidencyAccessAreas(personId, context).communityAreaIds;
}

/**
 * Builds ADR-036 actor.communityAreaIds from verified active residencies only.
 */
export function resolveResidencyAccessAreas(
  personId: DomainId,
  context: ResidencyDerivationContext,
): { communityAreaIds: DomainId[]; activeRelationshipIds: DomainId[] } {
  const roles =
    context.eligibilityRoles ?? DEFAULT_RESIDENCY_ELIGIBILITY_ROLES;
  const at = context.at ?? new Date().toISOString();
  const areas = new Set<DomainId>();
  const activeRelationshipIds: DomainId[] = [];

  for (const rel of context.relationships) {
    if (rel.personId !== personId) continue;
    if (!roles.has(rel.relationshipType)) continue;
    if (!isVerifiedResidencyActiveAt(rel, at)) continue;
    activeRelationshipIds.push(rel.id);

    const property = context.propertiesById.get(rel.propertyId);
    if (!property) continue;
    const address = context.addressesById.get(property.addressId);
    if (address?.communityAreaId) areas.add(address.communityAreaId);
  }

  return { communityAreaIds: [...areas], activeRelationshipIds };
}

/**
 * True when the Person has at least one active verified residency
 * in the given Community Area (for private channels / restricted resources).
 */
export function hasVerifiedResidencyInArea(
  personId: DomainId,
  communityAreaId: DomainId,
  context: ResidencyDerivationContext,
): boolean {
  return deriveCommunityAreaIdsFromResidencies(personId, context).includes(
    communityAreaId,
  );
}
