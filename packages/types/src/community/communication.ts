/**
 * Community Communication Experience — territorial messaging without a social network.
 * Projection only. Communication Core remains authoritative for Conversation and Message.
 */

import {
  conversationHref,
  type ConversationListItem,
} from "../platform/communication/communication-core";
import type { Conversation } from "../platform/communication/conversation";
import type { PersonalContext, PersonalPrivacy } from "../personal/personal-context";
import type { CommunityParticipationPrivacy } from "./participation";
import { DEFAULT_COMMUNITY_PARTICIPATION_PRIVACY } from "./participation";
import type { TerritoryAnnouncement } from "./operations";

export const COMMUNITY_CHANNEL_KINDS = [
  "official",
  "territory",
  "group",
  "experience",
  "reservation",
  "private",
] as const;

export type CommunityChannelKind = (typeof COMMUNITY_CHANNEL_KINDS)[number];

export const COMMUNITY_COMMUNICATION_LAYERS = [
  "official",
  "community",
  "private",
] as const;

export type CommunityCommunicationLayer =
  (typeof COMMUNITY_COMMUNICATION_LAYERS)[number];

export const COMMUNITY_COMMUNICATION_NOTIFICATION_KINDS = [
  "official_announcement",
  "conversation_message",
  "experience_update",
  "reservation_update",
  "help_response",
] as const;

export type CommunityCommunicationNotificationKind =
  (typeof COMMUNITY_COMMUNICATION_NOTIFICATION_KINDS)[number];

export type CommunityChannelContext = {
  id: string;
  kind: CommunityChannelKind;
  layer: CommunityCommunicationLayer;
  title: string;
  description?: string;
  href?: string;
  unreadCount: number;
  territoryId: string;
  conversationId?: string;
  requiresMembership: boolean;
};

export type CommunityConversationSummary = {
  id: string;
  title: string;
  layer: CommunityCommunicationLayer;
  channelKind: CommunityChannelKind;
  href: string;
  lastMessagePreview?: string;
  lastMessageAt?: string;
  unread: boolean;
  territoryId?: string;
  contextType?: string;
  contextId?: string;
};

export type CommunityAnnouncementExperience = {
  id: string;
  tenantId: string;
  territoryId: string;
  title: string;
  body: string;
  priority: "normal" | "important";
  expiresAt?: string;
  territoryVisible: true;
  requiresAcknowledgement: boolean;
  acknowledged: boolean;
  href: string;
  createdAt: string;
};

export type ExperienceConversationContext = {
  experienceId: string;
  tenantId: string;
  territoryId: string;
  title: string;
  href: string;
  participantCount: number;
  canConverse: boolean;
};

export type CommunityCommunicationPreferences = {
  canReceiveMessages: boolean;
  canReceiveOfficial: boolean;
  canReceiveExperienceUpdates: boolean;
  canReceiveReservationUpdates: boolean;
  showInParticipants: boolean;
  receiveInvitations: boolean;
};

export type CommunityUnreadContext = {
  totalUnread: number;
  conversationUnread: number;
  announcementUnread: number;
};

export type CommunityCommunicationPermissions = {
  canRead: boolean;
  canSend: boolean;
  canReport: boolean;
  canPublishOfficial: boolean;
  canModerate: boolean;
  canReadPrivateAsAdmin: false;
};

export type CommunityCommunicationComposerHint = {
  id: string;
  title: string;
  description: string;
  composerActionId: string;
  requiresConfirmation: true;
};

export type CommunityCommunicationContext = {
  tenantId: string;
  territoryId: string;
  channels: CommunityChannelContext[];
  conversations: CommunityConversationSummary[];
  announcements: CommunityAnnouncementExperience[];
  preferences: CommunityCommunicationPreferences;
  unread: CommunityUnreadContext;
  permissions: CommunityCommunicationPermissions;
  privacy: PersonalPrivacy;
  composerHints?: CommunityCommunicationComposerHint[];
  adminSummary?: {
    pendingReports: number;
    territoryChannels: number;
    activeAnnouncements: number;
  };
};

export type CommunityCommunicationInput = {
  tenantId: string;
  territoryId: string;
  context: PersonalContext;
  conversations: readonly ConversationListItem[];
  announcements: readonly TerritoryAnnouncement[];
  acknowledgedAnnouncementIds?: readonly string[];
  participationPrivacy?: CommunityParticipationPrivacy;
  hasMembership: boolean;
  isCommunityAdmin?: boolean;
  pendingReports?: number;
  experienceContexts?: readonly ExperienceConversationContext[];
};

export type LifeHomeCommunicationSummary = {
  importantAnnouncements: CommunityAnnouncementExperience[];
  unreadCount: number;
  pendingConversations: number;
};

function normalizeContextType(conversation: Conversation): string {
  return String(
    conversation.contextType ?? conversation.context?.contextType ?? "community",
  );
}

export function resolveChannelKind(
  conversation: Conversation,
): CommunityChannelKind {
  const type = conversation.type ?? "context";
  const contextType = normalizeContextType(conversation);
  if (type === "direct") return "private";
  if (contextType === "administration") return "official";
  if (contextType === "group") return "group";
  if (contextType === "experience") return "experience";
  if (contextType === "reservation") return "reservation";
  if (contextType === "help") return "territory";
  return "territory";
}

export function resolveCommunicationLayer(
  channelKind: CommunityChannelKind,
): CommunityCommunicationLayer {
  if (channelKind === "official") return "official";
  if (channelKind === "private") return "private";
  return "community";
}

export function resolveConversation(
  item: ConversationListItem,
  viewerPersonId?: string,
): CommunityConversationSummary {
  const conversation = item.conversation;
  const channelKind = resolveChannelKind(conversation);
  const layer = resolveCommunicationLayer(channelKind);
  const last = item.lastMessage;
  const senderId = last?.senderPersonId?.trim();
  const unread =
    Boolean(last) &&
    Boolean(viewerPersonId) &&
    senderId !== viewerPersonId &&
    last?.status !== "deleted";
  return {
    id: conversation.id,
    title: conversation.title?.trim() || "Conversación",
    layer,
    channelKind,
    href: conversationHref(conversation),
    lastMessagePreview: last?.content?.trim().slice(0, 120),
    lastMessageAt: last?.createdAt,
    unread,
    territoryId: conversation.territoryId,
    contextType: normalizeContextType(conversation),
    contextId: conversation.contextId ?? conversation.context?.contextId,
  };
}

export function resolveChannels(input: {
  conversations: readonly ConversationListItem[];
  announcements: readonly TerritoryAnnouncement[];
  territoryId: string;
  viewerPersonId?: string;
}): CommunityChannelContext[] {
  const channels: CommunityChannelContext[] = [];
  const byKind = new Map<CommunityChannelKind, CommunityChannelContext>();
  for (const item of input.conversations) {
    const territoryId =
      item.conversation.territoryId?.trim() || input.territoryId;
    if (territoryId !== input.territoryId) continue;
    const kind = resolveChannelKind(item.conversation);
    const layer = resolveCommunicationLayer(kind);
    const summary = resolveConversation(item, input.viewerPersonId);
    const existing = byKind.get(kind);
    const unreadDelta = summary.unread ? 1 : 0;
    if (existing) {
      existing.unreadCount += unreadDelta;
      continue;
    }
    const channel: CommunityChannelContext = {
      id: `channel:${kind}:${input.territoryId}`,
      kind,
      layer,
      title: channelTitle(kind),
      description: channelDescription(kind),
      href: summary.href,
      unreadCount: unreadDelta,
      territoryId: input.territoryId,
      conversationId: item.conversation.id,
      requiresMembership: kind !== "official",
    };
    byKind.set(kind, channel);
    channels.push(channel);
  }
  if (input.announcements.length > 0) {
    channels.unshift({
      id: `channel:official:${input.territoryId}`,
      kind: "official",
      layer: "official",
      title: "Avisos oficiales",
      description: "Información de la administración comunitaria",
      href: "/community",
      unreadCount: 0,
      territoryId: input.territoryId,
      requiresMembership: false,
    });
  }
  return channels.sort((a, b) => a.kind.localeCompare(b.kind));
}

function channelTitle(kind: CommunityChannelKind): string {
  switch (kind) {
    case "official":
      return "Oficial";
    case "territory":
      return "Comunidad territorial";
    case "group":
      return "Grupos";
    case "experience":
      return "Actividades";
    case "reservation":
      return "Reservas";
    case "private":
      return "Mensajes privados";
    default:
      return "Comunicación";
  }
}

function channelDescription(kind: CommunityChannelKind): string {
  switch (kind) {
    case "official":
      return "Avisos de administración y moderación";
    case "territory":
      return "Coordinación entre vecinos del territorio";
    case "group":
      return "Conversaciones de grupos comunitarios";
    case "experience":
      return "Coordinación de actividades y eventos";
    case "reservation":
      return "Actualizaciones sobre tus reservas";
    case "private":
      return "Mensajes directos entre personas";
    default:
      return "Comunicación comunitaria";
  }
}

export function resolveUnreadContext(input: {
  conversations: readonly CommunityConversationSummary[];
  announcements: readonly CommunityAnnouncementExperience[];
}): CommunityUnreadContext {
  const conversationUnread = input.conversations.filter((row) => row.unread).length;
  const announcementUnread = input.announcements.filter(
    (row) => row.requiresAcknowledgement && !row.acknowledged,
  ).length;
  return {
    totalUnread: conversationUnread + announcementUnread,
    conversationUnread,
    announcementUnread,
  };
}

export function resolveCommunicationPreferences(input: {
  context: PersonalContext;
  participationPrivacy?: CommunityParticipationPrivacy;
}): CommunityCommunicationPreferences {
  const participation =
    input.participationPrivacy ?? DEFAULT_COMMUNITY_PARTICIPATION_PRIVACY;
  const recommendationsEnabled =
    input.context.privacy.receiveRecommendations !== false;
  return {
    canReceiveMessages: recommendationsEnabled && participation.receiveInvitations,
    canReceiveOfficial: true,
    canReceiveExperienceUpdates: recommendationsEnabled,
    canReceiveReservationUpdates: recommendationsEnabled,
    showInParticipants: participation.appearInParticipants,
    receiveInvitations: participation.receiveInvitations,
  };
}

export function announcementExperienceFromTerritory(
  announcement: TerritoryAnnouncement,
  acknowledgedIds?: readonly string[],
): CommunityAnnouncementExperience {
  const acknowledged = (acknowledgedIds ?? []).includes(announcement.id);
  return {
    id: announcement.id,
    tenantId: announcement.tenantId,
    territoryId: announcement.territoryId,
    title: announcement.title,
    body: announcement.body,
    priority: "important",
    territoryVisible: true,
    requiresAcknowledgement: true,
    acknowledged,
    href: `/community/content/${announcement.id}`,
    createdAt: announcement.createdAt,
  };
}

export function resolveComposerHints(input: {
  hasMembership: boolean;
  canSend: boolean;
}): CommunityCommunicationComposerHint[] {
  if (!input.hasMembership || !input.canSend) return [];
  return [
    {
      id: "hint:share-activity",
      title: "Comparte esta actividad",
      description: "Invita a vecinos a participar — tú confirmas antes de enviar",
      composerActionId: "experience_create",
      requiresConfirmation: true,
    },
    {
      id: "hint:create-group",
      title: "Crea un grupo para organizar",
      description: "Forma un grupo territorial para coordinar",
      composerActionId: "group_create",
      requiresConfirmation: true,
    },
    {
      id: "hint:invite-participants",
      title: "Invita participantes",
      description: "Abre una conversación de actividad con confirmación previa",
      composerActionId: "event_create",
      requiresConfirmation: true,
    },
  ];
}

export function projectCommunityCommunicationContext(
  input: CommunityCommunicationInput,
): CommunityCommunicationContext {
  const rawConversations = input.conversations
    .map((item) => resolveConversation(item, input.context.personId))
    .filter(
      (row) =>
        !row.territoryId || row.territoryId === input.territoryId,
    );
  const conversations = input.hasMembership ? rawConversations : [];
  const announcements = input.announcements.map((row) =>
    announcementExperienceFromTerritory(row, input.acknowledgedAnnouncementIds),
  );
  const preferences = resolveCommunicationPreferences({
    context: input.context,
    participationPrivacy: input.participationPrivacy,
  });
  const canRead = input.hasMembership || announcements.length > 0;
  const permissions: CommunityCommunicationPermissions = {
    canRead,
    canSend: input.hasMembership && preferences.canReceiveMessages,
    canReport: input.hasMembership,
    canPublishOfficial: Boolean(input.isCommunityAdmin),
    canModerate: Boolean(input.isCommunityAdmin),
    canReadPrivateAsAdmin: false,
  };
  const unread = resolveUnreadContext({ conversations, announcements });
  const channels = resolveChannels({
    conversations: input.hasMembership ? input.conversations : [],
    announcements: input.announcements,
    territoryId: input.territoryId,
    viewerPersonId: input.context.personId,
  });
  const composerHints = resolveComposerHints({
    hasMembership: input.hasMembership,
    canSend: permissions.canSend,
  });
  return {
    tenantId: input.tenantId,
    territoryId: input.territoryId,
    channels,
    conversations,
    announcements,
    preferences,
    unread,
    permissions,
    privacy: { ...input.context.privacy },
    composerHints,
    ...(input.isCommunityAdmin
      ? {
          adminSummary: {
            pendingReports: input.pendingReports ?? 0,
            territoryChannels: channels.length,
            activeAnnouncements: announcements.length,
          },
        }
      : {}),
  };
}

export function projectLifeHomeCommunicationSummary(input: {
  communication: CommunityCommunicationContext;
}): LifeHomeCommunicationSummary {
  const importantAnnouncements = input.communication.announcements.filter(
    (row) => row.priority === "important" && !row.acknowledged,
  );
  return {
    importantAnnouncements: importantAnnouncements.slice(0, 3),
    unreadCount: input.communication.unread.totalUnread,
    pendingConversations: input.communication.unread.conversationUnread,
  };
}

export function communicationRespectsTerritory(
  context: CommunityCommunicationContext,
  tenantId: string,
  territoryId: string,
): boolean {
  return context.tenantId === tenantId && context.territoryId === territoryId;
}

export function privateConversationProtected(
  conversation: CommunityConversationSummary,
  viewerPersonId: string,
  isAdmin: boolean,
): boolean {
  if (conversation.channelKind !== "private") return true;
  if (isAdmin) return false;
  return Boolean(viewerPersonId);
}

export function isOpaqueCommunityCommunicationEntity(name: string): boolean {
  return [
    "GlobalSocialNetwork",
    "UniversalChatEntity",
    "CommunityFeedMessageEntity",
    "EngagementMessagingScore",
    "GlobalNotificationWall",
    "CrossTenantCommunicationHub",
    "ResidentFollowerGraph",
    "SocialRankingSystem",
    "ExperienceChatEntity",
    "ViralMessageFeed",
    "FollowerInbox",
  ].includes(name);
}

export const ConversationExperienceService = {
  resolveConversation,
  resolveChannels,
  resolveUnreadContext,
  resolveCommunicationPreferences,
};
