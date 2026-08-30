import type { DomainId, IsoDateTimeString } from "../../domain/ids";
import type { ConversationContext } from "./conversation-context";
import { validateConversationContext } from "./conversation-context";

/**
 * Contextual Conversation (ADR-043 / D.0.5a).
 *
 * Exists because a domain Context has a reason to communicate.
 * Not a standalone chat room; not a Channel (ADR-035 organization).
 */

export type ConversationKind = "direct" | "group" | "context";

export const CONVERSATION_KINDS: readonly ConversationKind[] = [
  "direct",
  "group",
  "context",
] as const;

export type ConversationStatus =
  | "draft"
  | "active"
  | "completed"
  | "archived"
  | "locked";

export type ConversationParticipantPolicy =
  | "open_context"
  | "invited"
  | "role_gated";

export type Conversation = {
  id: DomainId;
  tenantId: DomainId;
  /** Territory where the conversation occurs. Inherited from the domain context. */
  territoryId?: DomainId;
  context: ConversationContext;
  /** Product conversation kind (Phase 9). Direct / group / context thread. */
  type?: ConversationKind;
  /** Flattened from context — kept for API/SQL projections. */
  contextType?: ConversationContext["contextType"];
  contextId?: DomainId;
  title?: string;
  status: ConversationStatus;
  participantPolicy: ConversationParticipantPolicy;
  /** Person who opened the conversation when applicable. */
  createdByPersonId?: DomainId;
  createdBy?: DomainId;
  createdAt: IsoDateTimeString;
  updatedAt: IsoDateTimeString;
  archivedAt?: IsoDateTimeString;
  retentionPolicyId?: DomainId;
  /** When set, messages may carry ephemeralExpiresAt aligned to this TTL. */
  ephemeralTtlDays?: number;
};

export type ConversationIssueCode =
  | "missing_id"
  | "missing_tenant_id"
  | "missing_context"
  | "invalid_context"
  | "missing_status"
  | "missing_participant_policy"
  | "missing_created_at"
  | "missing_updated_at"
  | "tenant_mismatch"
  | "negative_ephemeral_ttl";

export type ConversationIssue = {
  code: ConversationIssueCode;
  message: string;
  field?: keyof Conversation | `context.${string}`;
};

const CONVERSATION_STATUSES: ReadonlySet<ConversationStatus> = new Set([
  "draft",
  "active",
  "completed",
  "archived",
  "locked",
]);

const PARTICIPANT_POLICIES: ReadonlySet<ConversationParticipantPolicy> =
  new Set(["open_context", "invited", "role_gated"]);

/**
 * Structural validation of Conversation (not AuthZ, not realtime).
 */
export function validateConversation(
  conversation: Conversation,
): ConversationIssue[] {
  const issues: ConversationIssue[] = [];

  if (!conversation.id?.trim()) {
    issues.push({
      code: "missing_id",
      message: "Conversation requires id.",
      field: "id",
    });
  }
  if (!conversation.tenantId?.trim()) {
    issues.push({
      code: "missing_tenant_id",
      message: "Conversation requires tenantId.",
      field: "tenantId",
    });
  }
  if (!conversation.context) {
    issues.push({
      code: "missing_context",
      message: "Conversation requires context.",
      field: "context",
    });
  } else {
    const contextIssues = validateConversationContext(conversation.context);
    for (const issue of contextIssues) {
      issues.push({
        code: "invalid_context",
        message: issue.message,
        field: `context.${issue.field ?? "unknown"}`,
      });
    }
    if (
      conversation.tenantId?.trim() &&
      conversation.context.tenantId?.trim() &&
      conversation.tenantId !== conversation.context.tenantId
    ) {
      issues.push({
        code: "tenant_mismatch",
        message: "Conversation.tenantId must match context.tenantId.",
        field: "tenantId",
      });
    }
  }
  if (!CONVERSATION_STATUSES.has(conversation.status)) {
    issues.push({
      code: "missing_status",
      message: "Conversation requires a valid status.",
      field: "status",
    });
  }
  if (!PARTICIPANT_POLICIES.has(conversation.participantPolicy)) {
    issues.push({
      code: "missing_participant_policy",
      message: "Conversation requires a valid participantPolicy.",
      field: "participantPolicy",
    });
  }
  if (!conversation.createdAt?.trim()) {
    issues.push({
      code: "missing_created_at",
      message: "Conversation requires createdAt.",
      field: "createdAt",
    });
  }
  if (!conversation.updatedAt?.trim()) {
    issues.push({
      code: "missing_updated_at",
      message: "Conversation requires updatedAt.",
      field: "updatedAt",
    });
  }
  if (
    conversation.ephemeralTtlDays !== undefined &&
    conversation.ephemeralTtlDays < 0
  ) {
    issues.push({
      code: "negative_ephemeral_ttl",
      message: "ephemeralTtlDays must be >= 0 when set.",
      field: "ephemeralTtlDays",
    });
  }

  return issues;
}
