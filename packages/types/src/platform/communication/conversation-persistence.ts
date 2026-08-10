/**
 * Conversation persistence direction (ADR-043 / Phase 2.1).
 *
 * Demo tenants may use session storage today.
 * Production communities must use Platform Conversation service.
 * This file defines contracts only — no tenant names, no localStorage.
 */

import type { DomainId } from "../../domain/ids";
import type { Conversation } from "./conversation";
import type { ConversationContext } from "./conversation-context";
import type { Message } from "./message";

/** How Conversation data is stored for a deployment. */
export type ConversationPersistenceMode = "demo_session" | "platform_service";

/**
 * Platform Conversation service port.
 * Domain adapters stay outside this port — Core stores Conversation + Message only.
 */
export type ConversationRepository = {
  getConversation(conversationId: DomainId): Promise<Conversation | null>;
  findByContext(
    context: Pick<ConversationContext, "contextType" | "contextId" | "tenantId">,
  ): Promise<Conversation | null>;
  saveConversation(conversation: Conversation): Promise<Conversation>;
  listMessages(conversationId: DomainId): Promise<Message[]>;
  saveMessage(message: Message): Promise<Message>;
};

/**
 * Migration path (normative):
 *
 * 1. Current (reference tenants): demo_session stores owned by Tenant Content (D)
 *    — browser localStorage / in-memory seeds. Not production.
 * 2. Target: platform_service implementing ConversationRepository (A)
 *    — tenant-isolated, RLS, multi-device.
 * 3. Adapters (A) remain domain-owned; they do not own persistence.
 * 4. Tenant Content (D) supplies seeds only until API is live.
 */
export type ConversationPersistencePlan = {
  currentMode: ConversationPersistenceMode;
  targetMode: ConversationPersistenceMode;
  currentOwnerLayer: "D";
  targetOwnerLayer: "A";
};

export const DEFAULT_CONVERSATION_PERSISTENCE_PLAN: ConversationPersistencePlan =
  {
    currentMode: "demo_session",
    targetMode: "platform_service",
    currentOwnerLayer: "D",
    targetOwnerLayer: "A",
  };
