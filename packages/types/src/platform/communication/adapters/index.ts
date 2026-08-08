/**
 * Initial Conversation Context Adapters (D.0.5b).
 *
 * Register additional adapters (e.g. boat_club) without changing Communication Core.
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
import { createOfficialConversationAdapter } from "./official-adapter";
import { createReservationConversationAdapter } from "./reservation-adapter";
import { createWorkConversationAdapter } from "./work-adapter";

/**
 * Default registry with the six foundation adapters.
 * Callers may clone/register further adapters for new modules.
 */
export function createDefaultConversationContextAdapterRegistry(): ConversationContextAdapterRegistry {
  return createConversationContextAdapterRegistry([
    createExperienceConversationAdapter(),
    createGroupConversationAdapter(),
    createWorkConversationAdapter(),
    createCommunityDiscussionConversationAdapter(),
    createReservationConversationAdapter(),
    createOfficialConversationAdapter(),
  ]);
}
