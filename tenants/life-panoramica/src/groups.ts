/**
 * Community Groups — ADR-029 demo catalog (extended for Channel sponsorship).
 * Memberships support Communication Layer group conversations (D.0.6.2).
 */

import type {
  CommunityGroup as DomainCommunityGroup,
  CommunityGroupType,
  GroupMembership,
} from "@life-community-os/types";
import {
  DEMO_AREA_ALDEA_GOLF,
  DEMO_PERSON_ANA,
  DEMO_PERSON_CARLOS,
  DEMO_PERSON_JOHN,
  DEMO_PERSON_LUCIA,
  DEMO_PERSON_MARTA,
  DEMO_TENANT_ID,
  DEMO_TERRITORY_ID,
} from "./demo-ids";

export type CommunityGroup = {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  imageUrl: string;
  areaLabel?: string;
  categoryLabel: string;
  tenantId?: string;
  territoryId?: string;
  communityAreaId?: string;
  ownerPersonId?: string;
  status?: "draft" | "active" | "archived";
  groupType?: string;
  sponsoredChannelId?: string;
};

export const groupCatalog: CommunityGroup[] = [
  {
    id: "g-padel",
    name: "Padel mornings",
    description: "Friendly weekday matches. All levels.",
    memberCount: 28,
    imageUrl:
      "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=800&q=80",
    areaLabel: "Panoramica Golf",
    categoryLabel: "Sport",
    tenantId: DEMO_TENANT_ID,
    territoryId: DEMO_TERRITORY_ID,
    ownerPersonId: DEMO_PERSON_MARTA,
    status: "active",
    groupType: "interest_circle",
    sponsoredChannelId: "ch-padel",
  },
  {
    id: "g-golf",
    name: "Golfistas Panoramica",
    description: "Salidas de golf, reservas de campo y tips entre vecinos.",
    memberCount: 34,
    imageUrl:
      "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?auto=format&fit=crop&w=800&q=80",
    areaLabel: "Panoramica Golf",
    categoryLabel: "Deporte",
    tenantId: DEMO_TENANT_ID,
    territoryId: DEMO_TERRITORY_ID,
    ownerPersonId: DEMO_PERSON_MARTA,
    status: "active",
    groupType: "activity_group",
    sponsoredChannelId: "ch-golf",
  },
  {
    id: "g-walk",
    name: "Walking circle",
    description: "Gentle sunset walks through pines and paths.",
    memberCount: 41,
    imageUrl:
      "https://images.unsplash.com/photo-1476610182048-b716b8518aae?auto=format&fit=crop&w=800&q=80",
    areaLabel: "Los pinos",
    categoryLabel: "Leisure",
    tenantId: DEMO_TENANT_ID,
    territoryId: DEMO_TERRITORY_ID,
    status: "active",
    groupType: "interest_circle",
  },
  {
    id: "g-parents",
    name: "Panoramica families",
    description: "Plans with kids, swaps, and neighbour support.",
    memberCount: 36,
    imageUrl:
      "https://images.unsplash.com/photo-1476703993599-0035a21b17a9?auto=format&fit=crop&w=800&q=80",
    categoryLabel: "Family",
    tenantId: DEMO_TENANT_ID,
    territoryId: DEMO_TERRITORY_ID,
    communityAreaId: DEMO_AREA_ALDEA_GOLF,
    status: "active",
    groupType: "interest_circle",
  },
  {
    id: "g-garden",
    name: "Gardens & allotments",
    description: "Watering tips, plants, and cutting swaps.",
    memberCount: 19,
    imageUrl:
      "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=800&q=80",
    areaLabel: "El pinar",
    categoryLabel: "Hobby",
    tenantId: DEMO_TENANT_ID,
    territoryId: DEMO_TERRITORY_ID,
    status: "active",
    groupType: "interest_circle",
  },
];

/** Demo memberships — owner / members for Communication adapter snapshots. */
const groupMembershipCatalog: GroupMembership[] = [
  {
    id: "gm-golf-marta",
    groupId: "g-golf",
    personId: DEMO_PERSON_MARTA,
    status: "active",
  },
  {
    id: "gm-golf-ana",
    groupId: "g-golf",
    personId: DEMO_PERSON_ANA,
    status: "active",
  },
  {
    id: "gm-golf-carlos",
    groupId: "g-golf",
    personId: DEMO_PERSON_CARLOS,
    status: "active",
  },
  {
    id: "gm-golf-john",
    groupId: "g-golf",
    personId: DEMO_PERSON_JOHN,
    status: "active",
  },
  {
    id: "gm-golf-lucia",
    groupId: "g-golf",
    personId: DEMO_PERSON_LUCIA,
    status: "active",
  },
  {
    id: "gm-padel-marta",
    groupId: "g-padel",
    personId: DEMO_PERSON_MARTA,
    status: "active",
  },
  {
    id: "gm-padel-ana",
    groupId: "g-padel",
    personId: DEMO_PERSON_ANA,
    status: "active",
  },
];

/** Moderators for adapter roles — not chat permissions. */
const groupModeratorIds: Record<string, string[]> = {
  "g-golf": [DEMO_PERSON_CARLOS],
  "g-padel": [DEMO_PERSON_ANA],
};

export function listGroups(): CommunityGroup[] {
  return groupCatalog;
}

export function getGroupById(id: string): CommunityGroup | undefined {
  return groupCatalog.find((g) => g.id === id);
}

export function listGroupMemberships(groupId: string): GroupMembership[] {
  return groupMembershipCatalog.filter((m) => m.groupId === groupId);
}

export function getGroupModeratorPersonIds(groupId: string): string[] {
  return [...(groupModeratorIds[groupId] ?? [])];
}

/**
 * Map tenant demo group → domain CommunityGroup for Communication adapters.
 */
const DOMAIN_GROUP_TYPES = new Set<string>([
  "interest_circle",
  "activity_group",
  "committee",
  "official_program",
  "custom",
]);

export function toDomainCommunityGroup(
  group: CommunityGroup,
): DomainCommunityGroup {
  const groupType: CommunityGroupType = DOMAIN_GROUP_TYPES.has(
    group.groupType ?? "",
  )
    ? (group.groupType as CommunityGroupType)
    : "interest_circle";

  return {
    id: group.id,
    tenantId: group.tenantId ?? DEMO_TENANT_ID,
    territoryId: group.territoryId ?? DEMO_TERRITORY_ID,
    name: group.name,
    description: group.description,
    imageUrl: group.imageUrl,
    categoryLabel: group.categoryLabel,
    groupType,
    status: group.status ?? "active",
    ownerPersonId: group.ownerPersonId ?? DEMO_PERSON_MARTA,
    communityAreaId: group.communityAreaId,
    sponsoredChannelId: group.sponsoredChannelId,
    memberCount: group.memberCount,
  };
}
