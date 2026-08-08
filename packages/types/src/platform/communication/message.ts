import type { DomainId, IsoDateTimeString } from "../../domain/ids";
import type { FileType } from "../files/file-reference";
import type { FileVariantKind } from "../files/file-variant";
import type { QuickActionKind } from "./quick-actions";
import { isQuickActionKind } from "./quick-actions";
import type { MessageReactionSummary, ReactionType } from "./reactions";
import { isReactionType } from "./reactions";

/**
 * Conversation Message (ADR-043).
 *
 * Belongs to a Conversation under a domain Context.
 * Media is referenced via Core Files (ADR-020 / D.0.5c) — never raw upload URLs.
 */

/**
 * Pointer from a Message to a FileReference.
 * `fileId` MUST equal FileReference.id — never embed imageUrl / blob URLs here.
 */
export type MessageMediaRef = {
  /** FileReference.id */
  fileId: DomainId;
  /** Mirrors FileReference.fileType when known. */
  kind?: FileType;
  /**
   * Preferred variant for display.
   * Use thumbnail | preview | optimized — never serve original_ref by default.
   */
  role?: FileVariantKind;
};

export type Message = {
  id: DomainId;
  conversationId: DomainId;
  tenantId: DomainId;
  authorPersonId: DomainId;
  body?: string;
  replyToMessageId?: DomainId;
  threadRootId?: DomainId;
  createdAt: IsoDateTimeString;
  editedAt?: IsoDateTimeString;
  deletedAt?: IsoDateTimeString;
  ephemeralExpiresAt?: IsoDateTimeString;
  mediaRefs: MessageMediaRef[];
  reactionSummary: MessageReactionSummary;
  /** Semantic shortcut — may emit future domain events; not AuthZ. */
  quickActionKind?: QuickActionKind;
};

export type MessageIssueCode =
  | "missing_id"
  | "missing_conversation_id"
  | "missing_tenant_id"
  | "missing_author_person_id"
  | "missing_created_at"
  | "invalid_media_ref"
  | "invalid_reaction_summary"
  | "invalid_quick_action"
  | "empty_payload";

export type MessageIssue = {
  code: MessageIssueCode;
  message: string;
  field?: keyof Message | `mediaRefs[${number}]` | `reactionSummary.${string}`;
};

/**
 * Structural validation of Message (not AuthZ, not delivery).
 * A message must have body, media, or a quick action.
 */
export function validateMessage(message: Message): MessageIssue[] {
  const issues: MessageIssue[] = [];

  if (!message.id?.trim()) {
    issues.push({
      code: "missing_id",
      message: "Message requires id.",
      field: "id",
    });
  }
  if (!message.conversationId?.trim()) {
    issues.push({
      code: "missing_conversation_id",
      message: "Message requires conversationId.",
      field: "conversationId",
    });
  }
  if (!message.tenantId?.trim()) {
    issues.push({
      code: "missing_tenant_id",
      message: "Message requires tenantId.",
      field: "tenantId",
    });
  }
  if (!message.authorPersonId?.trim()) {
    issues.push({
      code: "missing_author_person_id",
      message: "Message requires authorPersonId.",
      field: "authorPersonId",
    });
  }
  if (!message.createdAt?.trim()) {
    issues.push({
      code: "missing_created_at",
      message: "Message requires createdAt.",
      field: "createdAt",
    });
  }

  const mediaRefs = message.mediaRefs ?? [];
  mediaRefs.forEach((ref, index) => {
    if (!ref?.fileId?.trim()) {
      issues.push({
        code: "invalid_media_ref",
        message: "Each mediaRefs entry requires fileId.",
        field: `mediaRefs[${index}]`,
      });
    }
  });

  const summary = message.reactionSummary ?? {};
  for (const key of Object.keys(summary) as ReactionType[]) {
    if (!isReactionType(key)) {
      issues.push({
        code: "invalid_reaction_summary",
        message: `Unknown reaction type "${key}".`,
        field: `reactionSummary.${key}`,
      });
      continue;
    }
    const count = summary[key];
    if (count !== undefined && (count < 0 || !Number.isFinite(count))) {
      issues.push({
        code: "invalid_reaction_summary",
        message: `Reaction count for "${key}" must be a non-negative number.`,
        field: `reactionSummary.${key}`,
      });
    }
  }

  if (
    message.quickActionKind !== undefined &&
    !isQuickActionKind(message.quickActionKind)
  ) {
    issues.push({
      code: "invalid_quick_action",
      message: "quickActionKind is not a known QuickActionKind.",
      field: "quickActionKind",
    });
  }

  const hasBody = Boolean(message.body?.trim());
  const hasMedia = mediaRefs.some((r) => r?.fileId?.trim());
  const hasQuick = Boolean(message.quickActionKind);
  if (!hasBody && !hasMedia && !hasQuick) {
    issues.push({
      code: "empty_payload",
      message: "Message requires body, mediaRefs, or quickActionKind.",
      field: "body",
    });
  }

  return issues;
}
