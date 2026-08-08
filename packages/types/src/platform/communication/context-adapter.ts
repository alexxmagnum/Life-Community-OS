import type { DomainId } from "../../domain/ids";
import type { TenantConfiguration } from "../tenant-configuration";
import { isTenantModuleEnabled } from "../tenant-configuration";
import type {
  ConversationContext,
  ConversationContextType,
} from "./conversation-context";

/**
 * Conversation Context Adapter contract (ADR-043 / D.0.5b).
 *
 * Communication Core stays generic. Domain modules own lifecycle, participants,
 * titles, and context meaning through registered adapters.
 *
 * No chat UI, persistence, realtime, or notification delivery in this slice.
 */

/**
 * Domain-owned lifecycle projection for a context.
 * Open set — adapters may use type-specific values (e.g. work "open").
 */
export type ContextLifecycleState =
  | "draft"
  | "active"
  | "completed"
  | "archived"
  | "open"
  | "closed"
  | "unavailable"
  | (string & {});

export type ConversationParticipantRole =
  | "organizer"
  | "owner"
  | "moderator"
  | "member"
  | "author"
  | "interested"
  | "requester"
  | "responsible"
  | "official"
  | "observer";

export type ConversationParticipant = {
  personId: DomainId;
  role?: ConversationParticipantRole;
};

/**
 * Runtime environment injected into adapters.
 * Capabilities come from the existing AuthZ system — not a chat RBAC.
 */
export type ConversationContextAdapterEnv = {
  configuration: TenantConfiguration;
  hasCapability: (capability: string) => boolean;
};

/**
 * Reusable adapter interface.
 * TSnapshot is the domain payload the owning module supplies (catalog / future API).
 */
export type ConversationContextAdapter<TSnapshot = unknown> = {
  /** Context type this adapter handles (extensible string). */
  readonly contextType: ConversationContextType;
  /** Platform Module Registry id owning this context family. */
  getModuleId(): string;
  /**
   * Module availability (Registry + Tenant Configuration).
   * Fail closed — unknown / disabled → false.
   */
  isModuleAvailable(env: ConversationContextAdapterEnv): boolean;
  /** Whether a conversation may be opened for this context. */
  canOpen(
    context: ConversationContext,
    env: ConversationContextAdapterEnv,
    snapshot?: TSnapshot,
  ): boolean;
  /** Whether a Person may view an existing conversation. */
  canView(
    context: ConversationContext,
    personId: DomainId,
    env: ConversationContextAdapterEnv,
    snapshot?: TSnapshot,
  ): boolean;
  listParticipants(
    context: ConversationContext,
    snapshot?: TSnapshot,
  ): ConversationParticipant[];
  deriveTitle(context: ConversationContext, snapshot?: TSnapshot): string;
  getLifecycle(
    context: ConversationContext,
    snapshot?: TSnapshot,
  ): ContextLifecycleState;
};

/** Fail-closed module gate shared by adapters. */
export function isAdapterModuleAvailable(
  moduleId: string,
  env: ConversationContextAdapterEnv,
): boolean {
  if (!moduleId?.trim()) return false;
  return isTenantModuleEnabled(env.configuration, moduleId);
}

/**
 * UI / notification projection helper — hide when module OFF.
 * Does not grant AuthZ.
 */
export function shouldProjectConversationContext(
  adapter: ConversationContextAdapter,
  env: ConversationContextAdapterEnv,
): boolean {
  return adapter.isModuleAvailable(env);
}
