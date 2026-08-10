import type {
  ConversationContextAdapter,
  ContextLifecycleState,
} from "../context-adapter";
import { isAdapterModuleAvailable } from "../context-adapter";

/**
 * Service request conversation adapter — EXTENSION POINT ONLY (Phase 2.1).
 * Distinct from WorkPost contextType "service". Fail closed until product wires UI.
 */

const MODULE_ID = "services";
const CAP_LOCAL_VIEW = "community.local.view";

export type ServiceRequestConversationSnapshot = {
  id: string;
  title: string;
  requesterPersonId: string;
  status?: "open" | "closed";
};

export function createServiceRequestConversationAdapter(): ConversationContextAdapter<ServiceRequestConversationSnapshot> {
  return {
    contextType: "service_request",
    getModuleId: () => MODULE_ID,
    isModuleAvailable: (env) => isAdapterModuleAvailable(MODULE_ID, env),
    canOpen(context, env, snapshot) {
      if (!isAdapterModuleAvailable(MODULE_ID, env)) return false;
      if (!env.hasCapability(CAP_LOCAL_VIEW)) return false;
      if (!snapshot || snapshot.id !== context.contextId) return false;
      // Extension point: product surface not shipped yet.
      return false;
    },
    canView() {
      return false;
    },
    listParticipants() {
      return [];
    },
    deriveTitle(_context, snapshot) {
      return snapshot?.title?.trim() || "Solicitud";
    },
    getLifecycle(): ContextLifecycleState {
      return "unavailable";
    },
  };
}
