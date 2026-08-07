export type * from "./domain";
export type * from "./platform";

/** Runtime helpers for Local Discovery (platform capability). */
export {
  filterLocalEntities,
  listEntitiesNearYou,
  listTrustedHelpEntities,
  filterLocalRecommendations,
} from "./domain/local-entity";
