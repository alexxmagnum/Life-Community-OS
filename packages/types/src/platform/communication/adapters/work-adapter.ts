import type { DomainId } from "../../../domain/ids";
import type { WorkPost, WorkPostStatus } from "../../../domain/work-post";
import type {
  ConversationContextAdapter,
  ConversationParticipant,
  ContextLifecycleState,
} from "../context-adapter";
import { isAdapterModuleAvailable } from "../context-adapter";

/**
 * Work / service conversation adapter — owner module: services.
 * Context entity: WorkPost (community job board).
 */

const MODULE_ID = "services";
const CAP_LOCAL_VIEW = "community.local.view";

export type WorkConversationSnapshot = WorkPost & {
  /** Persons who expressed interest — supplied by owning module later. */
  interestedPersonIds?: readonly DomainId[];
};

function mapWorkLifecycle(
  status: WorkPostStatus | undefined,
): ContextLifecycleState {
  switch (status) {
    case "open":
    case "matched":
      return "open";
    case "closed":
    case "withdrawn":
      return "closed";
    default:
      return "unavailable";
  }
}

export function createWorkConversationAdapter(): ConversationContextAdapter<WorkConversationSnapshot> {
  return {
    contextType: "service",
    getModuleId: () => MODULE_ID,
    isModuleAvailable: (env) => isAdapterModuleAvailable(MODULE_ID, env),
    canOpen(context, env, snapshot) {
      if (!isAdapterModuleAvailable(MODULE_ID, env)) return false;
      if (!snapshot || snapshot.id !== context.contextId) return false;
      if (!env.hasCapability(CAP_LOCAL_VIEW)) return false;
      const life = mapWorkLifecycle(snapshot.status);
      return life === "open";
    },
    canView(_context, personId, env, snapshot) {
      if (!isAdapterModuleAvailable(MODULE_ID, env)) return false;
      if (!env.hasCapability(CAP_LOCAL_VIEW)) return false;
      if (!snapshot) return false;
      if (snapshot.createdByPersonId === personId) return true;
      return Boolean(snapshot.interestedPersonIds?.includes(personId));
    },
    listParticipants(_context, snapshot) {
      if (!snapshot) return [];
      const list: ConversationParticipant[] = [
        { personId: snapshot.createdByPersonId, role: "author" },
      ];
      const seen = new Set<DomainId>([snapshot.createdByPersonId]);
      for (const id of snapshot.interestedPersonIds ?? []) {
        if (seen.has(id)) continue;
        list.push({ personId: id, role: "interested" });
        seen.add(id);
      }
      return list;
    },
    deriveTitle(_context, snapshot) {
      if (!snapshot) return "Work";
      return snapshot.title?.trim() || "Work";
    },
    getLifecycle(_context, snapshot) {
      return mapWorkLifecycle(snapshot?.status);
    },
  };
}
