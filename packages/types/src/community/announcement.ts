/**
 * Structured community announcements — territorial actions, not social posts.
 */

import type { CommunityPost } from "../domain/community-core";
import type { TerritoryAnnouncement } from "./operations";

export const COMMUNITY_ANNOUNCEMENT_CATEGORIES = [
  "official",
  "maintenance",
  "security",
  "event",
  "community",
  "emergency",
  "business",
] as const;

export type CommunityAnnouncementCategory =
  (typeof COMMUNITY_ANNOUNCEMENT_CATEGORIES)[number];

export const COMMUNITY_ANNOUNCEMENT_PRIORITIES = [
  "normal",
  "important",
  "urgent",
] as const;

export type CommunityAnnouncementPriority =
  (typeof COMMUNITY_ANNOUNCEMENT_PRIORITIES)[number];

export const COMMUNITY_ANNOUNCEMENT_AUDIENCES = [
  "territory",
  "zone",
  "place",
  "group",
] as const;

export type CommunityAnnouncementAudience =
  (typeof COMMUNITY_ANNOUNCEMENT_AUDIENCES)[number];

export type CommunityAnnouncementMeta = {
  category: CommunityAnnouncementCategory;
  priority: CommunityAnnouncementPriority;
  audience: CommunityAnnouncementAudience;
  locationId?: string;
  startsAt?: string;
  endsAt?: string;
  requiresAcknowledgement?: boolean;
};

export function communityAnnouncementCategoryLabel(
  category: CommunityAnnouncementCategory,
): string {
  switch (category) {
    case "official":
      return "Oficial";
    case "maintenance":
      return "Mantenimiento";
    case "security":
      return "Seguridad";
    case "event":
      return "Evento";
    case "community":
      return "Comunidad";
    case "emergency":
      return "Emergencia";
    case "business":
      return "Negocio";
  }
}

export function isOfficialAnnouncementCategory(
  category: CommunityAnnouncementCategory,
): boolean {
  return category === "official" || category === "emergency";
}

export function announcementMetaFromPost(
  post: Pick<CommunityPost, "announcementMeta">,
): CommunityAnnouncementMeta | undefined {
  return post.announcementMeta;
}

export function projectStructuredAnnouncement(
  post: Pick<
    CommunityPost,
    | "id"
    | "tenantId"
    | "territoryId"
    | "kind"
    | "title"
    | "body"
    | "createdAt"
    | "createdBy"
    | "announcementMeta"
  >,
): TerritoryAnnouncement | null {
  if (post.kind !== "announcement") return null;
  const territoryId = post.territoryId?.trim();
  if (!territoryId) return null;
  const meta = post.announcementMeta;
  return {
    id: post.id,
    tenantId: post.tenantId,
    territoryId,
    title: post.title,
    body: post.body,
    createdAt: post.createdAt,
    createdBy: post.createdBy,
    category: meta?.category ?? "community",
    priority: meta?.priority ?? "normal",
    audience: meta?.audience ?? "territory",
    locationId: meta?.locationId,
    startsAt: meta?.startsAt,
    endsAt: meta?.endsAt,
    requiresAcknowledgement: meta?.requiresAcknowledgement ?? false,
  };
}
