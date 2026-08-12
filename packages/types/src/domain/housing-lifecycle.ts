import type { DomainId } from "./ids";
import type {
  HousingListing,
  HousingListingStatus,
  HousingTenantModuleConfig,
} from "./housing";
import {
  housingCategoryEnabled,
  isHousingListingOwnerPerson,
  isHousingListingPubliclyVisible,
} from "./housing";

/**
 * Housing listing lifecycle & action rules (platform, tenant-neutral).
 *
 * Status values match `HousingListingStatus`. Product “phases” are labels for
 * the same states — no parallel state machine.
 *
 * AuthZ inputs are capability booleans (ADR-012). This module does not grant
 * Permissions; callers resolve caps via existing RBAC (demo roles / future RBAC).
 *
 * Product role aliases (no new platform roles):
 * - Resident         → member (+ housing.view / contact / save)
 * - Owner/Publisher  → member with create+edit on own listings
 * - Tenant Manager   → moderator | administrator (+ housing.manage)
 * - Platform Admin   → administrator (+ manageEnter / housing.manage)
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
  createListing: boolean;
  editListing: boolean;
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
      if (!actor.caps.editListing && !canModerate(ctx)) return false;
      return isOwner(ctx) || canModerate(ctx);
    }
    case "submit_for_review": {
      if (!actor.config.requireModerationBeforePublish) return false;
      if (!isOwner(ctx) || !actor.caps.editListing) return false;
      if (!housingCategoryEnabled(actor.config, listing.type)) return false;
      return listing.status === "draft";
    }
    case "publish": {
      // Direct publish only when moderation is not required.
      if (actor.config.requireModerationBeforePublish) return false;
      if (!actor.config.allowNeighbourPublish && !canModerate(ctx)) {
        return false;
      }
      if (!isOwner(ctx) && !canModerate(ctx)) return false;
      if (!actor.caps.createListing && !canModerate(ctx)) return false;
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
      if (!isOwner(ctx) && !canModerate(ctx)) return false;
      if (!actor.caps.editListing && !canModerate(ctx)) return false;
      return listing.status === "published";
    }
    case "unreserve": {
      if (!isOwner(ctx) && !canModerate(ctx)) return false;
      if (!actor.caps.editListing && !canModerate(ctx)) return false;
      return listing.status === "reserved";
    }
    case "close": {
      if (!isOwner(ctx) && !canModerate(ctx)) return false;
      if (!actor.caps.editListing && !canModerate(ctx)) return false;
      return listing.status === "published" || listing.status === "reserved";
    }
    case "archive": {
      if (!isOwner(ctx) && !canModerate(ctx)) return false;
      if (!actor.caps.editListing && !canModerate(ctx)) return false;
      return (
        listing.status === "draft" ||
        listing.status === "pending_review" ||
        listing.status === "published" ||
        listing.status === "reserved" ||
        listing.status === "closed"
      );
    }
    case "reopen_to_draft": {
      if (!isOwner(ctx) && !canModerate(ctx)) return false;
      if (!actor.caps.editListing && !canModerate(ctx)) return false;
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
 * Whether creating a new draft listing is allowed for the actor
 * (no listing yet — module + caps + tenant publish policy).
 */
export function canCreateHousingListing(actor: HousingActionActor): boolean {
  if (!actor.moduleEnabled) return false;
  if (!actor.caps.createListing && !actor.caps.manage) return false;
  if (!actor.config.allowNeighbourPublish && !actor.caps.manage) return false;
  return actor.config.enabledCategories.length > 0;
}
