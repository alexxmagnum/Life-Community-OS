/**
 * Community Groups — ADR-029 demo catalog (extended for Channel sponsorship).
 */

import {
  DEMO_AREA_ALDEA_GOLF,
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
      "https://images.unsplash.com/photo-1626224582411-c8120bdb77e2?auto=format&fit=crop&w=800&q=80",
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
    name: "Golf Panoramica",
    description: "Recurring golf outings and course tips.",
    memberCount: 34,
    imageUrl:
      "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?auto=format&fit=crop&w=800&q=80",
    areaLabel: "Panoramica Golf",
    categoryLabel: "Sport",
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

export function listGroups(): CommunityGroup[] {
  return groupCatalog;
}

export function getGroupById(id: string): CommunityGroup | undefined {
  return groupCatalog.find((g) => g.id === id);
}
