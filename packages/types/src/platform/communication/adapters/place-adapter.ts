import type { DomainId } from "../../../domain/ids";
import type { LocalEntity } from "../../../domain/local-entity";
import type {
  ConversationContextAdapter,
  ConversationParticipant,
  ContextLifecycleState,
} from "../context-adapter";
import { isAdapterModuleAvailable } from "../context-adapter";

/**
 * Place / local entity conversation adapter — owner module: nearby.
 * Contextual neighbour questions about a specific place — not a directory DM,
 * not a global chat, not a ChatRoom.
 */

const MODULE_ID = "nearby";
const CAP_LOCAL_VIEW = "community.local.view";

export type PlaceConversationSnapshot = {
  id: DomainId;
  name: string;
  /** Persons participating in the place-scoped thread. */
  participantPersonIds?: readonly DomainId[];
  status?: "open" | "closed";
};

export function localEntityToPlaceConversationSnapshot(
  entity: Pick<LocalEntity, "id" | "name">,
  participantPersonIds?: readonly DomainId[],
): PlaceConversationSnapshot {
  return {
    id: entity.id,
    name: entity.name,
    participantPersonIds,
    status: "open",
  };
}

function mapLifecycle(
  status: PlaceConversationSnapshot["status"],
): ContextLifecycleState {
  if (status === "closed") return "closed";
  return "open";
}

export function createPlaceConversationAdapter(): ConversationContextAdapter<PlaceConversationSnapshot> {
  return {
    contextType: "place",
    getModuleId: () => MODULE_ID,
    isModuleAvailable: (env) => isAdapterModuleAvailable(MODULE_ID, env),
    canOpen(context, env, snapshot) {
      if (!isAdapterModuleAvailable(MODULE_ID, env)) return false;
      if (!snapshot || snapshot.id !== context.contextId) return false;
      if (!env.hasCapability(CAP_LOCAL_VIEW)) return false;
      return mapLifecycle(snapshot.status) === "open";
    },
    canView(_context, _personId, env, snapshot) {
      if (!isAdapterModuleAvailable(MODULE_ID, env)) return false;
      if (!env.hasCapability(CAP_LOCAL_VIEW)) return false;
      if (!snapshot) return false;
      // Place threads are open neighbour context — not private DM.
      return mapLifecycle(snapshot.status) === "open";
    },
    listParticipants(_context, snapshot) {
      if (!snapshot) return [];
      return (snapshot.participantPersonIds ?? []).map(
        (personId): ConversationParticipant => ({
          personId,
          role: "member",
        }),
      );
    },
    deriveTitle(_context, snapshot) {
      if (!snapshot) return "Lugar";
      return snapshot.name?.trim() || "Lugar";
    },
    getLifecycle(_context, snapshot) {
      return mapLifecycle(snapshot?.status);
    },
  };
}
