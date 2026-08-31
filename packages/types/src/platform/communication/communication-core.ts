/**
 * Communication Core factories (Phase 9).
 * One Conversation table for every product context — adapters do not persist.
 */

import type { DomainId, IsoDateTimeString } from "../../domain/ids";
import {
  type Conversation,
  type ConversationKind,
  CONVERSATION_KINDS,
} from "./conversation";
import {
  type ConversationContextType,
  isKnownConversationContextType,
} from "./conversation-context";
import type { Message, MessageAttachment, MessageMediaRef } from "./message";
import { emptyMessageReactionSummary } from "./reactions";

export type ConversationMemberRole = "owner" | "participant" | "moderator";

export const CONVERSATION_MEMBER_ROLES: readonly ConversationMemberRole[] = [
  "owner",
  "participant",
  "moderator",
] as const;

export type ConversationMemberStatus = "active" | "left" | "removed";

export type ConversationParticipantRecord = {
  id: DomainId;
  tenantId: DomainId;
  conversationId: DomainId;
  personId: DomainId;
  role: ConversationMemberRole;
  status: ConversationMemberStatus;
  createdBy: DomainId;
  joinedAt: IsoDateTimeString;
  displayName?: string;
  createdAt: IsoDateTimeString;
  updatedAt: IsoDateTimeString;
};

export type MessageStatus = "sent" | "edited" | "deleted";

export const MESSAGE_STATUSES: readonly MessageStatus[] = [
  "sent",
  "edited",
  "deleted",
] as const;

export type MessageAttachmentKind = "image" | "document" | "file";

export const MESSAGE_ATTACHMENT_KINDS: readonly MessageAttachmentKind[] = [
  "image",
  "document",
  "file",
] as const;

export const PRODUCT_COMMUNICATION_CONTEXT_TYPES = [
  "community",
  "business",
  "reservation",
  "marketplace",
  "help",
  "administration",
] as const;

export type ProductCommunicationContextType =
  (typeof PRODUCT_COMMUNICATION_CONTEXT_TYPES)[number];

export function isConversationKind(value: string): value is ConversationKind {
  return (CONVERSATION_KINDS as readonly string[]).includes(value);
}

export function isConversationMemberRole(
  value: string,
): value is ConversationMemberRole {
  return (CONVERSATION_MEMBER_ROLES as readonly string[]).includes(value);
}

export function isMessageStatus(value: string): value is MessageStatus {
  return (MESSAGE_STATUSES as readonly string[]).includes(value);
}

export function isMessageAttachmentKind(
  value: string,
): value is MessageAttachmentKind {
  return (MESSAGE_ATTACHMENT_KINDS as readonly string[]).includes(value);
}

export function isProductCommunicationContextType(
  value: string,
): value is ProductCommunicationContextType {
  return (PRODUCT_COMMUNICATION_CONTEXT_TYPES as readonly string[]).includes(
    value,
  );
}

export function normalizeCommunicationContextType(
  value: string,
): ConversationContextType {
  const trimmed = value.trim();
  if (trimmed === "official") return "administration";
  if (trimmed === "service" || trimmed === "service_request") return "help";
  if (isKnownConversationContextType(trimmed)) return trimmed;
  if (isProductCommunicationContextType(trimmed)) return trimmed;
  return "community";
}

export function moduleIdForCommunicationContext(
  contextType: string,
): string {
  switch (normalizeCommunicationContextType(contextType)) {
    case "business":
    case "help":
      return "services";
    case "reservation":
      return "reservations";
    case "marketplace":
      return "marketplace";
    case "administration":
      return "official";
    case "experience":
      return "experiences";
    case "group":
      return "community.groups";
    default:
      return "community";
  }
}

export function directConversationContextId(
  personA: string,
  personB: string,
): string {
  const [left, right] = [personA.trim(), personB.trim()].sort();
  return `direct:${left}:${right}`;
}

function cryptoRandomId(): string {
  const c =
    typeof globalThis !== "undefined"
      ? (globalThis as { crypto?: { randomUUID?: () => string } }).crypto
      : undefined;
  if (typeof c?.randomUUID === "function") {
    return c.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export type CreateConversationInput = {
  tenantId: DomainId;
  createdBy: DomainId;
  type: ConversationKind;
  contextType: ConversationContextType | string;
  contextId: DomainId;
  title?: string;
  territoryId?: DomainId;
  id?: DomainId;
};

export function createConversationRecord(
  input: CreateConversationInput,
): Conversation {
  const tenantId = input.tenantId.trim();
  const createdBy = input.createdBy.trim();
  const contextType = normalizeCommunicationContextType(input.contextType);
  const contextId = input.contextId.trim();
  if (!tenantId || !createdBy || !contextId) {
    throw new Error("Invalid Conversation: missing_fields");
  }
  if (!isConversationKind(input.type)) {
    throw new Error("Invalid Conversation: invalid_type");
  }
  const now = new Date().toISOString();
  const id = input.id?.trim() || `cv-${cryptoRandomId()}`;
  const moduleId = moduleIdForCommunicationContext(contextType);
  return {
    id,
    tenantId,
    type: input.type,
    contextType,
    contextId,
    title: input.title?.trim() || undefined,
    status: "active",
    participantPolicy: input.type === "direct" ? "invited" : "open_context",
    createdByPersonId: createdBy,
    createdBy,
    createdAt: now,
    updatedAt: now,
    context: {
      id: `ctx-${id}`,
      contextType,
      contextId,
      tenantId,
      moduleId,
    },
    ...(input.territoryId?.trim()
      ? { territoryId: input.territoryId.trim() }
      : {}),
  };
}

export function createConversationParticipantRecord(input: {
  tenantId: DomainId;
  conversationId: DomainId;
  personId: DomainId;
  createdBy: DomainId;
  role?: ConversationMemberRole;
  displayName?: string;
  id?: DomainId;
}): ConversationParticipantRecord {
  const now = new Date().toISOString();
  return {
    id: input.id?.trim() || `cp-${cryptoRandomId()}`,
    tenantId: input.tenantId.trim(),
    conversationId: input.conversationId.trim(),
    personId: input.personId.trim(),
    role: input.role ?? "participant",
    status: "active",
    createdBy: input.createdBy.trim(),
    joinedAt: now,
    displayName: input.displayName?.trim() || undefined,
    createdAt: now,
    updatedAt: now,
  };
}

export type CreateMessageInput = {
  tenantId: DomainId;
  conversationId: DomainId;
  senderPersonId: DomainId;
  content: string;
  replyToMessageId?: DomainId;
  attachments?: MessageAttachment[];
  id?: DomainId;
};

export function createMessageRecord(input: CreateMessageInput): Message {
  const content = input.content.trim();
  if (!content && !(input.attachments && input.attachments.length > 0)) {
    throw new Error("Invalid Message: empty_payload");
  }
  const now = new Date().toISOString();
  const sender = input.senderPersonId.trim();
  const mediaRefs: MessageMediaRef[] = (input.attachments ?? [])
    .map((item) => item.fileId)
    .filter((id): id is string => Boolean(id?.trim()))
    .map((fileId) => ({ fileId }));
  return {
    id: input.id?.trim() || `msg-${cryptoRandomId()}`,
    conversationId: input.conversationId.trim(),
    tenantId: input.tenantId.trim(),
    authorPersonId: sender,
    senderPersonId: sender,
    createdBy: sender,
    body: content,
    content,
    replyToMessageId: input.replyToMessageId?.trim() || undefined,
    createdAt: now,
    updatedAt: now,
    status: "sent",
    mediaRefs,
    reactionSummary: emptyMessageReactionSummary(),
    attachments: input.attachments ?? [],
  };
}

export function createMessageAttachmentRecord(input: {
  tenantId: DomainId;
  messageId: DomainId;
  createdBy: DomainId;
  kind: MessageAttachmentKind;
  fileName: string;
  mimeType: string;
  fileId?: DomainId;
  url?: string;
  id?: DomainId;
}): MessageAttachment {
  const now = new Date().toISOString();
  return {
    id: input.id?.trim() || `att-${cryptoRandomId()}`,
    tenantId: input.tenantId.trim(),
    messageId: input.messageId.trim(),
    createdBy: input.createdBy.trim(),
    kind: input.kind,
    fileName: input.fileName.trim() || "file",
    mimeType: input.mimeType.trim() || "application/octet-stream",
    fileId: input.fileId?.trim() || undefined,
    url: input.url?.trim() || undefined,
    createdAt: now,
    updatedAt: now,
  };
}

export function messageStatusFromRecord(message: Message): MessageStatus {
  if (message.deletedAt || message.status === "deleted") return "deleted";
  if (message.editedAt || message.status === "edited") return "edited";
  return "sent";
}

export type ConversationListItem = {
  conversation: Conversation;
  participants: ConversationParticipantRecord[];
  lastMessage?: Message;
};

export type ConversationThread = {
  conversation: Conversation;
  participants: ConversationParticipantRecord[];
  messages: Message[];
};

export function conversationHref(conversation: Conversation): string {
  const type = conversation.type ?? "context";
  const contextType =
    conversation.contextType ?? conversation.context.contextType;
  const contextId = conversation.contextId ?? conversation.context.contextId;
  if (type === "direct") return `/messages/${conversation.id}`;
  switch (contextType) {
    case "marketplace":
      return `/marketplace/${contextId}/conversation`;
    case "help":
      return `/services/work/${contextId}/conversation`;
    case "reservation":
      return `/messages/${conversation.id}`;
    case "business":
      return `/messages/${conversation.id}`;
    case "administration":
      return `/official/${contextId}/conversation`;
    case "community":
      return type === "group"
        ? `/community/groups/${contextId}/conversation`
        : `/messages/${conversation.id}`;
    case "experience":
      return `/experiences/${contextId}/conversation`;
    case "event":
      return `/community`;
    case "group":
      return `/community/groups/${contextId}/conversation`;
    default:
      return `/messages/${conversation.id}`;
  }
}
