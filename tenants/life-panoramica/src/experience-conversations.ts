/**
 * Experience Conversation demo foundation (D.0.6).
 *
 * Contextual communication for Experiences — session/catalog only.
 * Uses Communication Layer contracts (ADR-043). No DB / realtime.
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
import { getExperienceById, type Experience } from "./experiences";

const STORAGE_KEY = "lcos.life-panoramica.experience-conversations.v1";

/** Primary demo experience for D.0.6 walkthrough. */
export const DEMO_EXPERIENCE_CONVERSATION_ID = "exp-sunrise-pines";

export type MessageAuthorView = {
  personId: string;
  displayName: string;
  avatarUrl?: string;
};

export type ExperienceMessageView = Message & {
  author: MessageAuthorView;
};

export type ExperienceConversationBundle = {
  conversation: Conversation;
  messages: ExperienceMessageView[];
  experience: Experience;
};

type ConversationStore = {
  conversations: Conversation[];
  messages: Message[];
  authors: Record<string, MessageAuthorView>;
};

const SEED_AUTHORS: Record<string, MessageAuthorView> = {
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

function buildSeedContext(experienceId: string): ConversationContext {
  return {
    id: `ctx-experience-${experienceId}`,
    contextType: "experience",
    contextId: experienceId,
    tenantId: DEMO_TENANT_ID,
    territoryId: DEMO_TERRITORY_ID,
    moduleId: "experiences",
  };
}

function buildSeedConversation(experienceId: string): Conversation {
  const now = new Date().toISOString();
  return {
    id: `conv-experience-${experienceId}`,
    tenantId: DEMO_TENANT_ID,
    context: buildSeedContext(experienceId),
    title: "Conversación del evento",
    status: "active",
    participantPolicy: "open_context",
    createdByPersonId: DEMO_PERSON_MARTA,
    createdAt: hoursAgo(26),
    updatedAt: now,
    retentionPolicyId: "retention-experience",
  };
}

function buildSeedMessages(conversationId: string): Message[] {
  return [
    {
      id: "msg-exp-ana-1",
      conversationId,
      tenantId: DEMO_TENANT_ID,
      authorPersonId: DEMO_PERSON_ANA,
      body: "¿Quedamos en la entrada principal?",
      createdAt: hoursAgo(5),
      mediaRefs: [],
      reactionSummary: emptyMessageReactionSummary(),
    },
    {
      id: "msg-exp-carlos-1",
      conversationId,
      tenantId: DEMO_TENANT_ID,
      authorPersonId: DEMO_PERSON_CARLOS,
      body: "Sí, a las 9:30",
      createdAt: hoursAgo(4),
      mediaRefs: [],
      reactionSummary: { thumbs_up: 1 },
    },
    {
      id: "msg-exp-marta-1",
      conversationId,
      tenantId: DEMO_TENANT_ID,
      authorPersonId: DEMO_PERSON_MARTA,
      body: "Subo la ruta 📍",
      createdAt: hoursAgo(3),
      mediaRefs: [],
      reactionSummary: emptyMessageReactionSummary(),
    },
  ];
}

function seedStore(): ConversationStore {
  const conversation = buildSeedConversation(DEMO_EXPERIENCE_CONVERSATION_ID);
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
  authors: Record<string, MessageAuthorView>,
): ExperienceMessageView {
  const author = authors[message.authorPersonId] ?? {
    personId: message.authorPersonId,
    displayName: "Vecino",
  };
  return { ...message, author };
}

export const QUICK_ACTION_LABELS: Record<QuickActionKind, string> = {
  going: "Voy",
  joining: "Me apunto",
  thanks: "Gracias",
  late: "Llego tarde",
};

/** Reactions shown in the D.0.6 demo surface. */
export const DEMO_CONVERSATION_REACTIONS: readonly ReactionType[] = [
  "thumbs_up",
  "heart",
  "clap",
];

/**
 * Ensure a conversation exists for an experience (catalog seed or create).
 */
export function ensureExperienceConversation(
  experienceId: string,
): Conversation | undefined {
  const experience = getExperienceById(experienceId);
  if (!experience) return undefined;

  const store = readStore();
  const existing = store.conversations.find(
    (c) =>
      c.context.contextType === "experience" &&
      c.context.contextId === experienceId,
  );
  if (existing) return existing;

  const now = new Date().toISOString();
  const conversation: Conversation = {
    ...buildSeedConversation(experienceId),
    id: `conv-experience-${experienceId}-${Date.now().toString(36)}`,
    createdAt: now,
    updatedAt: now,
    createdByPersonId: experience.createdByPersonId ?? experience.organizer.id,
  };
  store.conversations = [conversation, ...store.conversations];
  writeStore(store);
  return conversation;
}

export function getExperienceConversationBundle(
  experienceId: string,
): ExperienceConversationBundle | undefined {
  const experience = getExperienceById(experienceId);
  if (!experience) return undefined;

  const conversation = ensureExperienceConversation(experienceId);
  if (!conversation) return undefined;

  const store = readStore();
  const messages = store.messages
    .filter((m) => m.conversationId === conversation.id && !m.deletedAt)
    .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1))
    .map((m) => toMessageView(m, store.authors));

  return { conversation, messages, experience };
}

export function postExperienceMessage(input: {
  experienceId: string;
  authorPersonId: string;
  authorName: string;
  authorAvatarUrl?: string;
  body: string;
}): ExperienceMessageView | undefined {
  const bundle = getExperienceConversationBundle(input.experienceId);
  if (!bundle) return undefined;

  const body = input.body.trim();
  if (!body) return undefined;

  const store = readStore();
  const now = new Date().toISOString();
  const message: Message = {
    id: `msg-created-${Date.now().toString(36)}`,
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

export function postExperienceQuickAction(input: {
  experienceId: string;
  authorPersonId: string;
  authorName: string;
  authorAvatarUrl?: string;
  kind: QuickActionKind;
}): ExperienceMessageView | undefined {
  if (!isQuickActionKind(input.kind)) return undefined;
  const bundle = getExperienceConversationBundle(input.experienceId);
  if (!bundle) return undefined;

  const store = readStore();
  const now = new Date().toISOString();
  const label = QUICK_ACTION_LABELS[input.kind];
  const message: Message = {
    id: `msg-qa-${Date.now().toString(36)}`,
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

export function toggleExperienceMessageReaction(input: {
  experienceId: string;
  messageId: string;
  reaction: ReactionType;
}): ExperienceMessageView | undefined {
  if (!isReactionType(input.reaction)) return undefined;
  const bundle = getExperienceConversationBundle(input.experienceId);
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
