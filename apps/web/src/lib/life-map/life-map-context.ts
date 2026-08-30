/**
 * Life Map context assembly — Territory + Location + Feed.
 * Does not render. MapLibre / Three consume the result later.
 */

import {
  applyFeedLifeToMapObject,
  createLifeMapContext,
  type CommunityFeedItem,
  type LifeMapContext,
  type LifeMapLocationView,
  type LifeMapObject,
  type Location,
  type TerritoryBounds,
  type TerritoryObject,
} from "@life-community-os/types";

export type AssembleLifeMapContextInput = {
  tenantId: string;
  territoryId: string;
  bounds?: TerritoryBounds;
  locations: readonly Location[];
  feedItems: readonly CommunityFeedItem[];
  territoryObjects: readonly TerritoryObject[];
};

export function assembleLifeMapContext(
  input: AssembleLifeMapContextInput,
): LifeMapContext {
  return createLifeMapContext(input);
}

export function mapObjectsWithFeedLife(
  objects: readonly LifeMapObject[],
  feedItems: readonly CommunityFeedItem[],
): LifeMapObject[] {
  return objects.map((object) => applyFeedLifeToMapObject(object, feedItems));
}

export function locationViewById(
  locations: readonly LifeMapLocationView[],
  locationId: string,
): LifeMapLocationView | null {
  return locations.find((item) => item.id === locationId) ?? null;
}
