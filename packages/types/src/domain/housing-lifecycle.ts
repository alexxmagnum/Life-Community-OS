import type { DomainId } from "./ids";
import type {
  HousingListing,
  HousingListingStatus,
  HousingPublisherKind,
  HousingTenantModuleConfig,
} from "./housing";
import {
  housingCategoryEnabled,
  housingListingPublisherKind,
  housingModerationRequired,
  isHousingListingOwnerPerson,
  isHousingListingPubliclyVisible,
} from "./housing";

/**
 * Housing listing lifecycle & action rules (platform, tenant-neutral).
 *
 * Publishing model (two paths only):
 * - Resident owner → housing.create_own_listing / housing.edit_own_listing
 * - Authorized professional → housing.publisher
 * - Tenant manager → housing.manage (review / approve / hide / close)
 *
 * AuthZ inputs are capability booleans (ADR-012). This module does not grant
 * Permissions; callers resolve caps via existing RBAC (demo roles / future RBAC).
 *
 * Product role aliases (no new platform roles):
 * - Resident owner   → member (+ create_own / edit_own when tenant allows)
 * - Professional     → authorized actor with housing.publisher
 * - Tenant Manager   → moderator | administrator (+ housing.manage)
 */

// ── Phases ↔ status ──────────────────────────────────────────

export type HousingLifecyclePhase =
  | "creation"
  | "review"
  | "publication"
  | "reservation"
  | "closure"
  | "archive";

export const HOUSING_STATUS_TO_PHASE: Record<
  HousingListingStatus,
  HousingLifecyclePhase
> = {
  draft: "creation",
  pending_review: "review",
  published: "publication",
  reserved: "reservation",
  closed: "closure",
  archived: "archive",
};

/** Allowed status transitions (domain graph). */
export const HOUSING_STATUS_TRANSITIONS: Record<
  HousingListingStatus,
  readonly HousingListingStatus[]
> = {
  draft: ["pending_review", "published", "archived"],
  pending_review: ["published", "draft", "archived"],
  published: ["reserved", "closed", "archived"],
  reserved: ["published", "closed", "archived"],
  closed: ["archived", "draft"],
  archived: ["draft"],
};

// ── Actions ──────────────────────────────────────────────────

export type HousingListingAction =
  | "view"
  | "edit"
  | "submit_for_review"
  | "publish"
  | "approve_publish"
  | "reject_to_draft"
  | "mark_reserved"
  | "unreserve"
  | "close"
  | "archive"
  | "reopen_to_draft"
  | "contact"
  | "save";

/** Capability bag resolved by the host (TenantProvider / RBAC). */
export type HousingCapabilityBag = {
  view: boolean;
  /** Resident owner — create own listing. */
  createOwnListing: boolean;
  /** Resident owner — edit own listing. */
  editOwnListing: boolean;
  /** Authorized agency / promoter — create & manage own professional listings. */
  publisher: boolean;
  contact: boolean;
  save: boolean;
  manage: boolean;
};

export type HousingActionActor = {
  personId: DomainId;
  /** Module enablement (TenantConfiguration / feature flag). */
  moduleEnabled: boolean;
  caps: HousingCapabilityBag;
  config: HousingTenantModuleConfig;
};

export type HousingActionContext = {
  actor: HousingActionActor;
  listing: HousingListing;
};

function isOwner(ctx: HousingActionContext): boolean {
  return isHousingListingOwnerPerson(ctx.listing, ctx.actor.personId);
}

function canModerate(ctx: HousingActionContext): boolean {
  return ctx.actor.caps.manage;
}

function canEditOwnListing(ctx: HousingActionContext): boolean {
  if (!isOwner(ctx)) return false;
  const kind = housingListingPublisherKind(ctx.listing);
  if (kind === "professional") {
    return ctx.actor.caps.publisher || ctx.actor.caps.editOwnListing;
  }
  return ctx.actor.caps.editOwnListing || ctx.actor.caps.publisher;
}

/** Whether the actor may create under a given publisher path. */
export function canCreateAsHousingPublisher(
  actor: HousingActionActor,
  kind: HousingPublisherKind,
): boolean {
  if (!actor.moduleEnabled) return false;
  if (actor.caps.manage) return true;
  if (kind === "resident") {
    return (
      actor.config.publishing.residentsEnabled && actor.caps.createOwnListing
    );
  }
  return (
    actor.config.publishing.professionalsEnabled && actor.caps.publisher
  );
}

function canOwnerPublishPath(ctx: HousingActionContext): boolean {
  if (canModerate(ctx)) return true;
  if (!isOwner(ctx)) return false;
  const kind = housingListingPublisherKind(ctx.listing);
  return canCreateAsHousingPublisher(ctx.actor, kind);
}

/** Whether the status edge exists in the domain graph. */
export function canTransitionHousingStatus(
  from: HousingListingStatus,
  to: HousingListingStatus,
): boolean {
  return HOUSING_STATUS_TRANSITIONS[from].includes(to);
}

/**
 * Per-status intent summary (who may enter / act).
 * Enforce with `listHousingListingActions` / `canPerformHousingListingAction`.
 */
export const HOUSING_LIFECYCLE_RULES: Record<
  HousingListingStatus,
  {
    phase: HousingLifecyclePhase;
    /** Who may typically enter this state. */
    enterBy: string;
    allowedActions: readonly HousingListingAction[];
    blockedActions: readonly HousingListingAction[];
  }
> = {
  draft: {
    phase: "creation",
    enterBy: "Owner/Publisher (create) or reopen from closed/archived",
    allowedActions: [
      "view",
      "edit",
      "submit_for_review",
      "publish",
      "archive",
    ],
    blockedActions: [
      "approve_publish",
      "reject_to_draft",
      "mark_reserved",
      "unreserve",
      "close",
      "contact",
      "save",
    ],
  },
  pending_review: {
    phase: "review",
    enterBy: "Owner submit when tenant requires moderation",
    allowedActions: [
      "view",
      "approve_publish",
      "reject_to_draft",
      "archive",
    ],
    blockedActions: [
      "edit",
      "submit_for_review",
      "publish",
      "mark_reserved",
      "unreserve",
      "close",
      "contact",
      "save",
    ],
  },
  published: {
    phase: "publication",
    enterBy: "Owner publish (no moderation) or Manager approve",
    allowedActions: [
      "view",
      "edit",
      "mark_reserved",
      "close",
      "archive",
      "contact",
      "save",
    ],
    blockedActions: [
      "submit_for_review",
      "publish",
      "approve_publish",
      "reject_to_draft",
      "unreserve",
      "reopen_to_draft",
    ],
  },
  reserved: {
    phase: "reservation",
    enterBy: "Owner or Manager marks interest reserved",
    allowedActions: [
      "view",
      "edit",
      "unreserve",
      "close",
      "archive",
      "contact",
      "save",
    ],
    blockedActions: [
      "submit_for_review",
      "publish",
      "approve_publish",
      "reject_to_draft",
      "mark_reserved",
      "reopen_to_draft",
    ],
  },
  closed: {
    phase: "closure",
    enterBy: "Owner or Manager closes deal / withdraws offer",
    allowedActions: ["view", "archive", "reopen_to_draft"],
    blockedActions: [
      "edit",
      "submit_for_review",
      "publish",
      "approve_publish",
      "reject_to_draft",
      "mark_reserved",
      "unreserve",
      "close",
      "contact",
      "save",
    ],
  },
  archived: {
    phase: "archive",
    enterBy: "Owner or Manager archives listing",
    allowedActions: ["view", "reopen_to_draft"],
    blockedActions: [
      "edit",
      "submit_for_review",
      "publish",
      "approve_publish",
      "reject_to_draft",
      "mark_reserved",
      "unreserve",
      "close",
      "archive",
      "contact",
      "save",
    ],
  },
};

function actionAllowedInStatus(
  status: HousingListingStatus,
  action: HousingListingAction,
): boolean {
  const rules = HOUSING_LIFECYCLE_RULES[status];
  return rules.allowedActions.includes(action);
}

/**
 * Evaluate a single action for an actor on a listing.
 * Module must be enabled; category must be tenant-enabled for create/publish paths.
 */
export function canPerformHousingListingAction(
  ctx: HousingActionContext,
  action: HousingListingAction,
): boolean {
  const { actor, listing } = ctx;
  if (!actor.moduleEnabled) return false;
  if (!actor.caps.view && action === "view") return false;

  if (!actionAllowedInStatus(listing.status, action)) return false;

  switch (action) {
    case "view": {
      if (!actor.caps.view) return false;
      if (canModerate(ctx) || isOwner(ctx)) return true;
      return isHousingListingPubliclyVisible(listing);
    }
    case "edit": {
      if (canModerate(ctx)) return true;
      return canEditOwnListing(ctx);
    }
    case "submit_for_review": {
      if (!housingModerationRequired(actor.config)) return false;
      if (!canOwnerPublishPath(ctx)) return false;
      if (!housingCategoryEnabled(actor.config, listing.type)) return false;
      return listing.status === "draft";
    }
    case "publish": {
      // Direct publish only when moderation is not required.
      if (housingModerationRequired(actor.config)) return false;
      if (!canOwnerPublishPath(ctx)) return false;
      if (!housingCategoryEnabled(actor.config, listing.type)) return false;
      return listing.status === "draft";
    }
    case "approve_publish": {
      if (!canModerate(ctx)) return false;
      if (!housingCategoryEnabled(actor.config, listing.type)) return false;
      return listing.status === "pending_review";
    }
    case "reject_to_draft": {
      if (!canModerate(ctx)) return false;
      return listing.status === "pending_review";
    }
    case "mark_reserved": {
      if (canModerate(ctx)) return true;
      if (!canEditOwnListing(ctx)) return false;
      return listing.status === "published";
    }
    case "unreserve": {
      if (canModerate(ctx)) return true;
      if (!canEditOwnListing(ctx)) return false;
      return listing.status === "reserved";
    }
    case "close": {
      if (canModerate(ctx)) return true;
      if (!canEditOwnListing(ctx)) return false;
      return listing.status === "published" || listing.status === "reserved";
    }
    case "archive": {
      if (canModerate(ctx)) return true;
      if (!canEditOwnListing(ctx)) return false;
      return (
        listing.status === "draft" ||
        listing.status === "pending_review" ||
        listing.status === "published" ||
        listing.status === "reserved" ||
        listing.status === "closed"
      );
    }
    case "reopen_to_draft": {
      if (canModerate(ctx)) return true;
      if (!canEditOwnListing(ctx)) return false;
      return listing.status === "closed" || listing.status === "archived";
    }
    case "contact": {
      if (!actor.caps.contact) return false;
      if (isOwner(ctx)) return false;
      return isHousingListingPubliclyVisible(listing);
    }
    case "save": {
      if (!actor.caps.save) return false;
      return isHousingListingPubliclyVisible(listing) || canModerate(ctx);
    }
    default:
      return false;
  }
}

export function listHousingListingActions(
  ctx: HousingActionContext,
): HousingListingAction[] {
  const all: HousingListingAction[] = [
    "view",
    "edit",
    "submit_for_review",
    "publish",
    "approve_publish",
    "reject_to_draft",
    "mark_reserved",
    "unreserve",
    "close",
    "archive",
    "reopen_to_draft",
    "contact",
    "save",
  ];
  return all.filter((action) => canPerformHousingListingAction(ctx, action));
}

/** Target status implied by an action (when it mutates lifecycle). */
export function housingActionTargetStatus(
  action: HousingListingAction,
): HousingListingStatus | null {
  switch (action) {
    case "submit_for_review":
      return "pending_review";
    case "publish":
    case "approve_publish":
    case "unreserve":
      return "published";
    case "reject_to_draft":
    case "reopen_to_draft":
      return "draft";
    case "mark_reserved":
      return "reserved";
    case "close":
      return "closed";
    case "archive":
      return "archived";
    default:
      return null;
  }
}

/**
 * Whether creating a new listing is allowed for the actor
 * (module + caps + tenant publishing policy for either path).
 */
export function canCreateHousingListing(actor: HousingActionActor): boolean {
  if (!actor.moduleEnabled) return false;
  if (actor.config.enabledCategories.length === 0) return false;
  if (actor.caps.manage) return true;
  return (
    canCreateAsHousingPublisher(actor, "resident") ||
    canCreateAsHousingPublisher(actor, "professional")
  );
}

/** Preferred publisher kind when creating (resident first when both allowed). */
export function resolveHousingCreatePublisherKind(
  actor: HousingActionActor,
): HousingPublisherKind | null {
  if (canCreateAsHousingPublisher(actor, "resident")) return "resident";
  if (canCreateAsHousingPublisher(actor, "professional")) return "professional";
  if (actor.caps.manage) {
    if (actor.config.publishing.residentsEnabled) return "resident";
    if (actor.config.publishing.professionalsEnabled) return "professional";
  }
  return null;
}
