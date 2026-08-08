/**
 * Group Conversation demo foundation (D.0.6.2).
 *
 * Long-lived contextual communication for Community Groups.
 * Uses Communication Layer contracts (ADR-043). contextType: group.
 * No DB / realtime / global inbox.
 */

import type {
  Conversation,
  ConversationContext,
  Message,
  MessageReactionSummary,
  QuickActionKind,
  ReactionType,
} from "@life-community-os/types";
import {
  emptyMessageReactionSummary,
  isQuickActionKind,
  isReactionType,
} from "@life-community-os/types";
import {
  DEMO_PERSON_ANA,
  DEMO_PERSON_CARLOS,
  DEMO_PERSON_MARTA,
  DEMO_TENANT_ID,
  DEMO_TERRITORY_ID,
} from "./demo-ids";
import {
  getGroupById,
  getGroupModeratorPersonIds,
  listGroupMemberships,
  toDomainCommunityGroup,
  type CommunityGroup,
} from "./groups";

const STORAGE_KEY = "lcos.life-panoramica.group-conversations.v1";

/** Primary demo group for D.0.6.2 walkthrough. */
export const DEMO_GROUP_CONVERSATION_ID = "g-golf";

export type GroupMessageAuthorView = {
  personId: string;
  displayName: string;
  avatarUrl?: string;
};

export type GroupMessageView = Message & {
  author: GroupMessageAuthorView;
};

export type GroupConversationBundle = {
  conversation: Conversation;
  messages: GroupMessageView[];
  group: CommunityGroup;
};

type ConversationStore = {
  conversations: Conversation[];
  messages: Message[];
  authors: Record<string, GroupMessageAuthorView>;
};

const SEED_AUTHORS: Record<string, GroupMessageAuthorView> = {
  [DEMO_PERSON_ANA]: {
    personId: DEMO_PERSON_ANA,
    displayName: "Ana",
    avatarUrl:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80",
  },
  [DEMO_PERSON_CARLOS]: {
    personId: DEMO_PERSON_CARLOS,
    displayName: "Carlos",
    avatarUrl:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80",
  },
  [DEMO_PERSON_MARTA]: {
    personId: DEMO_PERSON_MARTA,
    displayName: "Marta",
    avatarUrl:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&q=80",
  },
};

function hoursAgo(hours: number): string {
  const d = new Date();
  d.setHours(d.getHours() - hours);
  return d.toISOString();
}

function buildSeedContext(groupId: string): ConversationContext {
  return {
    id: `ctx-group-${groupId}`,
    contextType: "group",
    contextId: groupId,
    tenantId: DEMO_TENANT_ID,
    territoryId: DEMO_TERRITORY_ID,
    moduleId: "community.groups",
  };
}

function buildSeedConversation(groupId: string): Conversation {
  const group = getGroupById(groupId);
  const now = new Date().toISOString();
  return {
    id: `conv-group-${groupId}`,
    tenantId: DEMO_TENANT_ID,
    context: buildSeedContext(groupId),
    title: group?.name ?? "Conversación del grupo",
    status: "active",
    participantPolicy: "open_context",
    createdByPersonId: group?.ownerPersonId ?? DEMO_PERSON_MARTA,
    createdAt: hoursAgo(72),
    updatedAt: now,
    retentionPolicyId: "retention-group",
  };
}

function buildSeedMessages(conversationId: string): Message[] {
  return [
    {
      id: "msg-group-ana-1",
      conversationId,
      tenantId: DEMO_TENANT_ID,
      authorPersonId: DEMO_PERSON_ANA,
      body: "¿Jugamos el sábado?",
      createdAt: hoursAgo(6),
      mediaRefs: [],
      reactionSummary: emptyMessageReactionSummary(),
    },
    {
      id: "msg-group-carlos-1",
      conversationId,
      tenantId: DEMO_TENANT_ID,
      authorPersonId: DEMO_PERSON_CARLOS,
      body: "Yo me apunto",
      quickActionKind: "joining",
      createdAt: hoursAgo(5),
      mediaRefs: [],
      reactionSummary: { thumbs_up: 1 },
    },
    {
      id: "msg-group-marta-1",
      conversationId,
      tenantId: DEMO_TENANT_ID,
      authorPersonId: DEMO_PERSON_MARTA,
      body: "Perfecto, reservo campo.",
      createdAt: hoursAgo(4),
      mediaRefs: [],
      reactionSummary: emptyMessageReactionSummary(),
    },
  ];
}

function seedStore(): ConversationStore {
  const conversation = buildSeedConversation(DEMO_GROUP_CONVERSATION_ID);
  return {
    conversations: [conversation],
    messages: buildSeedMessages(conversation.id),
    authors: { ...SEED_AUTHORS },
  };
}

function readStore(): ConversationStore {
  if (typeof window === "undefined") return seedStore();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = seedStore();
      writeStore(seeded);
      return seeded;
    }
    const parsed = JSON.parse(raw) as ConversationStore;
    if (
      !parsed ||
      !Array.isArray(parsed.conversations) ||
      !Array.isArray(parsed.messages)
    ) {
      const seeded = seedStore();
      writeStore(seeded);
      return seeded;
    }
    return {
      conversations: parsed.conversations,
      messages: parsed.messages,
      authors: { ...SEED_AUTHORS, ...(parsed.authors ?? {}) },
    };
  } catch {
    const seeded = seedStore();
    writeStore(seeded);
    return seeded;
  }
}

function writeStore(store: ConversationStore) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function toMessageView(
  message: Message,
  authors: Record<string, GroupMessageAuthorView>,
): GroupMessageView {
  const author = authors[message.authorPersonId] ?? {
    personId: message.authorPersonId,
    displayName: "Vecino",
  };
  return { ...message, author };
}

/**
 * Group-context quick action labels (long-lived community coordination).
 * Reuses QuickActionKind — no Work-specific wording.
 */
export const GROUP_QUICK_ACTION_LABELS: Record<QuickActionKind, string> = {
  going: "Voy",
  joining: "Me apunto",
  thanks: "Gracias",
  late: "Llego tarde",
};

export const DEMO_GROUP_CONVERSATION_REACTIONS: readonly ReactionType[] = [
  "thumbs_up",
  "heart",
  "clap",
];

export function getGroupConversationSnapshotParts(groupId: string) {
  const group = getGroupById(groupId);
  if (!group) return undefined;
  return {
    group: toDomainCommunityGroup(group),
    memberships: listGroupMemberships(groupId),
    moderatorPersonIds: getGroupModeratorPersonIds(groupId),
  };
}

/**
 * Ensure a long-lived conversation exists for a group.
 */
export function ensureGroupConversation(
  groupId: string,
): Conversation | undefined {
  const group = getGroupById(groupId);
  if (!group) return undefined;

  const store = readStore();
  const existing = store.conversations.find(
    (c) =>
      c.context.contextType === "group" && c.context.contextId === groupId,
  );
  if (existing) {
    if (existing.status === "archived" && group.status === "active") {
      const revived = { ...existing, status: "active" as const };
      store.conversations = store.conversations.map((c) =>
        c.id === revived.id ? revived : c,
      );
      writeStore(store);
      return revived;
    }
    return existing;
  }

  const now = new Date().toISOString();
  const conversation: Conversation = {
    ...buildSeedConversation(groupId),
    id: `conv-group-${groupId}-${Date.now().toString(36)}`,
    createdAt: now,
    updatedAt: now,
    createdByPersonId: group.ownerPersonId ?? DEMO_PERSON_MARTA,
    title: group.name,
    status: group.status === "archived" ? "archived" : "active",
  };
  store.conversations = [conversation, ...store.conversations];
  writeStore(store);
  return conversation;
}

export function getGroupConversationBundle(
  groupId: string,
): GroupConversationBundle | undefined {
  const group = getGroupById(groupId);
  if (!group) return undefined;

  const conversation = ensureGroupConversation(groupId);
  if (!conversation) return undefined;

  // Archive follows group lifecycle.
  if (group.status === "archived" && conversation.status !== "archived") {
    const store = readStore();
    const archived: Conversation = {
      ...conversation,
      status: "archived",
      archivedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.conversations = store.conversations.map((c) =>
      c.id === archived.id ? archived : c,
    );
    writeStore(store);
  }

  const store = readStore();
  const current =
    store.conversations.find((c) => c.id === conversation.id) ?? conversation;
  const messages = store.messages
    .filter((m) => m.conversationId === current.id && !m.deletedAt)
    .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1))
    .map((m) => toMessageView(m, store.authors));

  return { conversation: current, messages, group };
}

export function postGroupMessage(input: {
  groupId: string;
  authorPersonId: string;
  authorName: string;
  authorAvatarUrl?: string;
  body: string;
}): GroupMessageView | undefined {
  const bundle = getGroupConversationBundle(input.groupId);
  if (!bundle) return undefined;
  if (bundle.conversation.status === "archived") return undefined;
  if (bundle.group.status === "archived") return undefined;

  const body = input.body.trim();
  if (!body) return undefined;

  const store = readStore();
  const now = new Date().toISOString();
  const message: Message = {
    id: `msg-group-${Date.now().toString(36)}`,
    conversationId: bundle.conversation.id,
    tenantId: DEMO_TENANT_ID,
    authorPersonId: input.authorPersonId,
    body,
    createdAt: now,
    mediaRefs: [],
    reactionSummary: emptyMessageReactionSummary(),
  };

  store.authors[input.authorPersonId] = {
    personId: input.authorPersonId,
    displayName: input.authorName.trim() || "Vecino",
    avatarUrl: input.authorAvatarUrl,
  };
  store.messages = [...store.messages, message];
  store.conversations = store.conversations.map((c) =>
    c.id === bundle.conversation.id ? { ...c, updatedAt: now } : c,
  );
  writeStore(store);
  return toMessageView(message, store.authors);
}

export function postGroupQuickAction(input: {
  groupId: string;
  authorPersonId: string;
  authorName: string;
  authorAvatarUrl?: string;
  kind: QuickActionKind;
}): GroupMessageView | undefined {
  if (!isQuickActionKind(input.kind)) return undefined;
  const bundle = getGroupConversationBundle(input.groupId);
  if (!bundle) return undefined;
  if (bundle.conversation.status === "archived") return undefined;
  if (bundle.group.status === "archived") return undefined;

  const store = readStore();
  const now = new Date().toISOString();
  const label = GROUP_QUICK_ACTION_LABELS[input.kind];
  const message: Message = {
    id: `msg-group-qa-${Date.now().toString(36)}`,
    conversationId: bundle.conversation.id,
    tenantId: DEMO_TENANT_ID,
    authorPersonId: input.authorPersonId,
    body: label,
    quickActionKind: input.kind,
    createdAt: now,
    mediaRefs: [],
    reactionSummary: emptyMessageReactionSummary(),
  };

  store.authors[input.authorPersonId] = {
    personId: input.authorPersonId,
    displayName: input.authorName.trim() || "Vecino",
    avatarUrl: input.authorAvatarUrl,
  };
  store.messages = [...store.messages, message];
  store.conversations = store.conversations.map((c) =>
    c.id === bundle.conversation.id ? { ...c, updatedAt: now } : c,
  );
  writeStore(store);
  return toMessageView(message, store.authors);
}

export function toggleGroupMessageReaction(input: {
  groupId: string;
  messageId: string;
  reaction: ReactionType;
}): GroupMessageView | undefined {
  if (!isReactionType(input.reaction)) return undefined;
  const bundle = getGroupConversationBundle(input.groupId);
  if (!bundle) return undefined;

  const store = readStore();
  const existing = store.messages.find((m) => m.id === input.messageId);
  if (!existing) return undefined;
  if (existing.conversationId !== bundle.conversation.id) {
    return undefined;
  }

  const current: MessageReactionSummary = {
    ...emptyMessageReactionSummary(),
    ...existing.reactionSummary,
  };
  const prev = current[input.reaction] ?? 0;
  if (prev <= 0) {
    current[input.reaction] = 1;
  } else {
    delete current[input.reaction];
  }

  const updated: Message = {
    ...existing,
    reactionSummary: current,
  };
  store.messages = store.messages.map((m) =>
    m.id === updated.id ? updated : m,
  );
  writeStore(store);
  return toMessageView(updated, store.authors);
}
