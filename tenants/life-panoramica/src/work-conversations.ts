/**
 * Work Post Conversation demo foundation (D.0.6.1).
 *
 * Contextual communication for Trabajo / WorkPost — session/catalog only.
 * Uses Communication Layer contracts (ADR-043). Context type: service.
 * No DB / realtime / global inbox.
 */

import type {
  Conversation,
  ConversationContext,
  DomainId,
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
  DEMO_PERSON_ELENA,
  DEMO_PERSON_MARTA,
  DEMO_TENANT_ID,
  DEMO_TERRITORY_ID,
} from "./demo-ids";
import { getWorkPostById, type WorkPostListing } from "./work-posts";

const STORAGE_KEY = "lcos.life-panoramica.work-conversations.v1";

/** Primary demo work post for D.0.6.1 walkthrough. */
export const DEMO_WORK_CONVERSATION_ID = "work-offering-garden";

export type WorkMessageAuthorView = {
  personId: string;
  displayName: string;
  avatarUrl?: string;
};

export type WorkMessageView = Message & {
  author: WorkMessageAuthorView;
};

export type WorkConversationBundle = {
  conversation: Conversation;
  messages: WorkMessageView[];
  workPost: WorkPostListing;
  interestedPersonIds: DomainId[];
};

type ConversationStore = {
  conversations: Conversation[];
  messages: Message[];
  authors: Record<string, WorkMessageAuthorView>;
  /** workPostId → interested person ids (author + contactors). */
  interestedByPost: Record<string, DomainId[]>;
};

const SEED_AUTHORS: Record<string, WorkMessageAuthorView> = {
  [DEMO_PERSON_ELENA]: {
    personId: DEMO_PERSON_ELENA,
    displayName: "Elena",
    avatarUrl:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&q=80",
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

function buildSeedContext(workPostId: string): ConversationContext {
  return {
    id: `ctx-service-${workPostId}`,
    contextType: "service",
    contextId: workPostId,
    tenantId: DEMO_TENANT_ID,
    territoryId: DEMO_TERRITORY_ID,
    moduleId: "services",
  };
}

function buildSeedConversation(workPostId: string): Conversation {
  const now = new Date().toISOString();
  return {
    id: `conv-service-${workPostId}`,
    tenantId: DEMO_TENANT_ID,
    context: buildSeedContext(workPostId),
    title: "Conversación del anuncio",
    status: "active",
    participantPolicy: "invited",
    createdByPersonId: DEMO_PERSON_ELENA,
    createdAt: hoursAgo(8),
    updatedAt: now,
    retentionPolicyId: "retention-service",
  };
}

function buildSeedMessages(conversationId: string): Message[] {
  return [
    {
      id: "msg-work-marta-1",
      conversationId,
      tenantId: DEMO_TENANT_ID,
      authorPersonId: DEMO_PERSON_MARTA,
      body: "Hola, vi tu anuncio.",
      createdAt: hoursAgo(3),
      mediaRefs: [],
      reactionSummary: emptyMessageReactionSummary(),
    },
    {
      id: "msg-work-elena-1",
      conversationId,
      tenantId: DEMO_TENANT_ID,
      authorPersonId: DEMO_PERSON_ELENA,
      body: "Perfecto, dime qué necesitas.",
      createdAt: hoursAgo(2),
      mediaRefs: [],
      reactionSummary: { thumbs_up: 1 },
    },
  ];
}

function seedStore(): ConversationStore {
  const conversation = buildSeedConversation(DEMO_WORK_CONVERSATION_ID);
  return {
    conversations: [conversation],
    messages: buildSeedMessages(conversation.id),
    authors: { ...SEED_AUTHORS },
    interestedByPost: {
      [DEMO_WORK_CONVERSATION_ID]: [DEMO_PERSON_MARTA],
    },
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
      interestedByPost: {
        [DEMO_WORK_CONVERSATION_ID]: [DEMO_PERSON_MARTA],
        ...(parsed.interestedByPost ?? {}),
      },
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
  authors: Record<string, WorkMessageAuthorView>,
): WorkMessageView {
  const author = authors[message.authorPersonId] ?? {
    personId: message.authorPersonId,
    displayName: "Vecino",
  };
  return { ...message, author };
}

/**
 * Work-context labels for existing QuickActionKind values.
 * Reuses Communication contracts — no new chat kinds.
 */
export const WORK_QUICK_ACTION_LABELS: Record<QuickActionKind, string> = {
  going: "Podemos hablar",
  joining: "Me interesa",
  thanks: "Gracias",
  late: "Llego tarde",
};

export const DEMO_WORK_CONVERSATION_REACTIONS: readonly ReactionType[] = [
  "thumbs_up",
  "heart",
  "laugh",
  "surprised",
  "pray",
  "clap",
];

export function getWorkInterestedPersonIds(workPostId: string): DomainId[] {
  const store = readStore();
  return [...(store.interestedByPost[workPostId] ?? [])];
}

/**
 * Mark a resident as interested (Contactar) — private context participants only.
 */
export function expressWorkInterest(input: {
  workPostId: string;
  personId: string;
}): DomainId[] {
  const post = getWorkPostById(input.workPostId);
  if (!post) return [];

  const store = readStore();
  const current = new Set(store.interestedByPost[input.workPostId] ?? []);
  if (input.personId !== post.createdByPersonId) {
    current.add(input.personId);
  }
  const next = [...current];
  store.interestedByPost[input.workPostId] = next;
  writeStore(store);
  return next;
}

/**
 * Ensure a conversation exists for a work post (catalog seed or create).
 */
export function ensureWorkConversation(
  workPostId: string,
): Conversation | undefined {
  const workPost = getWorkPostById(workPostId);
  if (!workPost) return undefined;

  const store = readStore();
  const existing = store.conversations.find(
    (c) =>
      c.context.contextType === "service" &&
      c.context.contextId === workPostId,
  );
  if (existing) return existing;

  const now = new Date().toISOString();
  const conversation: Conversation = {
    ...buildSeedConversation(workPostId),
    id: `conv-service-${workPostId}-${Date.now().toString(36)}`,
    createdAt: now,
    updatedAt: now,
    createdByPersonId: workPost.createdByPersonId,
    title: workPost.title,
  };
  store.conversations = [conversation, ...store.conversations];
  if (!store.interestedByPost[workPostId]) {
    store.interestedByPost[workPostId] = [];
  }
  writeStore(store);
  return conversation;
}

export function getWorkConversationBundle(
  workPostId: string,
): WorkConversationBundle | undefined {
  const workPost = getWorkPostById(workPostId);
  if (!workPost) return undefined;

  const conversation = ensureWorkConversation(workPostId);
  if (!conversation) return undefined;

  const store = readStore();
  const interestedPersonIds = [
    ...(store.interestedByPost[workPostId] ?? []),
  ];
  const messages = store.messages
    .filter((m) => m.conversationId === conversation.id && !m.deletedAt)
    .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1))
    .map((m) => toMessageView(m, store.authors));

  return { conversation, messages, workPost, interestedPersonIds };
}

export function postWorkMessage(input: {
  workPostId: string;
  authorPersonId: string;
  authorName: string;
  authorAvatarUrl?: string;
  body: string;
  replyToMessageId?: string;
}): WorkMessageView | undefined {
  const bundle = getWorkConversationBundle(input.workPostId);
  if (!bundle) return undefined;

  const body = input.body.trim();
  if (!body) return undefined;

  expressWorkInterest({
    workPostId: input.workPostId,
    personId: input.authorPersonId,
  });

  const store = readStore();
  const now = new Date().toISOString();
  const message: Message = {
    id: `msg-work-${Date.now().toString(36)}`,
    conversationId: bundle.conversation.id,
    tenantId: DEMO_TENANT_ID,
    authorPersonId: input.authorPersonId,
    body,
    replyToMessageId: input.replyToMessageId,
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

export function postWorkQuickAction(input: {
  workPostId: string;
  authorPersonId: string;
  authorName: string;
  authorAvatarUrl?: string;
  kind: QuickActionKind;
}): WorkMessageView | undefined {
  if (!isQuickActionKind(input.kind)) return undefined;
  const bundle = getWorkConversationBundle(input.workPostId);
  if (!bundle) return undefined;

  expressWorkInterest({
    workPostId: input.workPostId,
    personId: input.authorPersonId,
  });

  const store = readStore();
  const now = new Date().toISOString();
  const label = WORK_QUICK_ACTION_LABELS[input.kind];
  const message: Message = {
    id: `msg-work-qa-${Date.now().toString(36)}`,
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

export function toggleWorkMessageReaction(input: {
  workPostId: string;
  messageId: string;
  reaction: ReactionType;
}): WorkMessageView | undefined {
  if (!isReactionType(input.reaction)) return undefined;
  const bundle = getWorkConversationBundle(input.workPostId);
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

export function softDeleteWorkMessage(input: {
  workPostId: string;
  messageId: string;
  actorPersonId: string;
}): WorkMessageView | undefined {
  const bundle = getWorkConversationBundle(input.workPostId);
  if (!bundle) return undefined;

  const store = readStore();
  const existing = store.messages.find((m) => m.id === input.messageId);
  if (!existing) return undefined;
  if (existing.conversationId !== bundle.conversation.id) return undefined;
  if (existing.authorPersonId !== input.actorPersonId) return undefined;
  if (existing.deletedAt) return undefined;

  const updated: Message = {
    ...existing,
    deletedAt: new Date().toISOString(),
    body: undefined,
  };
  store.messages = store.messages.map((m) =>
    m.id === updated.id ? updated : m,
  );
  writeStore(store);
  return toMessageView(updated, store.authors);
}
