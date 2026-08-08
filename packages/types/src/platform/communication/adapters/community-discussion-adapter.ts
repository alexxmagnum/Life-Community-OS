import type { DomainId } from "../../../domain/ids";
import type {
  ConversationContextAdapter,
  ConversationParticipant,
  ContextLifecycleState,
} from "../context-adapter";
import { isAdapterModuleAvailable } from "../context-adapter";

/**
 * Community discussion adapter — owner module: community.
 * Covers posts, proposals, recommendations (content-centric threads).
 *
 * Snapshot is intentionally thin — CommunityContent lives in tenant packs today.
 */

const MODULE_ID = "community";
const CAP_CONTENT_VIEW = "community.content.view";
const CAP_CONTENT_CREATE = "community.content.create";

export type CommunityDiscussionSnapshot = {
  id: DomainId;
  title: string;
  /** proposal | announcement | tip | post | … — opaque to Communication Core. */
  contentType?: string;
  authorPersonId?: DomainId;
  status?: string;
  isOfficial?: boolean;
  commentAuthorPersonIds?: readonly DomainId[];
};

function mapDiscussionLifecycle(
  status: string | undefined,
): ContextLifecycleState {
  switch (status) {
    case "draft":
    case "pending_review":
      return "draft";
    case "published":
      return "active";
    case "expired":
    case "archived":
      return "archived";
    default:
      return status ? "active" : "unavailable";
  }
}

export function createCommunityDiscussionConversationAdapter(): ConversationContextAdapter<CommunityDiscussionSnapshot> {
  return {
    contextType: "community_discussion",
    getModuleId: () => MODULE_ID,
    isModuleAvailable: (env) => isAdapterModuleAvailable(MODULE_ID, env),
    canOpen(context, env, snapshot) {
      if (!isAdapterModuleAvailable(MODULE_ID, env)) return false;
      if (!snapshot || snapshot.id !== context.contextId) return false;
      if (!env.hasCapability(CAP_CONTENT_VIEW)) return false;
      const life = mapDiscussionLifecycle(snapshot.status);
      return life === "active" || life === "draft";
    },
    canView(_context, personId, env, snapshot) {
      if (!isAdapterModuleAvailable(MODULE_ID, env)) return false;
      if (!env.hasCapability(CAP_CONTENT_VIEW)) return false;
      if (!snapshot) return false;
      if (snapshot.authorPersonId === personId) return true;
      if (snapshot.commentAuthorPersonIds?.includes(personId)) return true;
      // Published community discussions are viewable with content.view.
      return mapDiscussionLifecycle(snapshot.status) === "active";
    },
    listParticipants(_context, snapshot) {
      if (!snapshot) return [];
      const list: ConversationParticipant[] = [];
      const seen = new Set<DomainId>();
      if (snapshot.authorPersonId) {
        list.push({
          personId: snapshot.authorPersonId,
          role: snapshot.isOfficial ? "official" : "author",
        });
        seen.add(snapshot.authorPersonId);
      }
      for (const id of snapshot.commentAuthorPersonIds ?? []) {
        if (seen.has(id)) continue;
        list.push({ personId: id, role: "member" });
        seen.add(id);
      }
      return list;
    },
    deriveTitle(_context, snapshot) {
      return snapshot?.title?.trim() || "Discussion";
    },
    getLifecycle(_context, snapshot) {
      return mapDiscussionLifecycle(snapshot?.status);
    },
  };
}

/** Capability create is available for composers — not required to view. */
export const COMMUNITY_DISCUSSION_CREATE_CAPABILITY = CAP_CONTENT_CREATE;
