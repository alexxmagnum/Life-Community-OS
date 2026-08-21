/**
 * Communication AuthZ — Conversation + Message.
 * Sender and created_by come from session membership, never from the client body.
 */

import { actorHasCapability } from "@/lib/auth/permissions";
import type { RequestActor } from "@/lib/auth/request-actor";
import { CAPABILITIES } from "@life-community-os/tenant-life-panoramica";
import type {
  Conversation,
  ConversationMemberRole,
  ConversationParticipantRecord,
  MembershipRole,
  Message,
} from "@life-community-os/types";

export function isCommunicationStaff(
  role: MembershipRole | null | undefined,
): boolean {
  return role === "moderator" || role === "administrator";
}

export function actorCanViewCommunication(actor: RequestActor): boolean {
  if (actor.tenantDenied) return false;
  if (!actor.authenticated || !actor.hasMembership) return false;
  return actorHasCapability(actor.permissions, CAPABILITIES.contentView);
}

export function actorCanCreateConversation(actor: RequestActor): boolean {
  return actorCanViewCommunication(actor) && Boolean(actor.personId);
}

export function actorCanSendMessage(actor: RequestActor): boolean {
  return actorCanCreateConversation(actor);
}

export function isActiveParticipant(
  participants: readonly ConversationParticipantRecord[],
  personId: string | null | undefined,
): boolean {
  if (!personId) return false;
  return participants.some(
    (item) => item.personId === personId && item.status === "active",
  );
}

export function participantRole(
  participants: readonly ConversationParticipantRecord[],
  personId: string | null | undefined,
): ConversationMemberRole | null {
  if (!personId) return null;
  const row = participants.find(
    (item) => item.personId === personId && item.status === "active",
  );
  return row?.role ?? null;
}

export function actorCanReadConversation(
  actor: RequestActor,
  conversation: Conversation,
  participants: readonly ConversationParticipantRecord[],
): boolean {
  if (!actorCanViewCommunication(actor)) return false;
  if (conversation.tenantId !== actor.tenantSlug) return false;
  if (isCommunicationStaff(actor.role)) return true;
  return isActiveParticipant(participants, actor.personId);
}

export function actorCanPostInConversation(
  actor: RequestActor,
  conversation: Conversation,
  participants: readonly ConversationParticipantRecord[],
): boolean {
  if (!actorCanSendMessage(actor)) return false;
  if (conversation.tenantId !== actor.tenantSlug) return false;
  if (conversation.status === "locked" || conversation.status === "archived") {
    return isCommunicationStaff(actor.role);
  }
  return isActiveParticipant(participants, actor.personId);
}

export function actorCanManageParticipants(
  actor: RequestActor,
  conversation: Conversation,
  participants: readonly ConversationParticipantRecord[],
): boolean {
  if (!actorCanReadConversation(actor, conversation, participants)) return false;
  if (isCommunicationStaff(actor.role)) return true;
  const role = participantRole(participants, actor.personId);
  return role === "owner" || role === "moderator";
}

export function actorCanEditMessage(
  actor: RequestActor,
  message: Message,
): boolean {
  if (!actor.personId) return false;
  if (message.deletedAt || message.status === "deleted") return false;
  return (
    message.authorPersonId === actor.personId ||
    message.senderPersonId === actor.personId
  );
}

export function actorCanModerateMessage(
  actor: RequestActor,
  conversation: Conversation,
  participants: readonly ConversationParticipantRecord[],
  message: Message,
): boolean {
  if (actorCanEditMessage(actor, message)) return true;
  if (!actorCanReadConversation(actor, conversation, participants)) return false;
  if (isCommunicationStaff(actor.role)) return true;
  const role = participantRole(participants, actor.personId);
  return role === "owner" || role === "moderator";
}
