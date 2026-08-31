import type { DomainId, IsoDateTimeString } from "../domain/ids";
import type { MediaReference } from "../platform/files";
import { CAPABILITIES } from "../platform/capabilities";
import {
  EMPTY_PRODUCT_CAPABILITIES,
  isProductCapabilityEnabled,
  type ProductCapabilityMap,
} from "../platform/tenant-contract";

/**
 * Community Experience Feed — read projection of existing domains.
 * Not a Source of Truth. Experience, Event, Reservation, Resource,
 * Business and Help remain authoritative.
 */

export const COMMUNITY_FEED_ITEM_TYPES = [
  "experience",
  "event",
  "reservation",
  "resource_activity",
  "business_activity",
  "community",
] as const;

export type CommunityFeedItemType = (typeof COMMUNITY_FEED_ITEM_TYPES)[number];

export const COMMUNITY_FEED_PRIMARY_ACTIONS = [
  "join",
  "reserve",
  "view",
  "contact",
] as const;

export type CommunityFeedPrimaryAction =
  (typeof COMMUNITY_FEED_PRIMARY_ACTIONS)[number];

export const COMMUNITY_FEED_RANK_BANDS = [
  "now",
  "next",
  "relevant",
  "popular",
] as const;

export type CommunityFeedRankBand = (typeof COMMUNITY_FEED_RANK_BANDS)[number];

export type CommunityFeedCapacity = {
  total: number;
  available: number;
};

export type CommunityFeedItemMetadata = {
  domain?: string;
  locationLabel?: string;
  imageUrl?: string;
  href?: string;
  occupied?: number;
};

export type CommunityFeedItem = {
  id: string;
  tenantId: DomainId;
  territoryId: DomainId;
  type: CommunityFeedItemType;
  title: string;
  description?: string;
  startsAt?: IsoDateTimeString;
  endsAt?: IsoDateTimeString;
  locationId?: DomainId;
  resourceId?: DomainId;
  experienceId?: DomainId;
  capacity?: CommunityFeedCapacity;
  actions: {
    primary: CommunityFeedPrimaryAction;
  };
  media?: MediaReference[];
  metadata?: CommunityFeedItemMetadata;
};

export type CommunityFeedResponse = {
  territoryId: string;
  items: CommunityFeedItem[];
};

export type CommunityExperienceFeedQuery = {
  tenantId: string;
  territoryId: string;
  productCapabilities?: ProductCapabilityMap;
  permissions?: readonly string[];
};

/** Discover reuses the same projection query — no duplicated ranking. */
export type DiscoverExperienceQuery = CommunityExperienceFeedQuery;

export type CommunityFeedLifeMapContext = {
  locationId: DomainId;
  title: string;
  type: CommunityFeedItemType;
  startsAt?: IsoDateTimeString;
};

const TYPE_SET: ReadonlySet<string> = new Set(COMMUNITY_FEED_ITEM_TYPES);
const ACTION_SET: ReadonlySet<string> = new Set(COMMUNITY_FEED_PRIMARY_ACTIONS);

export function isCommunityFeedItemType(
  value: string,
): value is CommunityFeedItemType {
  return TYPE_SET.has(value);
}

export function isCommunityFeedPrimaryAction(
  value: string,
): value is CommunityFeedPrimaryAction {
  return ACTION_SET.has(value);
}

export function discoverExperienceQuery(input: {
  tenantId: string;
  territoryId: string | null | undefined;
  productCapabilities?: ProductCapabilityMap;
  permissions?: readonly string[];
}): DiscoverExperienceQuery | null {
  const tenantId = input.tenantId.trim();
  const territoryId = input.territoryId?.trim() ?? "";
  if (!tenantId || !territoryId) return null;
  return {
    tenantId,
    territoryId,
    ...(input.productCapabilities
      ? { productCapabilities: input.productCapabilities }
      : {}),
    ...(input.permissions ? { permissions: input.permissions } : {}),
  };
}

export function primaryActionForFeedType(
  type: CommunityFeedItemType,
  options?: { contact?: boolean },
): CommunityFeedPrimaryAction {
  if (type === "community" && options?.contact) return "contact";
  if (options?.contact) return "contact";
  if (type === "experience" || type === "event") return "join";
  if (type === "reservation" || type === "resource_activity") return "reserve";
  if (type === "business_activity") return "view";
  return "view";
}

export function communityFeedPrimaryLabel(item: CommunityFeedItem): string {
  const action = item.actions.primary;
  if (action === "join") return item.type === "event" ? "Participar" : "Unirme";
  if (action === "reserve") return "Reservar";
  if (action === "contact") return "Contactar";
  return "Ver";
}

export function communityFeedItemHref(item: CommunityFeedItem): string {
  const fromMeta = item.metadata?.href?.trim();
  if (fromMeta) return fromMeta;
  if (item.type === "experience" && (item.experienceId || item.id)) {
    const id = item.experienceId ?? item.id.replace(/^experience:/, "");
    return `/experiences/${encodeURIComponent(id)}`;
  }
  if (
    (item.type === "reservation" || item.type === "resource_activity") &&
    item.resourceId
  ) {
    return `/resources/${encodeURIComponent(item.resourceId)}/reserve`;
  }
  if (item.type === "business_activity" && item.locationId) {
    return `/locations/${encodeURIComponent(item.locationId)}`;
  }
  if (item.metadata?.domain === "help") return "/help";
  return "/community";
}

export function feedSourceEnabled(
  type: CommunityFeedItemType,
  product: ProductCapabilityMap = EMPTY_PRODUCT_CAPABILITIES,
  permissions?: readonly string[],
): boolean {
  const productKey = productKeyForFeedType(type);
  if (!isProductCapabilityEnabled(product, productKey)) return false;
  if (!permissions) return true;
  const needed = authzForFeedType(type);
  if (!needed) return true;
  return permissions.includes(needed);
}

function productKeyForFeedType(
  type: CommunityFeedItemType,
): keyof ProductCapabilityMap {
  if (type === "experience") return "experiences";
  if (type === "event" || type === "community") return "community";
  if (type === "reservation") return "reservations";
  if (type === "resource_activity") return "resources";
  if (type === "business_activity") return "marketplace";
  return "community";
}

function authzForFeedType(type: CommunityFeedItemType): string | null {
  if (type === "experience") return CAPABILITIES.experienceView;
  if (type === "event") return CAPABILITIES.contentView;
  if (type === "reservation" || type === "resource_activity") {
    return CAPABILITIES.resourceView;
  }
  if (type === "business_activity") return CAPABILITIES.localView;
  if (type === "community") return CAPABILITIES.contentView;
  return null;
}

export function filterFeedItemsByCapabilities(
  items: readonly CommunityFeedItem[],
  product: ProductCapabilityMap,
  permissions?: readonly string[],
): CommunityFeedItem[] {
  return items.filter((item) => feedSourceEnabled(item.type, product, permissions));
}

function startMs(item: CommunityFeedItem): number {
  if (!item.startsAt) return Number.NaN;
  const value = Date.parse(item.startsAt);
  return Number.isFinite(value) ? value : Number.NaN;
}

function endMs(item: CommunityFeedItem): number {
  if (!item.endsAt) return Number.NaN;
  const value = Date.parse(item.endsAt);
  return Number.isFinite(value) ? value : Number.NaN;
}

export function occupancyRatio(item: CommunityFeedItem): number {
  if (!item.capacity || item.capacity.total <= 0) return 0;
  const taken = Math.max(0, item.capacity.total - item.capacity.available);
  return taken / item.capacity.total;
}

export function communityFeedRankBand(
  item: CommunityFeedItem,
  now = Date.now(),
): CommunityFeedRankBand {
  const start = startMs(item);
  const end = endMs(item);
  if (Number.isFinite(start)) {
    const stillOpen = !Number.isFinite(end) || end >= now;
    if (start <= now && stillOpen) return "now";
    if (start > now) return "next";
  }
  if (occupancyRatio(item) >= 0.5) return "popular";
  return "relevant";
}

const BAND_ORDER: Record<CommunityFeedRankBand, number> = {
  now: 0,
  next: 1,
  relevant: 2,
  popular: 3,
};

/**
 * Territory life order: now → next → relevant → popular.
 * Never sort by id, seed, or pack priority.
 */
export function sortCommunityFeedItems(
  items: readonly CommunityFeedItem[],
  now = Date.now(),
): CommunityFeedItem[] {
  return [...items].sort((left, right) => {
    const bandLeft = communityFeedRankBand(left, now);
    const bandRight = communityFeedRankBand(right, now);
    if (bandLeft !== bandRight) {
      return BAND_ORDER[bandLeft] - BAND_ORDER[bandRight];
    }
    const startLeft = startMs(left);
    const startRight = startMs(right);
    if (Number.isFinite(startLeft) && Number.isFinite(startRight) && startLeft !== startRight) {
      return startLeft - startRight;
    }
    const pop = occupancyRatio(right) - occupancyRatio(left);
    if (pop !== 0) return pop;
    return left.title.localeCompare(right.title, "es");
  });
}

export type ProjectExperienceFeedInput = {
  id: string;
  tenantId: string;
  territoryId: string;
  title: string;
  description: string;
  status: string;
  startsAt?: string;
  endsAt?: string;
  location?: string;
  locationId?: string;
  resourceId?: string;
  capacity?: number;
  occupied?: number;
  imageUrl?: string;
};

export function projectExperienceToFeedItem(
  input: ProjectExperienceFeedInput,
): CommunityFeedItem | null {
  if (input.status !== "published") return null;
  const tenantId = input.tenantId.trim();
  const territoryId = input.territoryId.trim();
  if (!tenantId || !territoryId) return null;
  const total = input.capacity && input.capacity > 0 ? input.capacity : undefined;
  const occupied = input.occupied ?? 0;
  const available =
    total !== undefined ? Math.max(0, total - occupied) : undefined;
  const locationLabel = input.location?.trim();
  return {
    id: `experience:${input.id}`,
    tenantId,
    territoryId,
    type: "experience",
    title: input.title.trim(),
    description: locationLabel || input.description.trim() || undefined,
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    locationId: input.locationId,
    resourceId: input.resourceId,
    experienceId: input.id,
    ...(total !== undefined && available !== undefined
      ? { capacity: { total, available } }
      : {}),
    actions: { primary: "join" },
    metadata: {
      domain: "experience",
      locationLabel,
      imageUrl: input.imageUrl,
      href: `/experiences/${encodeURIComponent(input.id)}`,
      occupied,
    },
  };
}

export type ProjectEventFeedInput = {
  id: string;
  tenantId: string;
  territoryId: string;
  title: string;
  description?: string;
  status: string;
  startsAt?: string;
  endsAt?: string;
  locationLabel?: string;
  locationId?: string;
  occupied?: number;
};

export function projectEventToFeedItem(
  input: ProjectEventFeedInput,
): CommunityFeedItem | null {
  if (input.status !== "published") return null;
  const tenantId = input.tenantId.trim();
  const territoryId = input.territoryId.trim();
  if (!tenantId || !territoryId) return null;
  return {
    id: `event:${input.id}`,
    tenantId,
    territoryId,
    type: "event",
    title: input.title.trim(),
    description: input.locationLabel?.trim() || input.description?.trim() || undefined,
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    locationId: input.locationId,
    actions: { primary: "join" },
    metadata: {
      domain: "event",
      locationLabel: input.locationLabel,
      href: "/community",
      occupied: input.occupied ?? 0,
    },
  };
}

export type ProjectResourceFeedInput = {
  id: string;
  tenantId: string;
  territoryId: string;
  name: string;
  description?: string;
  status: string;
  location?: string;
  locationId?: string;
  capacity?: number;
  available?: number;
  startsAt?: string;
  endsAt?: string;
  imageUrl?: string;
  asReservation?: boolean;
};

export function projectResourceToFeedItem(
  input: ProjectResourceFeedInput,
): CommunityFeedItem | null {
  if (input.status !== "active") return null;
  const tenantId = input.tenantId.trim();
  const territoryId = input.territoryId.trim();
  if (!tenantId || !territoryId) return null;
  const type: CommunityFeedItemType = input.asReservation
    ? "reservation"
    : "resource_activity";
  const total = input.capacity && input.capacity > 0 ? input.capacity : undefined;
  const available =
    total !== undefined
      ? Math.max(0, input.available ?? total)
      : undefined;
  if (input.asReservation && available !== undefined && available <= 0) {
    return null;
  }
  return {
    id: `${type}:${input.id}`,
    tenantId,
    territoryId,
    type,
    title: input.name.trim(),
    description: input.location?.trim() || input.description?.trim() || undefined,
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    locationId: input.locationId,
    resourceId: input.id,
    ...(total !== undefined && available !== undefined
      ? { capacity: { total, available } }
      : {}),
    actions: { primary: "reserve" },
    metadata: {
      domain: type,
      locationLabel: input.location,
      imageUrl: input.imageUrl,
      href: `/resources/${encodeURIComponent(input.id)}/reserve`,
    },
  };
}

export type ProjectBusinessFeedInput = {
  id: string;
  tenantId: string;
  territoryId: string;
  name: string;
  description?: string;
  status: string;
  locationId?: string;
  imageUrl?: string;
};

export function projectBusinessToFeedItem(
  input: ProjectBusinessFeedInput,
): CommunityFeedItem | null {
  if (input.status !== "published") return null;
  const tenantId = input.tenantId.trim();
  const territoryId = input.territoryId.trim();
  if (!tenantId || !territoryId) return null;
  return {
    id: `business_activity:${input.id}`,
    tenantId,
    territoryId,
    type: "business_activity",
    title: input.name.trim(),
    description: input.description?.trim() || undefined,
    locationId: input.locationId,
    actions: { primary: "view" },
    metadata: {
      domain: "business",
      imageUrl: input.imageUrl,
      href: input.locationId
        ? `/locations/${encodeURIComponent(input.locationId)}`
        : "/discover",
    },
  };
}

export type ProjectHelpFeedInput = {
  id: string;
  tenantId: string;
  territoryId: string;
  title: string;
  description?: string;
  status: string;
};

export function projectHelpToFeedItem(
  input: ProjectHelpFeedInput,
): CommunityFeedItem | null {
  if (input.status !== "open") return null;
  const tenantId = input.tenantId.trim();
  const territoryId = input.territoryId.trim();
  if (!tenantId || !territoryId) return null;
  return {
    id: `community:help:${input.id}`,
    tenantId,
    territoryId,
    type: "community",
    title: input.title.trim(),
    description: input.description?.trim() || undefined,
    actions: { primary: "contact" },
    metadata: {
      domain: "help",
      href: "/help",
    },
  };
}

export function lifeMapContextFromFeedItem(
  item: CommunityFeedItem,
): CommunityFeedLifeMapContext | null {
  const locationId = item.locationId?.trim();
  if (!locationId) return null;
  return {
    locationId,
    title: item.title,
    type: item.type,
    startsAt: item.startsAt,
  };
}

export function lifeMapContextsFromFeed(
  items: readonly CommunityFeedItem[],
): CommunityFeedLifeMapContext[] {
  const seen = new Set<string>();
  const result: CommunityFeedLifeMapContext[] = [];
  for (const item of items) {
    const context = lifeMapContextFromFeedItem(item);
    if (!context || seen.has(context.locationId)) continue;
    seen.add(context.locationId);
    result.push(context);
  }
  return result;
}
