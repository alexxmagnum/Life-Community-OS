/**
 * Life Panoramica — Housing content operations (no new domain entities).
 *
 * Composes existing Core lifecycle + capabilities + this tenant's activation.
 * Not a CRM, agency portal, payments, or UI panel.
 */

import type {
  HousingActionActor,
  HousingContentSource,
  HousingListing,
  HousingListingStatus,
  HousingListingType,
  HousingPublisherKind,
} from "@life-community-os/types";
import {
  canCreateAsHousingPublisher,
  canPerformHousingListingAction,
  housingCategoryEnabled,
  housingInitialCreateStatus,
  housingModerationRequired,
} from "@life-community-os/types";

import {
  isHousingContentSourceAllowedForLifePanoramica,
  lifePanoramicaHousingActivation,
  lifePanoramicaHousingModuleConfig,
} from "./housing";

/** Operational intents for Housing content on this tenant. */
export type HousingContentOperation =
  | "create_tenant_managed"
  | "create_resident"
  | "create_professional"
  | "edit_own"
  | "submit_for_review"
  | "approve_publish"
  | "reject_to_draft"
  | "review_pending";

export type HousingCreatePlan = {
  ok: true;
  operation: Extract<
    HousingContentOperation,
    "create_tenant_managed" | "create_resident" | "create_professional"
  >;
  contentSource: HousingContentSource;
  publisherKind: HousingPublisherKind;
  /** Initial listing status — respects moderation + manager path. */
  status: Extract<HousingListingStatus, "draft" | "pending_review" | "published">;
};

export type HousingCreatePlanDenied = {
  ok: false;
  operation: HousingContentOperation;
  reason: string;
};

/**
 * Whether an actor may run a content operation (capability + tenant rules).
 * Listing-scoped ops also need a listing context via `canPerform…` helpers.
 */
export function canRunHousingContentOperation(
  actor: HousingActionActor,
  operation: HousingContentOperation,
): boolean {
  if (!actor.moduleEnabled) return false;
  if (actor.config !== lifePanoramicaHousingModuleConfig) {
    // Still evaluate against actor.config (runtime TenantConfiguration).
  }

  switch (operation) {
    case "create_tenant_managed":
      return (
        actor.caps.manage &&
        isHousingContentSourceAllowedForLifePanoramica("tenant_managed")
      );
    case "create_resident":
      return (
        canCreateAsHousingPublisher(actor, "resident") &&
        isHousingContentSourceAllowedForLifePanoramica("resident_created")
      );
    case "create_professional":
      return (
        canCreateAsHousingPublisher(actor, "professional") &&
        isHousingContentSourceAllowedForLifePanoramica("professional_created")
      );
    case "edit_own":
      return actor.caps.editOwnListing || actor.caps.publisher || actor.caps.manage;
    case "submit_for_review":
      return (
        housingModerationRequired(actor.config) &&
        (actor.caps.editOwnListing || actor.caps.publisher || actor.caps.manage)
      );
    case "approve_publish":
    case "reject_to_draft":
    case "review_pending":
      return actor.caps.manage;
    default:
      return false;
  }
}

/**
 * Plan a create — content source, publisher path, initial status.
 * Does not persist; callers use existing createHousingListing + lifecycle.
 */
export function planHousingListingCreate(
  actor: HousingActionActor,
  path: "tenant_managed" | "resident" | "professional",
  type: HousingListingType,
): HousingCreatePlan | HousingCreatePlanDenied {
  const operation =
    path === "tenant_managed"
      ? "create_tenant_managed"
      : path === "resident"
        ? "create_resident"
        : "create_professional";

  if (!canRunHousingContentOperation(actor, operation)) {
    return {
      ok: false,
      operation,
      reason: denyReason(actor, operation),
    };
  }

  if (!housingCategoryEnabled(actor.config, type)) {
    return {
      ok: false,
      operation,
      reason: "Esta categoría no está habilitada en el tenant.",
    };
  }

  if (path === "tenant_managed") {
    const contentSource: HousingContentSource = "tenant_managed";
    // Managers create stewarded content as published; others never reach here.
    const status: HousingCreatePlan["status"] = actor.caps.manage
      ? "published"
      : housingInitialCreateStatus(actor.config);
    return {
      ok: true,
      operation: "create_tenant_managed",
      contentSource,
      publisherKind: "resident",
      status,
    };
  }

  if (path === "resident") {
    return {
      ok: true,
      operation: "create_resident",
      contentSource: "resident_created",
      publisherKind: "resident",
      status: housingInitialCreateStatus(actor.config),
    };
  }

  return {
    ok: true,
    operation: "create_professional",
    contentSource: "professional_created",
    publisherKind: "professional",
    status: housingInitialCreateStatus(actor.config),
  };
}

function denyReason(
  actor: HousingActionActor,
  operation: HousingContentOperation,
): string {
  if (!actor.moduleEnabled) return "El módulo Housing no está activo.";
  if (operation === "create_professional") {
    if (!actor.config.publishing.professionalsEnabled) {
      return "Este tenant no permite publicadores profesionales.";
    }
    if (!actor.caps.publisher) {
      return "Falta la capability housing.publisher.";
    }
    if (
      actor.config.publishing.professionalApprovalRequired &&
      !actor.professionalProfile
    ) {
      return "Se requiere perfil de publicador profesional aprobado.";
    }
    if (
      actor.professionalProfile &&
      actor.config.publishing.professionalApprovalRequired &&
      actor.professionalProfile.approvalStatus !== "approved"
    ) {
      return "El publicador profesional no está aprobado por el tenant.";
    }
    return "No puedes crear anuncios profesionales con tu cuenta actual.";
  }
  if (operation === "create_tenant_managed") {
    return "Solo gestores del tenant pueden crear anuncios tenant_managed.";
  }
  if (operation === "create_resident") {
    return "No puedes crear anuncios como residente con tu cuenta actual.";
  }
  return "Operación no permitida.";
}

/** Pending review queue — manager only. */
export function listHousingListingsPendingReview(
  actor: HousingActionActor,
  listings: readonly HousingListing[],
): HousingListing[] {
  if (!canRunHousingContentOperation(actor, "review_pending")) return [];
  return listings.filter((listing) => listing.status === "pending_review");
}

/** Whether manager may approve this listing. */
export function canApproveHousingListing(
  actor: HousingActionActor,
  listing: HousingListing,
): boolean {
  return canPerformHousingListingAction({ actor, listing }, "approve_publish");
}

/** Whether manager may reject this listing back to draft. */
export function canRejectHousingListing(
  actor: HousingActionActor,
  listing: HousingListing,
): boolean {
  return canPerformHousingListingAction({ actor, listing }, "reject_to_draft");
}

/** Whether owner/publisher may submit draft for review. */
export function canSubmitHousingListingForReview(
  actor: HousingActionActor,
  listing: HousingListing,
): boolean {
  return canPerformHousingListingAction(
    { actor, listing },
    "submit_for_review",
  );
}

/** Whether actor may edit this listing (own / manage). */
export function canEditHousingListing(
  actor: HousingActionActor,
  listing: HousingListing,
): boolean {
  return canPerformHousingListingAction({ actor, listing }, "edit");
}

/**
 * Sanity checks for Life Panoramica activation vs Core rules.
 * Pure — useful for pack validation / tests without UI.
 */
export function assertLifePanoramicaHousingOperationsReady(): {
  ok: boolean;
  checks: Record<string, boolean>;
} {
  const config = lifePanoramicaHousingActivation.moduleConfig;
  const checks = {
    moderationRequired: config.publishing.moderationRequired === true,
    residentsEnabled: config.publishing.residentsEnabled === true,
    professionalsEnabled: config.publishing.professionalsEnabled === true,
    professionalApprovalRequired:
      config.publishing.professionalApprovalRequired === true,
    allowsResidentCreated: isHousingContentSourceAllowedForLifePanoramica(
      "resident_created",
    ),
    allowsProfessionalCreated: isHousingContentSourceAllowedForLifePanoramica(
      "professional_created",
    ),
    allowsTenantManaged: isHousingContentSourceAllowedForLifePanoramica(
      "tenant_managed",
    ),
    disallowsPlatformDemo: !isHousingContentSourceAllowedForLifePanoramica(
      "platform_demo",
    ),
  };
  return {
    ok: Object.values(checks).every(Boolean),
    checks,
  };
}
