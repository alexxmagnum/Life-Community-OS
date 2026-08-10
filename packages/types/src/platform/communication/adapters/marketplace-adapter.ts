import type { DomainId } from "../../../domain/ids";
import type {
  ConversationContextAdapter,
  ConversationParticipant,
  ContextLifecycleState,
} from "../context-adapter";
import { isAdapterModuleAvailable } from "../context-adapter";

/**
 * Marketplace listing conversation adapter — owner module: marketplace.
 * Contextual contact about a specific listing — not a global chat inbox.
 */

const MODULE_ID = "marketplace";
const CAP_MARKETPLACE_VIEW = "community.marketplace.view";

export type MarketplaceConversationSnapshot = {
  id: string;
  title: string;
  authorPersonId: string;
  /** Persons who contacted about this listing. */
  interestedPersonIds?: readonly DomainId[];
  /** Listings are open until withdrawn; default open. */
  status?: "open" | "closed";
};

function mapLifecycle(
  status: MarketplaceConversationSnapshot["status"],
): ContextLifecycleState {
  if (status === "closed") return "closed";
  return "open";
}

export function createMarketplaceConversationAdapter(): ConversationContextAdapter<MarketplaceConversationSnapshot> {
  return {
    contextType: "marketplace",
    getModuleId: () => MODULE_ID,
    isModuleAvailable: (env) => isAdapterModuleAvailable(MODULE_ID, env),
    canOpen(context, env, snapshot) {
      if (!isAdapterModuleAvailable(MODULE_ID, env)) return false;
      if (!snapshot || snapshot.id !== context.contextId) return false;
      if (!env.hasCapability(CAP_MARKETPLACE_VIEW)) return false;
      if (!snapshot.authorPersonId) return false;
      return mapLifecycle(snapshot.status) === "open";
    },
    canView(_context, personId, env, snapshot) {
      if (!isAdapterModuleAvailable(MODULE_ID, env)) return false;
      if (!env.hasCapability(CAP_MARKETPLACE_VIEW)) return false;
      if (!snapshot) return false;
      if (snapshot.authorPersonId === personId) return true;
      return Boolean(snapshot.interestedPersonIds?.includes(personId));
    },
    listParticipants(_context, snapshot) {
      if (!snapshot) return [];
      const list: ConversationParticipant[] = [
        { personId: snapshot.authorPersonId, role: "author" },
      ];
      const seen = new Set<DomainId>([snapshot.authorPersonId]);
      for (const id of snapshot.interestedPersonIds ?? []) {
        if (seen.has(id)) continue;
        list.push({ personId: id, role: "interested" });
        seen.add(id);
      }
      return list;
    },
    deriveTitle(_context, snapshot) {
      if (!snapshot) return "Anuncio";
      return snapshot.title?.trim() || "Anuncio";
    },
    getLifecycle(_context, snapshot) {
      return mapLifecycle(snapshot?.status);
    },
  };
}
