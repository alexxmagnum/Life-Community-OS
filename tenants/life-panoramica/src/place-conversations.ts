/**
 * Place conversation demo foundation (Phase 2.1) — Tenant Content (D).
 *
 * Uses Platform Core Conversation contracts (A). Browser localStorage is the
 * working copy; apps/web may hydrate/push the same JSON via /api/durable.
 * Not a Platform Conversation service. Not Panoramica-specific contracts.
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
import { DEMO_TENANT_ID, DEMO_TERRITORY_ID } from "./demo-ids";
import { getLocalEntityById } from "./local-places";

const STORAGE_KEY = "lcos.life-panoramica.place-conversations.v1";

/** Stable browser key — durable sync in apps/web hydrates/pushes this blob. */
export const PLACE_CONVERSATIONS_STORAGE_KEY = STORAGE_KEY;

type PlaceConversationStoreSync = (storeJson: string) => void;
let durableSync: PlaceConversationStoreSync | null = null;

/** Optional hook for apps/web durable bridge (no domain move). */
export function setPlaceConversationDurableSync(
  handler: PlaceConversationStoreSync | null,
): void {
  durableSync = handler;
}

export const PLACE_QUICK_ACTION_LABELS: Record<QuickActionKind, string> = {
  going: "Yo también",
  joining: "Me interesa",
  thanks: "Gracias",
  late: "Más tarde",
};

export const DEMO_PLACE_CONVERSATION_REACTIONS: readonly ReactionType[] = [
  "thumbs_up",
  "heart",
  "laugh",
  "surprised",
  "pray",
  "clap",
];

export type PlaceMessageAuthorView = {
  personId: string;
  displayName: string;
  avatarUrl?: string;
};

export type PlaceMessageView = Message & {
  author: PlaceMessageAuthorView;
};

export type PlaceConversationBundle = {
  conversation: Conversation;
  messages: PlaceMessageView[];
  placeId: string;
  placeName: string;
  participantPersonIds: DomainId[];
};

type ConversationStore = {
  conversations: Conversation[];
  messages: Message[];
  authors: Record<string, PlaceMessageAuthorView>;
  participantsByPlace: Record<string, DomainId[]>;
};

function emptyStore(): ConversationStore {
  return {
    conversations: [],
    messages: [],
    authors: {},
    participantsByPlace: {},
  };
}

function readStore(): ConversationStore {
  if (typeof window === "undefined") return emptyStore();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw) as ConversationStore;
    return {
      conversations: Array.isArray(parsed.conversations)
        ? parsed.conversations
        : [],
      messages: Array.isArray(parsed.messages) ? parsed.messages : [],
      authors:
        parsed.authors && typeof parsed.authors === "object"
          ? parsed.authors
          : {},
      participantsByPlace:
        parsed.participantsByPlace &&
        typeof parsed.participantsByPlace === "object"
          ? parsed.participantsByPlace
          : {},
    };
  } catch {
    return emptyStore();
  }
}

function writeStore(store: ConversationStore) {
  if (typeof window === "undefined") return;
  const raw = JSON.stringify(store);
  window.localStorage.setItem(STORAGE_KEY, raw);
  durableSync?.(raw);
}

/** Replace local store from durable hydrate (apps/web). */
export function applyPlaceConversationStoreJson(raw: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const parsed = JSON.parse(raw) as ConversationStore;
    if (!parsed || typeof parsed !== "object") return false;
    const normalized: ConversationStore = {
      conversations: Array.isArray(parsed.conversations)
        ? parsed.conversations
        : [],
      messages: Array.isArray(parsed.messages) ? parsed.messages : [],
      authors:
        parsed.authors && typeof parsed.authors === "object"
          ? parsed.authors
          : {},
      participantsByPlace:
        parsed.participantsByPlace &&
        typeof parsed.participantsByPlace === "object"
          ? parsed.participantsByPlace
          : {},
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    return true;
  } catch {
    return false;
  }
}

function buildContext(placeId: string): ConversationContext {
  return {
    id: `ctx-place-${placeId}`,
    contextType: "place",
    contextId: placeId,
    tenantId: DEMO_TENANT_ID,
    territoryId: DEMO_TERRITORY_ID,
    moduleId: "nearby",
  };
}

function toMessageView(
  message: Message,
  authors: Record<string, PlaceMessageAuthorView>,
): PlaceMessageView {
  const author = authors[message.authorPersonId] ?? {
    personId: message.authorPersonId,
    displayName: "Vecino",
  };
  return { ...message, author };
}

export function getPlaceParticipantPersonIds(placeId: string): DomainId[] {
  return [...(readStore().participantsByPlace[placeId] ?? [])];
}

export function joinPlaceConversation(input: {
  placeId: string;
  personId: string;
}): DomainId[] {
  const place = getLocalEntityById(input.placeId);
  if (!place) return [];

  const store = readStore();
  const current = new Set(store.participantsByPlace[input.placeId] ?? []);
  current.add(input.personId);
  const next = [...current];
  store.participantsByPlace[input.placeId] = next;
  writeStore(store);
  return next;
}

export function ensurePlaceConversation(
  placeId: string,
): Conversation | undefined {
  const place = getLocalEntityById(placeId);
  if (!place) return undefined;

  const store = readStore();
  const existing = store.conversations.find(
    (c) =>
      c.context.contextType === "place" && c.context.contextId === placeId,
  );
  if (existing) return existing;

  const now = new Date().toISOString();
  const conversation: Conversation = {
    id: `conv-place-${placeId}-${Date.now().toString(36)}`,
    tenantId: DEMO_TENANT_ID,
    context: buildContext(placeId),
    title: place.name,
    status: "active",
    participantPolicy: "open_context",
    createdByPersonId: "system",
    createdAt: now,
    updatedAt: now,
    retentionPolicyId: "retention-place",
  };
  store.conversations = [conversation, ...store.conversations];
  if (!store.participantsByPlace[placeId]) {
    store.participantsByPlace[placeId] = [];
  }
  writeStore(store);
  return conversation;
}

export function getPlaceConversationBundle(
  placeId: string,
): PlaceConversationBundle | undefined {
  const place = getLocalEntityById(placeId);
  if (!place) return undefined;

  const conversation = ensurePlaceConversation(placeId);
  if (!conversation) return undefined;

  const store = readStore();
  const participantPersonIds = [
    ...(store.participantsByPlace[placeId] ?? []),
  ];
  const messages = store.messages
    .filter((m) => m.conversationId === conversation.id && !m.deletedAt)
    .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1))
    .map((m) => toMessageView(m, store.authors));

  return {
    conversation,
    messages,
    placeId: place.id,
    placeName: place.name,
    participantPersonIds,
  };
}

export function postPlaceMessage(input: {
  placeId: string;
  authorPersonId: string;
  authorName: string;
  authorAvatarUrl?: string;
  body: string;
  replyToMessageId?: string;
}): PlaceMessageView | undefined {
  const bundle = getPlaceConversationBundle(input.placeId);
  if (!bundle) return undefined;

  const body = input.body.trim();
  if (!body) return undefined;

  joinPlaceConversation({
    placeId: input.placeId,
    personId: input.authorPersonId,
  });

  const store = readStore();
  const now = new Date().toISOString();
  const message: Message = {
    id: `msg-place-${Date.now().toString(36)}`,
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

export function postPlaceQuickAction(input: {
  placeId: string;
  authorPersonId: string;
  authorName: string;
  authorAvatarUrl?: string;
  kind: QuickActionKind;
}): PlaceMessageView | undefined {
  if (!isQuickActionKind(input.kind)) return undefined;
  const bundle = getPlaceConversationBundle(input.placeId);
  if (!bundle) return undefined;

  joinPlaceConversation({
    placeId: input.placeId,
    personId: input.authorPersonId,
  });

  const store = readStore();
  const now = new Date().toISOString();
  const label = PLACE_QUICK_ACTION_LABELS[input.kind];
  const message: Message = {
    id: `msg-place-qa-${Date.now().toString(36)}`,
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

export function togglePlaceMessageReaction(input: {
  placeId: string;
  messageId: string;
  reaction: ReactionType;
}): PlaceMessageView | undefined {
  if (!isReactionType(input.reaction)) return undefined;
  const bundle = getPlaceConversationBundle(input.placeId);
  if (!bundle) return undefined;

  const store = readStore();
  const existing = store.messages.find((m) => m.id === input.messageId);
  if (!existing || existing.conversationId !== bundle.conversation.id) {
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

  const updated: Message = { ...existing, reactionSummary: current };
  store.messages = store.messages.map((m) =>
    m.id === updated.id ? updated : m,
  );
  writeStore(store);
  return toMessageView(updated, store.authors);
}

export function softDeletePlaceMessage(input: {
  placeId: string;
  messageId: string;
  actorPersonId: string;
}): PlaceMessageView | undefined {
  const bundle = getPlaceConversationBundle(input.placeId);
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
