import type { DomainId } from "../../domain/ids";
import { getPlatformModuleById } from "../module-registry";

/**
 * Contextual Conversation Layer — ConversationContext (ADR-043 / D.0.5a).
 *
 * Binds a Conversation to a domain context owned by a Platform Module.
 * Communication Layer is Core infrastructure — not a chat product.
 *
 * Extensibility: new modules (e.g. boat_club) register additional contextType
 * strings without changing this Core contract. Do not switch on business types here.
 */

/**
 * Known initial context types. Additional module-owned strings are allowed
 * via ConversationContextType (open union).
 */
export const KNOWN_CONVERSATION_CONTEXT_TYPES = [
  "community",
  "business",
  "reservation",
  "marketplace",
  "help",
  "administration",
  "experience",
  "event",
  "group",
  "service",
  "community_discussion",
  "official",
  "place",
  "service_request",
  "housing_listing",
] as const;

export type KnownConversationContextType =
  (typeof KNOWN_CONVERSATION_CONTEXT_TYPES)[number];

/**
 * Extensible context type key.
 * Prefer KnownConversationContextType values; modules may add e.g. "boat_club".
 */
export type ConversationContextType =
  | KnownConversationContextType
  | (string & {});

/**
 * Ownership binding for contextual communication.
 * moduleId must reference Platform Module Registry (availability / OFF behaviour).
 */
export type ConversationContext = {
  id: DomainId;
  contextType: ConversationContextType;
  /** Domain entity id (experience, group, work post, content, reservation, …). */
  contextId: DomainId;
  tenantId: DomainId;
  territoryId?: DomainId;
  /** Platform Module Registry id — OFF hides conversations for this context. */
  moduleId: string;
  /** Optional organizational Channel host (ADR-035) — not a ChatRoom. */
  channelId?: DomainId;
};

export type ConversationContextIssueCode =
  | "missing_id"
  | "missing_context_type"
  | "missing_context_id"
  | "missing_tenant_id"
  | "missing_module_id"
  | "unknown_module_id";

export type ConversationContextIssue = {
  code: ConversationContextIssueCode;
  message: string;
  field?: keyof ConversationContext;
};

export function isKnownConversationContextType(
  value: string,
): value is KnownConversationContextType {
  return (KNOWN_CONVERSATION_CONTEXT_TYPES as readonly string[]).includes(
    value,
  );
}

/**
 * Structural validation of ConversationContext (not AuthZ, not business routing).
 * Soft-checks moduleId against Platform Module Registry when present.
 */
export function validateConversationContext(
  context: ConversationContext,
): ConversationContextIssue[] {
  const issues: ConversationContextIssue[] = [];

  if (!context.id?.trim()) {
    issues.push({
      code: "missing_id",
      message: "ConversationContext requires id.",
      field: "id",
    });
  }
  if (!context.contextType?.trim()) {
    issues.push({
      code: "missing_context_type",
      message: "ConversationContext requires contextType.",
      field: "contextType",
    });
  }
  if (!context.contextId?.trim()) {
    issues.push({
      code: "missing_context_id",
      message: "ConversationContext requires contextId.",
      field: "contextId",
    });
  }
  if (!context.tenantId?.trim()) {
    issues.push({
      code: "missing_tenant_id",
      message: "ConversationContext requires tenantId.",
      field: "tenantId",
    });
  }
  if (!context.moduleId?.trim()) {
    issues.push({
      code: "missing_module_id",
      message: "ConversationContext requires moduleId (Platform Module Registry).",
      field: "moduleId",
    });
  } else if (!getPlatformModuleById(context.moduleId)) {
    issues.push({
      code: "unknown_module_id",
      message: `moduleId "${context.moduleId}" is not in Platform Module Registry.`,
      field: "moduleId",
    });
  }

  return issues;
}
