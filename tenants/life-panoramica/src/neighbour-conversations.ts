/**
 * Neighbour private chat (demo) — Tenant Content (D).
 * Opened from public posts via Contactar → ConversationExperience.
 * Not public comments. Persistence: session localStorage only.
 */

import type {
  Conversation,
  ConversationContext,
  DomainId,
  Message,
} from "@life-community-os/types";
import { emptyMessageReactionSummary } from "@life-community-os/types";
import { DEMO_TENANT_ID, DEMO_TERRITORY_ID } from "./demo-ids";
import { getDemoMemberByPersonId } from "./demo-members";
import { listPublishedCommunityContent } from "./community-content";

const STORAGE_KEY = "lcos.life-panoramica.neighbour-conversations.v1";

export type NeighbourMessageAuthorView = {
  personId: string;
  displayName: string;
  avatarUrl?: string;
};

export type NeighbourMessageView = Message & {
  author: NeighbourMessageAuthorView;
};

export type NeighbourConversationBundle = {
  conversation: Conversation;
  messages: NeighbourMessageView[];
  peerPersonId: DomainId;
  peerName: string;
  peerAvatarUrl?: string;
};

type ConversationStore = {
  conversations: Conversation[];
  messages: Message[];
  authors: Record<string, NeighbourMessageAuthorView>;
  peerMeta: Record<string, { name: string; avatarUrl?: string }>;
};

function emptyStore(): ConversationStore {
  return {
    conversations: [],
    messages: [],
    authors: {},
    peerMeta: {},
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
      peerMeta:
        parsed.peerMeta && typeof parsed.peerMeta === "object"
          ? parsed.peerMeta
          : {},
    };
  } catch {
    return emptyStore();
  }
}

function writeStore(store: ConversationStore) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function threadKey(a: string, b: string): string {
  return [a, b].sort().join("__");
}

function buildContext(threadId: string): ConversationContext {
  return {
    id: `ctx-neighbour-${threadId}`,
    contextType: "neighbour",
    contextId: threadId,
    tenantId: DEMO_TENANT_ID,
    territoryId: DEMO_TERRITORY_ID,
    moduleId: "community",
  };
}

function toMessageView(
  message: Message,
  authors: Record<string, NeighbourMessageAuthorView>,
): NeighbourMessageView {
  const author = authors[message.authorPersonId] ?? {
    personId: message.authorPersonId,
    displayName: "Vecino",
  };
  return { ...message, author };
}

export function resolveNeighbourPeer(personId: string): {
  personId: string;
  name: string;
  avatarUrl?: string;
} | null {
  if (!personId.trim() || personId.startsWith("org-")) return null;
  const member = getDemoMemberByPersonId(personId);
  if (member) {
    return {
      personId: member.personId,
      name: member.displayName,
      avatarUrl: member.avatarUrl,
    };
  }
  const fromContent = listPublishedCommunityContent().find(
    (c) => c.author.id === personId,
  );
  if (fromContent) {
    return {
      personId: fromContent.author.id,
      name: fromContent.author.name,
      avatarUrl: fromContent.author.avatarUrl,
    };
  }
  return {
    personId,
    name: "Vecino",
  };
}

export function ensureNeighbourConversation(input: {
  viewerPersonId: string;
  peerPersonId: string;
  peerName?: string;
  peerAvatarUrl?: string;
}): Conversation | undefined {
  const peer = resolveNeighbourPeer(input.peerPersonId);
  if (!peer) return undefined;
  if (input.viewerPersonId === peer.personId) return undefined;

  const key = threadKey(input.viewerPersonId, peer.personId);
  const store = readStore();
  const existing = store.conversations.find(
    (c) =>
      c.context.contextType === "neighbour" && c.context.contextId === key,
  );
  if (existing) {
    store.peerMeta[peer.personId] = {
      name: input.peerName?.trim() || peer.name,
      avatarUrl: input.peerAvatarUrl ?? peer.avatarUrl,
    };
    writeStore(store);
    return existing;
  }

  const now = new Date().toISOString();
  const conversation: Conversation = {
    id: `conv-neighbour-${key}`,
    tenantId: DEMO_TENANT_ID,
    context: buildContext(key),
    title: input.peerName?.trim() || peer.name,
    status: "active",
    participantPolicy: "invited",
    createdByPersonId: input.viewerPersonId,
    createdAt: now,
    updatedAt: now,
    retentionPolicyId: "retention-neighbour",
  };
  store.conversations = [conversation, ...store.conversations];
  store.peerMeta[peer.personId] = {
    name: input.peerName?.trim() || peer.name,
    avatarUrl: input.peerAvatarUrl ?? peer.avatarUrl,
  };
  writeStore(store);
  return conversation;
}

export function getNeighbourConversationBundle(input: {
  viewerPersonId: string;
  peerPersonId: string;
}): NeighbourConversationBundle | undefined {
  const peer = resolveNeighbourPeer(input.peerPersonId);
  if (!peer) return undefined;
  if (input.viewerPersonId === peer.personId) return undefined;

  const conversation = ensureNeighbourConversation({
    viewerPersonId: input.viewerPersonId,
    peerPersonId: peer.personId,
    peerName: peer.name,
    peerAvatarUrl: peer.avatarUrl,
  });
  if (!conversation) return undefined;

  const store = readStore();
  const meta = store.peerMeta[peer.personId];
  const messages = store.messages
    .filter((m) => m.conversationId === conversation.id)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map((m) => toMessageView(m, store.authors));

  return {
    conversation,
    messages,
    peerPersonId: peer.personId,
    peerName: meta?.name || peer.name,
    peerAvatarUrl: meta?.avatarUrl ?? peer.avatarUrl,
  };
}

export function postNeighbourMessage(input: {
  viewerPersonId: string;
  peerPersonId: string;
  authorPersonId: string;
  authorName: string;
  authorAvatarUrl?: string;
  body: string;
  replyToMessageId?: string;
}): NeighbourMessageView | undefined {
  const bundle = getNeighbourConversationBundle({
    viewerPersonId: input.viewerPersonId,
    peerPersonId: input.peerPersonId,
  });
  if (!bundle) return undefined;

  const body = input.body.trim();
  if (!body) return undefined;

  const store = readStore();
  const now = new Date().toISOString();
  const message: Message = {
    id: `msg-neighbour-${Date.now().toString(36)}`,
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

export function softDeleteNeighbourMessage(input: {
  viewerPersonId: string;
  peerPersonId: string;
  messageId: string;
  actorPersonId: string;
}): boolean {
  const bundle = getNeighbourConversationBundle({
    viewerPersonId: input.viewerPersonId,
    peerPersonId: input.peerPersonId,
  });
  if (!bundle) return false;

  const store = readStore();
  const msg = store.messages.find((m) => m.id === input.messageId);
  if (!msg || msg.conversationId !== bundle.conversation.id) return false;
  if (msg.authorPersonId !== input.actorPersonId) return false;
  if (msg.deletedAt) return false;

  store.messages = store.messages.map((m) =>
    m.id === input.messageId
      ? {
          ...m,
          body: undefined,
          deletedAt: new Date().toISOString(),
        }
      : m,
  );
  writeStore(store);
  return true;
}
