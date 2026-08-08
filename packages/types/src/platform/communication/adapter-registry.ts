import type { ConversationContextType } from "./conversation-context";
import type { ConversationContextAdapter } from "./context-adapter";

/**
 * Adapter registry — extensibility without Communication Core changes.
 *
 * Future modules (e.g. boat_club) register a new adapter; Core stays generic.
 */

export type ConversationContextAdapterRegistry = {
  register(adapter: ConversationContextAdapter): void;
  unregister(contextType: ConversationContextType): void;
  get(
    contextType: ConversationContextType,
  ): ConversationContextAdapter | undefined;
  list(): readonly ConversationContextAdapter[];
  has(contextType: ConversationContextType): boolean;
};

export function createConversationContextAdapterRegistry(
  initial: readonly ConversationContextAdapter[] = [],
): ConversationContextAdapterRegistry {
  const byType = new Map<string, ConversationContextAdapter>();

  for (const adapter of initial) {
    byType.set(adapter.contextType, adapter);
  }

  return {
    register(adapter) {
      byType.set(adapter.contextType, adapter);
    },
    unregister(contextType) {
      byType.delete(contextType);
    },
    get(contextType) {
      return byType.get(contextType);
    },
    list() {
      return [...byType.values()];
    },
    has(contextType) {
      return byType.has(contextType);
    },
  };
}
