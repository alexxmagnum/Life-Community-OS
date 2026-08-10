/**
 * Marketplace Listing Conversation demo foundation (Phase 1 trust repair).
 *
 * Contextual communication for a specific listing — session/catalog only.
 * Uses Communication Layer contracts (ADR-043). Context type: marketplace.
 * No DB / realtime / global inbox. Messages persist in localStorage only.
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
import {
  getMarketplaceListingById,
  marketplaceKindLabel,
  type MarketplaceListing,
} from "./marketplace";

const STORAGE_KEY = "lcos.life-panoramica.marketplace-conversations.v1";

export const MARKETPLACE_QUICK_ACTION_LABELS: Record<QuickActionKind, string> = {
  going: "Puedo pasar",
  joining: "Me interesa",
  thanks: "Gracias",
  late: "Más tarde",
};

export const DEMO_MARKETPLACE_CONVERSATION_REACTIONS: readonly ReactionType[] = [
  "thumbs_up",
  "heart",
  "clap",
];

export type MarketplaceMessageAuthorView = {
  personId: string;
  displayName: string;
  avatarUrl?: string;
};

export type MarketplaceMessageView = Message & {
  author: MarketplaceMessageAuthorView;
};

export type MarketplaceConversationBundle = {
  conversation: Conversation;
  messages: MarketplaceMessageView[];
  listing: MarketplaceListing;
  interestedPersonIds: DomainId[];
};

type ConversationStore = {
  conversations: Conversation[];
  messages: Message[];
  authors: Record<string, MarketplaceMessageAuthorView>;
  /** listingId → interested person ids (author + contactors). */
  interestedByListing: Record<string, DomainId[]>;
};

function emptyStore(): ConversationStore {
  return {
    conversations: [],
    messages: [],
    authors: {},
    interestedByListing: {},
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
      authors: parsed.authors && typeof parsed.authors === "object"
        ? parsed.authors
        : {},
      interestedByListing:
        parsed.interestedByListing &&
        typeof parsed.interestedByListing === "object"
          ? parsed.interestedByListing
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

function buildContext(listingId: string): ConversationContext {
  return {
    id: `ctx-marketplace-${listingId}`,
    contextType: "marketplace",
    contextId: listingId,
    tenantId: DEMO_TENANT_ID,
    territoryId: DEMO_TERRITORY_ID,
    moduleId: "marketplace",
  };
}

function toMessageView(
  message: Message,
  authors: Record<string, MarketplaceMessageAuthorView>,
): MarketplaceMessageView {
  const author = authors[message.authorPersonId] ?? {
    personId: message.authorPersonId,
    displayName: "Vecino",
  };
  return { ...message, author };
}

export function getMarketplaceInterestedPersonIds(
  listingId: string,
): DomainId[] {
  const store = readStore();
  return [...(store.interestedByListing[listingId] ?? [])];
}

/**
 * Register interest so the contactor can view the listing-scoped conversation.
 */
export function expressMarketplaceInterest(input: {
  listingId: string;
  personId: string;
}): DomainId[] {
  const listing = getMarketplaceListingById(input.listingId);
  if (!listing?.authorPersonId) return [];

  const store = readStore();
  const current = new Set(store.interestedByListing[input.listingId] ?? []);
  if (input.personId !== listing.authorPersonId) {
    current.add(input.personId);
  }
  const next = [...current];
  store.interestedByListing[input.listingId] = next;
  writeStore(store);
  return next;
}

export function ensureMarketplaceConversation(
  listingId: string,
): Conversation | undefined {
  const listing = getMarketplaceListingById(listingId);
  if (!listing?.authorPersonId) return undefined;

  const store = readStore();
  const existing = store.conversations.find(
    (c) =>
      c.context.contextType === "marketplace" &&
      c.context.contextId === listingId,
  );
  if (existing) return existing;

  const now = new Date().toISOString();
  const conversation: Conversation = {
    id: `conv-marketplace-${listingId}-${Date.now().toString(36)}`,
    tenantId: DEMO_TENANT_ID,
    context: buildContext(listingId),
    title: listing.title,
    status: "active",
    participantPolicy: "invited",
    createdByPersonId: listing.authorPersonId,
    createdAt: now,
    updatedAt: now,
    retentionPolicyId: "retention-marketplace",
  };
  store.conversations = [conversation, ...store.conversations];
  if (!store.interestedByListing[listingId]) {
    store.interestedByListing[listingId] = [];
  }
  store.authors[listing.authorPersonId] = {
    personId: listing.authorPersonId,
    displayName: listing.authorName,
    avatarUrl: listing.authorAvatarUrl,
  };
  writeStore(store);
  return conversation;
}

export function getMarketplaceConversationBundle(
  listingId: string,
): MarketplaceConversationBundle | undefined {
  const listing = getMarketplaceListingById(listingId);
  if (!listing?.authorPersonId) return undefined;

  const conversation = ensureMarketplaceConversation(listingId);
  if (!conversation) return undefined;

  const store = readStore();
  const interestedPersonIds = [
    ...(store.interestedByListing[listingId] ?? []),
  ];
  const messages = store.messages
    .filter((m) => m.conversationId === conversation.id && !m.deletedAt)
    .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1))
    .map((m) => toMessageView(m, store.authors));

  return { conversation, messages, listing, interestedPersonIds };
}

export function postMarketplaceMessage(input: {
  listingId: string;
  authorPersonId: string;
  authorName: string;
  authorAvatarUrl?: string;
  body: string;
}): MarketplaceMessageView | undefined {
  const bundle = getMarketplaceConversationBundle(input.listingId);
  if (!bundle) return undefined;

  const body = input.body.trim();
  if (!body) return undefined;

  expressMarketplaceInterest({
    listingId: input.listingId,
    personId: input.authorPersonId,
  });

  const store = readStore();
  const now = new Date().toISOString();
  const message: Message = {
    id: `msg-mp-${Date.now().toString(36)}`,
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

export function postMarketplaceQuickAction(input: {
  listingId: string;
  authorPersonId: string;
  authorName: string;
  authorAvatarUrl?: string;
  kind: QuickActionKind;
}): MarketplaceMessageView | undefined {
  if (!isQuickActionKind(input.kind)) return undefined;
  const bundle = getMarketplaceConversationBundle(input.listingId);
  if (!bundle) return undefined;

  expressMarketplaceInterest({
    listingId: input.listingId,
    personId: input.authorPersonId,
  });

  const store = readStore();
  const now = new Date().toISOString();
  const label = MARKETPLACE_QUICK_ACTION_LABELS[input.kind];
  const message: Message = {
    id: `msg-mp-qa-${Date.now().toString(36)}`,
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

export function toggleMarketplaceMessageReaction(input: {
  listingId: string;
  messageId: string;
  reaction: ReactionType;
}): MarketplaceMessageView | undefined {
  if (!isReactionType(input.reaction)) return undefined;
  const bundle = getMarketplaceConversationBundle(input.listingId);
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

export function marketplaceConversationSubtitle(
  listing: MarketplaceListing,
): string {
  return `${marketplaceKindLabel(listing.kind)} · ${listing.title}`;
}
