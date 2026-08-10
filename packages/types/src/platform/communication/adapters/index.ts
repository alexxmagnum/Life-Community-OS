/**
 * Initial Conversation Context Adapters (D.0.5b / Phase 2.1).
 *
 * Register additional adapters without changing Communication Core.
 * Housing + service_request are fail-closed extension points.
 */

export {
  createExperienceConversationAdapter,
  experienceContextMatches,
  type ExperienceConversationSnapshot,
} from "./experience-adapter";

export {
  createGroupConversationAdapter,
  type GroupConversationSnapshot,
} from "./group-adapter";

export {
  createWorkConversationAdapter,
  type WorkConversationSnapshot,
} from "./work-adapter";

export {
  createMarketplaceConversationAdapter,
  type MarketplaceConversationSnapshot,
} from "./marketplace-adapter";

export {
  createPlaceConversationAdapter,
  localEntityToPlaceConversationSnapshot,
  type PlaceConversationSnapshot,
} from "./place-adapter";

export {
  createHousingConversationAdapter,
  type HousingConversationSnapshot,
} from "./housing-adapter";

export {
  createServiceRequestConversationAdapter,
  type ServiceRequestConversationSnapshot,
} from "./service-request-adapter";

export {
  createCommunityDiscussionConversationAdapter,
  COMMUNITY_DISCUSSION_CREATE_CAPABILITY,
  type CommunityDiscussionSnapshot,
} from "./community-discussion-adapter";

export {
  createReservationConversationAdapter,
  type ReservationConversationSnapshot,
} from "./reservation-adapter";

export {
  createOfficialConversationAdapter,
  allowsOfficialResidentReplies,
  allowsOfficialReactions,
  type OfficialConversationSnapshot,
  type OfficialEntityKind,
  type OfficialInteractionMode,
} from "./official-adapter";

import type { ConversationContextAdapterRegistry } from "../adapter-registry";
import { createConversationContextAdapterRegistry } from "../adapter-registry";
import { createCommunityDiscussionConversationAdapter } from "./community-discussion-adapter";
import { createExperienceConversationAdapter } from "./experience-adapter";
import { createGroupConversationAdapter } from "./group-adapter";
import { createHousingConversationAdapter } from "./housing-adapter";
import { createMarketplaceConversationAdapter } from "./marketplace-adapter";
import { createOfficialConversationAdapter } from "./official-adapter";
import { createPlaceConversationAdapter } from "./place-adapter";
import { createReservationConversationAdapter } from "./reservation-adapter";
import { createServiceRequestConversationAdapter } from "./service-request-adapter";
import { createWorkConversationAdapter } from "./work-adapter";

/**
 * Default registry with foundation + extension-point adapters.
 */
export function createDefaultConversationContextAdapterRegistry(): ConversationContextAdapterRegistry {
  return createConversationContextAdapterRegistry([
    createExperienceConversationAdapter(),
    createGroupConversationAdapter(),
    createWorkConversationAdapter(),
    createMarketplaceConversationAdapter(),
    createPlaceConversationAdapter(),
    createServiceRequestConversationAdapter(),
    createHousingConversationAdapter(),
    createCommunityDiscussionConversationAdapter(),
    createReservationConversationAdapter(),
    createOfficialConversationAdapter(),
  ]);
}
