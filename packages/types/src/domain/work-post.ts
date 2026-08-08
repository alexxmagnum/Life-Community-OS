import type { DomainId, IsoDateTimeString } from "./ids";

/**
 * Community job board post (conceptual foundation).
 *
 * Distinct from:
 * - LocalEntity kind "service" (trusted professionals)
 * - MarketplaceListing (goods exchange)
 * - Neighbour-help marketplace give/request (non-professional help)
 *
 * No database migration in this slice — tenant catalogs + session overlay.
 */

/** looking_for_work = Busco trabajo; offering_work = Ofrezco trabajo */
export type WorkPostType = "looking_for_work" | "offering_work";

export type WorkPostCategory =
  | "gardening"
  | "maintenance"
  | "lessons"
  | "cleaning"
  | "transport"
  | "other";

export type WorkPostStatus = "open" | "matched" | "closed" | "withdrawn";

/**
 * Job announcement authored by a neighbour.
 * createdByPersonId joins the existing Person identity model.
 */
export type WorkPost = {
  id: DomainId;
  type: WorkPostType;
  title: string;
  description: string;
  category: WorkPostCategory;
  /** Free-text availability, e.g. "Fines de semana" / "Por las mañanas". */
  availability?: string;
  /** Soft location label within the territory — not GPS. */
  location?: string;
  createdByPersonId: DomainId;
  createdAt: IsoDateTimeString;
  /** Lifecycle for board filtering — open by default on publish. */
  status: WorkPostStatus;
};
