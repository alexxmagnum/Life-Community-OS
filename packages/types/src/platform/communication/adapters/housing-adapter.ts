import type {
  ConversationContextAdapter,
  ContextLifecycleState,
} from "../context-adapter";
import { isAdapterModuleAvailable } from "../context-adapter";

/**
 * Housing listing conversation adapter — EXTENSION POINT ONLY (Phase 2.1).
 * No Housing product surface in this phase. Fail closed until housing module exists.
 */

const MODULE_ID = "housing";

export type HousingConversationSnapshot = {
  id: string;
  title: string;
  authorPersonId: string;
  status?: "open" | "closed";
};

export function createHousingConversationAdapter(): ConversationContextAdapter<HousingConversationSnapshot> {
  return {
    contextType: "housing_listing",
    getModuleId: () => MODULE_ID,
    isModuleAvailable: (env) => isAdapterModuleAvailable(MODULE_ID, env),
    canOpen() {
      return false;
    },
    canView() {
      return false;
    },
    listParticipants() {
      return [];
    },
    deriveTitle(_context, snapshot) {
      return snapshot?.title?.trim() || "Vivienda";
    },
    getLifecycle(): ContextLifecycleState {
      return "unavailable";
    },
  };
}
