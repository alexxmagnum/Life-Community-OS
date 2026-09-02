/**
 * Business lifecycle — trusted local economy presence.
 *
 * Product phases map to persisted statuses:
 *   DRAFT      → draft
 *   SUBMITTED  → pending_review (owner submitted)
 *   REVIEWING  → pending_review (admin queue)
 *   PUBLISHED  → published
 *   SUSPENDED  → suspended
 */

import type { BusinessProfileStatus } from "./business-profile";

export type BusinessLifecyclePhase =
  | "draft"
  | "submitted"
  | "reviewing"
  | "published"
  | "suspended";

export function businessLifecyclePhase(
  status: BusinessProfileStatus,
): BusinessLifecyclePhase {
  switch (status) {
    case "draft":
      return "draft";
    case "pending_review":
      return "submitted";
    case "published":
      return "published";
    case "suspended":
      return "suspended";
    case "archived":
      return "draft";
    default:
      return "draft";
  }
}

/** Owner/admin-facing lifecycle label (Spanish product copy). */
export function businessLifecycleLabel(status: BusinessProfileStatus): string {
  switch (status) {
    case "draft":
      return "Borrador";
    case "pending_review":
      return "Pendiente de revisión";
    case "published":
      return "Visible en la comunidad";
    case "suspended":
      return "Temporalmente oculto";
    case "archived":
      return "Archivado";
    default:
      return status;
  }
}

/** Clear owner guidance — no uncertainty about visibility. */
export function businessOwnerStatusMessage(
  status: BusinessProfileStatus,
): string {
  switch (status) {
    case "draft":
      return "Tu negocio está en borrador. Completa la información y solicita presencia en la comunidad.";
    case "pending_review":
      return "Tu negocio está pendiente de revisión. Te avisaremos cuando sea visible en LIFE.";
    case "published":
      return "Tu negocio ya está visible en LIFE.";
    case "suspended":
      return "Tu negocio está temporalmente oculto. Contacta con la administración.";
    case "archived":
      return "Este negocio ya no está activo.";
    default:
      return "";
  }
}

/** Discover, Services and public map — published only. */
export function isBusinessPubliclyDiscoverable(
  status: BusinessProfileStatus,
): boolean {
  return status === "published";
}

export function canOwnerSubmitBusinessForReview(
  status: BusinessProfileStatus,
): boolean {
  return status === "draft";
}

export function canAdminApproveBusiness(
  status: BusinessProfileStatus,
): boolean {
  return status === "pending_review";
}

export function canAdminRejectBusiness(
  status: BusinessProfileStatus,
): boolean {
  return status === "pending_review";
}
