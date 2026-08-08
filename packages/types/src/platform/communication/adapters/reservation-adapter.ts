import type { DomainId } from "../../../domain/ids";
import type {
  Reservation,
  ReservationStatus,
} from "../../../domain/resource";
import type {
  ConversationContextAdapter,
  ConversationParticipant,
  ContextLifecycleState,
} from "../context-adapter";
import { isAdapterModuleAvailable } from "../context-adapter";

/**
 * Reservation conversation adapter — owner module: reservations.
 */

const MODULE_ID = "reservations";
const CAP_RESOURCE_VIEW = "community.resource.view";
const CAP_RESOURCE_RESERVE = "community.resource.reserve";
const CAP_RESOURCE_MANAGE = "community.resource.manage";

export type ReservationConversationSnapshot = Reservation & {
  /** Steward / staff / official contacts for the resource booking. */
  responsiblePersonIds?: readonly DomainId[];
};

function mapReservationLifecycle(
  status: ReservationStatus | undefined,
): ContextLifecycleState {
  switch (status) {
    case "pending":
    case "reserved":
      return "active";
    case "cancelled":
    case "expired":
      return "archived";
    default:
      return "unavailable";
  }
}

export function createReservationConversationAdapter(): ConversationContextAdapter<ReservationConversationSnapshot> {
  return {
    contextType: "reservation",
    getModuleId: () => MODULE_ID,
    isModuleAvailable: (env) => isAdapterModuleAvailable(MODULE_ID, env),
    canOpen(context, env, snapshot) {
      if (!isAdapterModuleAvailable(MODULE_ID, env)) return false;
      if (!snapshot || snapshot.id !== context.contextId) return false;
      if (
        !env.hasCapability(CAP_RESOURCE_VIEW) &&
        !env.hasCapability(CAP_RESOURCE_RESERVE) &&
        !env.hasCapability(CAP_RESOURCE_MANAGE)
      ) {
        return false;
      }
      return mapReservationLifecycle(snapshot.status) === "active";
    },
    canView(_context, personId, env, snapshot) {
      if (!isAdapterModuleAvailable(MODULE_ID, env)) return false;
      if (!snapshot) return false;
      if (env.hasCapability(CAP_RESOURCE_MANAGE)) return true;
      if (snapshot.personId === personId) return true;
      if (snapshot.responsiblePersonIds?.includes(personId)) return true;
      return false;
    },
    listParticipants(_context, snapshot) {
      if (!snapshot) return [];
      const list: ConversationParticipant[] = [];
      const seen = new Set<DomainId>();
      if (snapshot.personId) {
        list.push({ personId: snapshot.personId, role: "requester" });
        seen.add(snapshot.personId);
      }
      for (const id of snapshot.responsiblePersonIds ?? []) {
        if (seen.has(id)) continue;
        list.push({ personId: id, role: "responsible" });
        seen.add(id);
      }
      return list;
    },
    deriveTitle(_context, snapshot) {
      if (!snapshot) return "Reservation";
      const name = snapshot.resourceName?.trim();
      if (name) return name;
      return "Reservation";
    },
    getLifecycle(_context, snapshot) {
      return mapReservationLifecycle(snapshot?.status);
    },
  };
}
