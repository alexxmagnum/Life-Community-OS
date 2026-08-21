/**
 * Map tenant-pack catalogs into Resource records for local fixtures only.
 * Pack files stay the source of seed copy; they are not a runtime fallback.
 */

import {
  createBookableResourceRecord,
  isResourceCategory,
  resourceCategoryFromType,
  type CommunityResource,
  type ResourceCategory,
  type ResourceType,
} from "@life-community-os/types";

type PackResource = {
  id?: string;
  name?: string;
  description?: string;
  imageUrl?: string;
  location?: string;
  areaLabel?: string;
  type?: string;
  rules?: string[];
  slotMinutes?: number;
  capacity?: number;
  requiresApproval?: boolean;
  status?: string;
};

type PackExperience = {
  id?: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  location?: string;
  areaLabel?: string;
  startsAt?: string;
  endsAt?: string;
  capacity?: number;
  resourceId?: string;
  organizer?: { name?: string };
};

function asType(value: string | undefined): ResourceType {
  if (
    value === "sports_facility" ||
    value === "space" ||
    value === "amenity" ||
    value === "equipment" ||
    value === "vehicle" ||
    value === "custom"
  ) {
    return value;
  }
  return "custom";
}

export function resourceFromPackItem(
  tenantId: string,
  item: PackResource,
): CommunityResource | null {
  if (!item.id || !item.name || !item.description) return null;
  const type = asType(item.type);
  return createBookableResourceRecord({
    id: item.id,
    tenantId,
    createdBy: "system-seed",
    name: item.name,
    description: item.description,
    category: resourceCategoryFromType(type),
    type,
    location: item.location,
    areaLabel: item.areaLabel,
    images: item.imageUrl ? [item.imageUrl] : [],
    bookingRules: item.rules,
    slotMinutes: item.slotMinutes,
    capacity: item.capacity,
    requiresApproval: item.requiresApproval,
    status: "active",
  });
}

export function activityFromPackExperience(
  tenantId: string,
  item: PackExperience,
): CommunityResource | null {
  if (!item.id || !item.title || !item.description) return null;
  return createBookableResourceRecord({
    id: item.id,
    tenantId,
    createdBy: "system-seed",
    name: item.title,
    description: item.description,
    category: "activity",
    location: item.location,
    areaLabel: item.areaLabel,
    images: item.imageUrl ? [item.imageUrl] : [],
    capacity: item.capacity ?? 8,
    linkedResourceId: item.resourceId,
    scheduleStartsAt: item.startsAt,
    scheduleEndsAt: item.endsAt,
    organizerName: item.organizer?.name,
    status: "active",
  });
}

export function parseCategory(value: unknown): ResourceCategory | null {
  if (typeof value !== "string") return null;
  return isResourceCategory(value) ? value : null;
}
