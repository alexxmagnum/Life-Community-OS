import type { DomainId, IsoDateTimeString } from "./ids";

/**
 * Housing / Living domain contracts (platform SaaS module).
 *
 * Distinct from:
 * - `Property` (ADR-007 residency unit at an Address)
 * - Neighbour marketplace goods exchange
 * - Community `Resource` reservations (shared amenities)
 *
 * Tenant-neutral — no Life Panoramica catalogs here.
 * Product surfaces live in the web app; this module owns contracts only.
 */

// ── Categories ───────────────────────────────────────────────

/** Commercial intent of a listing — all tenants may enable a subset. */
export type HousingListingType = "rent" | "sale" | "land" | "commercial";

export const HOUSING_LISTING_TYPES: readonly HousingListingType[] = [
  "rent",
  "sale",
  "land",
  "commercial",
] as const;

// ── Listing lifecycle ────────────────────────────────────────

export type HousingListingStatus =
  | "draft"
  | "pending_review"
  | "published"
  | "reserved"
  | "closed"
  | "archived";

/**
 * Who publishes the listing (SaaS publishing model).
 * Only two product paths — no anonymous / marketplace sellers.
 */
export type HousingPublisherKind = "resident" | "professional";

/**
 * Provenance of listing content — metadata on HousingListing, not a second model.
 * Does not replace ownership or AuthZ.
 */
export type HousingContentSource =
  | "platform_demo"
  | "tenant_managed"
  | "resident_created"
  | "professional_created";

export const HOUSING_CONTENT_SOURCES: readonly HousingContentSource[] = [
  "platform_demo",
  "tenant_managed",
  "resident_created",
  "professional_created",
] as const;

/**
 * Future agency / professional readiness (contracts only — not enforced yet).
 * Tenant approval + verification workflows land in a later slice.
 */
export type HousingPublisherApprovalStatus =
  | "none"
  | "pending"
  | "approved"
  | "revoked";

export type HousingPublisherVerificationStatus =
  | "unverified"
  | "pending"
  | "verified"
  | "rejected";

/**
 * Publisher representation attached to a listing (not a CRM / agency product).
 * Professional path may show agency, organization, or a public trade name.
 */
export type HousingPublisher = {
  kind: HousingPublisherKind;
  /** Acting person when known (resident owner or professional contact). */
  personId?: DomainId;
  /**
   * Soft link to durable `HousingPublisherProfile` when known.
   * Listing still carries a denormalized `publisher` projection.
   */
  publisherProfileId?: DomainId;
  /** Public-facing name for contact / cards. */
  displayName?: string;
  /**
   * Professional public label — agency, promoter, or organization name.
   * Display only; not a CRM account.
   */
  organizationName?: string;
  /** Soft org / business-profile id when available. */
  organizationId?: DomainId;
  /**
   * Tenant approval of this professional publisher.
   * Enforced when `publishing.professionalApprovalRequired`.
   */
  approvalStatus?: HousingPublisherApprovalStatus;
  /**
   * Publisher / agency verification state.
   * Enforced when `publishing.professionalVerificationRequired`.
   */
  verificationStatus?: HousingPublisherVerificationStatus;
};

/** Who stewards the listing (not residency Property ownership). */
export type HousingListingOwnerKind =
  | "person"
  | "business_profile"
  | "official_entity";

export type HousingListingOwnership = {
  ownerKind: HousingListingOwnerKind;
  /** Author / neighbour when ownerKind is person. */
  ownerPersonId?: DomainId;
  /** Business or official entity id when not person-owned. */
  ownerEntityId?: DomainId;
};

/** Catalog visibility while published — independent of AuthZ. */
export type HousingListingVisibility =
  | "territory"
  | "community_area"
  | "unlisted";

export type HousingListingPublication = {
  visibility: HousingListingVisibility;
  /** Soft area scope when visibility is community_area. */
  communityAreaId?: DomainId;
  publishedAt?: IsoDateTimeString;
  publishedByPersonId?: DomainId;
  /** When true, listing awaits moderation before public catalog. */
  requiresReview?: boolean;
};

// ── Property (physical offer) ────────────────────────────────

/**
 * Physical / spatial attributes of what is offered.
 * Not the residency `Property` aggregate — no Address ownership graph here.
 */
export type HousingProperty = {
  id: DomainId;
  /** Soft territory zone key or label (tenant-defined zones). */
  zoneKey?: string;
  areaLabel?: string;
  /** Human-readable location line — not a structured Address id. */
  addressLabel?: string;
  bedrooms?: number;
  bathrooms?: number;
  builtAreaM2?: number;
  landAreaM2?: number;
  floor?: number;
  /** Free-form amenities (pool, parking, …). */
  amenities?: readonly string[];
  /**
   * Extensible attributes without schema migration
   * (e.g. { orientation: "south", energyCert: "B" }).
   */
  attributes?: Readonly<Record<string, string | number | boolean>>;
};

// ── Media ────────────────────────────────────────────────────

export type HousingMediaKind = "image" | "floorplan" | "video" | "document";

export type HousingMedia = {
  id: DomainId;
  listingId: DomainId;
  kind: HousingMediaKind;
  url: string;
  alt?: string;
  /** Display order ascending (0 = first). */
  sortOrder: number;
};

// ── Listing aggregate ────────────────────────────────────────

/**
 * Canonical Housing listing — rent, sale, land, or commercial premises.
 */
export type HousingListing = {
  id: DomainId;
  tenantId: DomainId;
  territoryId?: DomainId;
  type: HousingListingType;
  status: HousingListingStatus;
  /**
   * Publishing path used at creation.
   * Prefer `publisher.kind` when `publisher` is present; this field remains for
   * compact checks and legacy rows.
   */
  publisherKind?: HousingPublisherKind;
  /**
   * Content provenance metadata — not a parallel listing aggregate.
   * Defaults via `housingListingContentSource`.
   */
  contentSource?: HousingContentSource;
  /** Publisher projection for display / future agency readiness. */
  publisher?: HousingPublisher;
  title: string;
  description: string;
  /** Major currency units (e.g. EUR). Payments out of scope. */
  priceAmount?: number;
  currency?: string;
  /** Price cadence for rent (display only, e.g. "month"). */
  pricePeriodLabel?: string;
  ownership: HousingListingOwnership;
  publication: HousingListingPublication;
  property: HousingProperty;
  media?: readonly HousingMedia[];
  /** Preferred contact person for ConversationExperience later. */
  contactPersonId?: DomainId;
  createdByPersonId: DomainId;
  createdAt?: IsoDateTimeString;
  updatedAt?: IsoDateTimeString;
};

// ── Contact intent ───────────────────────────────────────────

export type HousingContactIntentStatus =
  | "submitted"
  | "conversing"
  | "closed"
  | "withdrawn";

/**
 * Neighbour interest in a listing.
 * May later open ConversationExperience (`housing_listing` context) —
 * conversation id is optional until that path is wired.
 */
export type HousingContactIntent = {
  id: DomainId;
  tenantId: DomainId;
  listingId: DomainId;
  fromPersonId: DomainId;
  status: HousingContactIntentStatus;
  message?: string;
  /** Set when a contextual conversation is created (future). */
  conversationId?: DomainId;
  createdAt: IsoDateTimeString;
  updatedAt?: IsoDateTimeString;
};

// ── Tenant module configuration (no tenant catalogs) ─────────

/**
 * Who may publish under this tenant’s Housing module.
 * Capability checks still apply on top of these switches.
 */
export type HousingPublishingConfig = {
  /** Resident owners may publish own properties. */
  residentsEnabled: boolean;
  /** Authorized agencies / promoters may publish professionally. */
  professionalsEnabled: boolean;
  /** New listings enter pending_review before published. */
  moderationRequired: boolean;
  /**
   * Professional publishers need tenant approval before publishing.
   * When true, `HousingPublisherProfile.approvalStatus` must be `approved`.
   */
  professionalApprovalRequired: boolean;
  /**
   * Optional stricter bar — verificationStatus must be `verified`.
   * Independent of listing moderation.
   */
  professionalVerificationRequired: boolean;
};

/**
 * Declarative Housing knobs a tenant may set.
 * Stored/applied via TenantConfiguration — not hardcoded per tenant here.
 */
export type HousingTenantModuleConfig = {
  /** Subset of HOUSING_LISTING_TYPES this tenant offers. */
  enabledCategories: readonly HousingListingType[];
  publishing: HousingPublishingConfig;
  defaultCurrency?: string;
  /** Optional UI copy overrides (i18n keys or plain labels). */
  copy?: {
    moduleLabel?: string;
    rentLabel?: string;
    saleLabel?: string;
    landLabel?: string;
    commercialLabel?: string;
    contactCtaLabel?: string;
  };
  /** Tenant-defined zone keys/labels for filters (empty = no zone facet). */
  zones?: readonly { key: string; label: string }[];
};

/** Platform-neutral defaults — not Life Panoramica content. */
export const HOUSING_TENANT_MODULE_CONFIG_DEFAULTS: HousingTenantModuleConfig = {
  enabledCategories: HOUSING_LISTING_TYPES,
  publishing: {
    residentsEnabled: true,
    professionalsEnabled: true,
    moderationRequired: false,
    professionalApprovalRequired: false,
    professionalVerificationRequired: false,
  },
  defaultCurrency: "EUR",
};

// ── Helpers (no AuthZ engine — pure domain checks) ───────────

export function isHousingListingPubliclyVisible(
  listing: HousingListing,
): boolean {
  return (
    listing.status === "published" &&
    listing.publication.visibility !== "unlisted"
  );
}

export function isHousingListingOwnerPerson(
  listing: HousingListing,
  personId: DomainId,
): boolean {
  if (listing.ownership.ownerKind === "person") {
    return listing.ownership.ownerPersonId === personId;
  }
  return listing.createdByPersonId === personId;
}

export function housingCategoryEnabled(
  config: HousingTenantModuleConfig,
  type: HousingListingType,
): boolean {
  return config.enabledCategories.includes(type);
}

export function housingListingPublisherKind(
  listing: HousingListing,
): HousingPublisherKind {
  return listing.publisher?.kind ?? listing.publisherKind ?? "resident";
}

/**
 * Resolve content source metadata.
 * Infers from publisher path when `contentSource` is omitted (legacy rows).
 */
export function housingListingContentSource(
  listing: HousingListing,
): HousingContentSource {
  if (listing.contentSource) return listing.contentSource;
  return housingContentSourceForPublisherKind(
    housingListingPublisherKind(listing),
  );
}

/** Map publisher path → default content source (create-time helper). */
export function housingContentSourceForPublisherKind(
  kind: HousingPublisherKind,
): Extract<HousingContentSource, "resident_created" | "professional_created"> {
  return kind === "professional" ? "professional_created" : "resident_created";
}

/** Build a minimal publisher projection (no CRM). */
export function buildHousingPublisher(input: {
  kind: HousingPublisherKind;
  personId?: DomainId;
  displayName?: string;
  organizationName?: string;
  organizationId?: DomainId;
  publisherProfileId?: DomainId;
  /** Future readiness — optional, not enforced. */
  approvalStatus?: HousingPublisherApprovalStatus;
  verificationStatus?: HousingPublisherVerificationStatus;
}): HousingPublisher {
  return {
    kind: input.kind,
    personId: input.personId,
    displayName: input.displayName?.trim() || undefined,
    organizationName: input.organizationName?.trim() || undefined,
    organizationId: input.organizationId,
    publisherProfileId: input.publisherProfileId,
    approvalStatus: input.approvalStatus,
    verificationStatus: input.verificationStatus,
  };
}

export function housingModerationRequired(
  config: HousingTenantModuleConfig,
): boolean {
  return config.publishing.moderationRequired;
}

/** Initial status after create — respects tenant moderation policy. */
export function housingInitialCreateStatus(
  config: HousingTenantModuleConfig,
): Extract<HousingListingStatus, "pending_review" | "published"> {
  return housingModerationRequired(config) ? "pending_review" : "published";
}
