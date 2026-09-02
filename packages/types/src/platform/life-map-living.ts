import type { CommunityFeedItem } from "../community/community-feed";
import {
  communityFeedItemHref,
  communityFeedPrimaryLabel,
} from "../community/community-feed";
import type { Location } from "../domain/location";
import type { LifeMapActionKind, LifeMapObject } from "../domain/life-map";
import type { TerritoryBounds } from "../domain/territory";
import type { TerritoryObject } from "../domain/life-map-territory-object";

/**
 * Life Map living Territory — read model over Territory + Location + Feed.
 * Not a Source of Truth. No map activity / marker / event entities.
 */

export const LIFE_MAP_LIVING_LOD = {
  landmarkMinZoom: 14.85,
  placesMinZoom: 16.45,
  detail3dMinZoom: 17.75,
} as const;

export type LifeMapLivingLodBand =
  | "territory"
  | "landmark"
  | "places"
  | "life";

export type LifeMapLocationView = {
  id: string;
  tenantId: string;
  /** Optional — Location may exist without Territory. */
  territoryId?: string;
  name: string;
  category: string;
  type: string;
  latitude: number;
  longitude: number;
  visibility: string;
  imageUrl?: string;
  address?: string;
  summary?: string;
  /** Aggregated participation — never person identities. */
  socialLabel?: string;
};

export type LifeMapContext = {
  territoryId: string;
  tenantId: string;
  bounds?: TerritoryBounds;
  locations: LifeMapLocationView[];
  activeFeedItems: CommunityFeedItem[];
  territoryObjects: TerritoryObject[];
};

export type LifeMapViewportBox = {
  north: number;
  south: number;
  east: number;
  west: number;
};

export type LifeMapQueryInput = {
  tenantId: string;
  territoryId: string;
  viewport?: LifeMapViewportBox;
  zoom?: number;
};

export type LifeMapQueryResult = {
  territory: {
    territoryId: string;
    tenantId: string;
    bounds?: TerritoryBounds;
  };
  objects: TerritoryObject[];
  locations: LifeMapLocationView[];
  feedItems: CommunityFeedItem[];
};

export type LifeMapPlaceSheetAction = {
  kind: "join" | "reserve" | "view" | "contact";
  label: string;
  href: string;
};

export type LifeMapPlaceSheet = {
  locationId: string;
  title: string;
  categoryHint: string;
  address?: string;
  imageUrl?: string;
  nowLabel?: string;
  availabilityLabel?: string;
  primary: LifeMapPlaceSheetAction;
  secondary?: LifeMapPlaceSheetAction;
  moreHref: string;
};

export function resolveLifeMapLivingLod(
  zoom: number,
): LifeMapLivingLodBand {
  if (zoom >= LIFE_MAP_LIVING_LOD.detail3dMinZoom) return "life";
  if (zoom >= LIFE_MAP_LIVING_LOD.placesMinZoom) return "places";
  if (zoom >= LIFE_MAP_LIVING_LOD.landmarkMinZoom) return "landmark";
  return "territory";
}

export function isLandmarkLocationType(type: string): boolean {
  return type === "facility" || type === "community-place";
}

export function locationVisibleAtLivingZoom(
  type: string,
  zoom: number | undefined,
): boolean {
  if (zoom == null || !Number.isFinite(zoom)) return true;
  const band = resolveLifeMapLivingLod(zoom);
  if (band === "territory") return false;
  if (band === "landmark") return isLandmarkLocationType(type);
  return true;
}

export function locationInViewport(
  latitude: number,
  longitude: number,
  viewport?: LifeMapViewportBox,
): boolean {
  if (!viewport) return true;
  return (
    latitude <= viewport.north &&
    latitude >= viewport.south &&
    longitude <= viewport.east &&
    longitude >= viewport.west
  );
}

export function projectLocationToLifeMapView(
  location: Location,
): LifeMapLocationView | null {
  const tenantId = location.tenantId.trim();
  const territoryId = location.territoryId?.trim() || undefined;
  // Location requires Tenant; Territory is optional (Location ≠ Territory).
  if (!tenantId) return null;
  if (location.visibility === "private") return null;
  if (
    !Number.isFinite(location.latitude) ||
    !Number.isFinite(location.longitude)
  ) {
    return null;
  }
  return {
    id: location.id,
    tenantId,
    ...(territoryId ? { territoryId } : {}),
    name: location.name,
    category: location.category,
    type: location.type,
    latitude: location.latitude,
    longitude: location.longitude,
    visibility: location.visibility,
    imageUrl: location.imageUrl,
    address: location.geocodeDisplayName ?? location.address,
    summary: location.summary,
  };
}

export function feedItemsForLocation(
  items: readonly CommunityFeedItem[],
  locationId: string,
): CommunityFeedItem[] {
  const id = locationId.trim();
  if (!id) return [];
  return items.filter((item) => item.locationId === id);
}

export function createLifeMapContext(input: {
  tenantId: string;
  territoryId: string;
  bounds?: TerritoryBounds;
  locations: readonly Location[];
  feedItems: readonly CommunityFeedItem[];
  territoryObjects: readonly TerritoryObject[];
}): LifeMapContext {
  const tenantId = input.tenantId.trim();
  const territoryId = input.territoryId.trim();
  const feedItems = input.feedItems.filter(
    (item) =>
      item.tenantId === tenantId && item.territoryId === territoryId,
  );
  const locations = input.locations.flatMap((location) => {
    const view = projectLocationToLifeMapView(location);
    if (!view) return [];
    if (view.tenantId !== tenantId) return [];
    // Unscoped locations (no Territory) remain visible in any Territory scope.
    if (view.territoryId && view.territoryId !== territoryId) return [];
    const live = feedItems.filter((item) => item.locationId === view.id);
    const participating = live.reduce((sum, item) => {
      const occupied = item.metadata?.occupied;
      if (typeof occupied === "number") return sum + occupied;
      if (item.capacity) {
        return sum + Math.max(0, item.capacity.total - item.capacity.available);
      }
      return sum;
    }, 0);
    const socialLabel =
      participating > 0
        ? participating === 1
          ? "1 persona participando"
          : `${participating} personas participando`
        : undefined;
    return [{ ...view, ...(socialLabel ? { socialLabel } : {}) }];
  });
  const territoryObjects = input.territoryObjects.filter(
    (object) =>
      object.tenantId === tenantId && object.territoryId === territoryId,
  );
  return {
    tenantId,
    territoryId,
    ...(input.bounds ? { bounds: input.bounds } : {}),
    locations,
    activeFeedItems: feedItems,
    territoryObjects,
  };
}

export function filterLifeMapContextForQuery(
  context: LifeMapContext,
  query: Pick<LifeMapQueryInput, "viewport" | "zoom">,
): { locations: LifeMapLocationView[]; feedItems: CommunityFeedItem[] } {
  const locations = context.locations.filter((location) => {
    if (!locationVisibleAtLivingZoom(location.type, query.zoom)) return false;
    return locationInViewport(
      location.latitude,
      location.longitude,
      query.viewport,
    );
  });
  const visibleIds = new Set(locations.map((item) => item.id));
  const feedItems =
    query.zoom != null && resolveLifeMapLivingLod(query.zoom) === "territory"
      ? []
      : context.activeFeedItems.filter(
          (item) => !item.locationId || visibleIds.has(item.locationId),
        );
  return { locations, feedItems };
}

export function lifeMapFocusHref(locationId: string): string {
  return `/map?focus=${encodeURIComponent(locationId.trim())}`;
}

export function lifeMapHrefForFeedItem(item: CommunityFeedItem): string {
  const locationId = item.locationId?.trim();
  if (locationId) return lifeMapFocusHref(locationId);
  return communityFeedItemHref(item);
}

export function lifeMapActionFromFeed(
  item: CommunityFeedItem,
): LifeMapActionKind {
  if (item.actions.primary === "join") return "join";
  if (item.actions.primary === "reserve") return "reserve";
  if (item.actions.primary === "contact") return "message";
  return "open";
}

export function applyFeedLifeToMapObject(
  object: LifeMapObject,
  items: readonly CommunityFeedItem[],
): LifeMapObject {
  const locationId = object.ref?.entityId ?? object.objectId;
  const live = feedItemsForLocation(items, locationId);
  if (live.length === 0) return object;
  const lead = live[0]!;
  const action = lifeMapActionFromFeed(lead);
  const actions = new Set<LifeMapActionKind>([
    action,
    ...object.availableActions,
  ]);
  if (!actions.has("navigate")) actions.add("navigate");
  return {
    ...object,
    state: "active",
    availableActions: [...actions],
    label: object.label,
  };
}

export function buildLifeMapPlaceSheet(input: {
  location: LifeMapLocationView;
  feedItems: readonly CommunityFeedItem[];
}): LifeMapPlaceSheet {
  const live = feedItemsForLocation(input.feedItems, input.location.id);
  const lead = live[0];
  const moreHref = `/locations/${encodeURIComponent(input.location.id)}`;
  if (!lead) {
    return {
      locationId: input.location.id,
      title: input.location.name,
      categoryHint: input.location.category,
      address: input.location.address,
      imageUrl: input.location.imageUrl,
      primary: { kind: "view", label: "Ver", href: moreHref },
      moreHref,
    };
  }
  const availabilityLabel =
    lead.capacity != null
      ? `${lead.capacity.available} plazas disponibles`
      : undefined;
  return {
    locationId: input.location.id,
    title: input.location.name,
    categoryHint: input.location.category,
    address: input.location.address,
    imageUrl: input.location.imageUrl ?? lead.metadata?.imageUrl,
    nowLabel: lead.title,
    availabilityLabel,
    primary: {
      kind: lead.actions.primary,
      label: communityFeedPrimaryLabel(lead),
      href: communityFeedItemHref(lead),
    },
    secondary: {
      kind: "view",
      label: "Más información",
      href: moreHref,
    },
    moreHref,
  };
}

export function isPackOnlyMapMarker(object: Pick<LifeMapObject, "ref" | "objectId">): boolean {
  if (!object.ref?.entityId) return true;
  return object.ref.entityKind !== "location";
}
