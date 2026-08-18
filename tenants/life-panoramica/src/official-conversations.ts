/**
 * Official Contextual Communication demo foundation (D.0.6.3).
 *
 * Contextual notices for Official Entities — session/catalog only.
 * Uses Communication Layer contracts (ADR-043). contextType: official.
 * Not a resident chat room. No DB / realtime / global inbox.
 */

import type {
  Conversation,
  ConversationContext,
  Message,
  MessageReactionSummary,
  OfficialConversationSnapshot,
  OfficialInteractionMode,
  QuickActionKind,
  ReactionType,
} from "@life-community-os/types";
import {
  emptyMessageReactionSummary,
  isQuickActionKind,
  isReactionType,
} from "@life-community-os/types";
import {
  DEMO_AUTHORITY_ADMIN_ID,
  DEMO_AUTHORITY_MUNICIPALITY_ID,
  DEMO_AUTHORITY_PUBLIC_SERVICES_ID,
  DEMO_AUTHORITY_SECURITY_ID,
  DEMO_PERSON_ANA,
  DEMO_PERSON_MARTA,
  DEMO_PERSON_OWNER_ALDEA,
  DEMO_TENANT_ID,
  DEMO_TERRITORY_ID,
} from "./demo-ids";
import {
  getOfficialEntityById,
  getOfficialEntityBySlug,
  toOfficialAdapterKind,
  type OfficialEntityProfile,
} from "./official-entities";

const STORAGE_KEY = "lcos.life-panoramica.official-conversations.v1";

export const OFFICIAL_CONVERSATIONS_STORAGE_KEY = STORAGE_KEY;

type OfficialConversationStoreSync = (storeJson: string) => void;
let durableSync: OfficialConversationStoreSync | null = null;

export function setOfficialConversationDurableSync(
  handler: OfficialConversationStoreSync | null,
): void {
  durableSync = handler;
}

export function applyOfficialConversationStoreJson(raw: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const parsed = JSON.parse(raw) as ConversationStore;
    if (!parsed || typeof parsed !== "object") return false;
    if (!Array.isArray(parsed.conversations) || !Array.isArray(parsed.messages)) {
      return false;
    }
    window.localStorage.setItem(STORAGE_KEY, raw);
    return true;
  } catch {
    return false;
  }
}

/** Primary security notice (announcement only). */
export const DEMO_OFFICIAL_SECURITY_NOTICE_ID = "off-security-barriers";
/** Primary administration notice (with responses). */
export const DEMO_OFFICIAL_ADMIN_NOTICE_ID = "off-admin-consult";

export type OfficialMessageAuthorView = {
  personId: string;
  displayName: string;
  avatarUrl?: string;
  /** Official staff voice vs resident. */
  isOfficial?: boolean;
};

export type OfficialMessageView = Message & {
  author: OfficialMessageAuthorView;
};

export type OfficialConversationBundle = {
  conversation: Conversation;
  messages: OfficialMessageView[];
  snapshot: OfficialConversationSnapshot;
  entity: OfficialEntityProfile;
};

type ConversationStore = {
  snapshots: OfficialConversationSnapshot[];
  conversations: Conversation[];
  messages: Message[];
  authors: Record<string, OfficialMessageAuthorView>;
};

const SEED_AUTHORS: Record<string, OfficialMessageAuthorView> = {
  [DEMO_PERSON_OWNER_ALDEA]: {
    personId: DEMO_PERSON_OWNER_ALDEA,
    displayName: "Seguridad",
    isOfficial: true,
  },
  [`staff-${DEMO_AUTHORITY_ADMIN_ID}`]: {
    personId: `staff-${DEMO_AUTHORITY_ADMIN_ID}`,
    displayName: "Administración",
    isOfficial: true,
  },
  [DEMO_PERSON_ANA]: {
    personId: DEMO_PERSON_ANA,
    displayName: "Ana",
    avatarUrl:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80",
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

function buildContext(noticeId: string): ConversationContext {
  return {
    id: `ctx-official-${noticeId}`,
    contextType: "official",
    contextId: noticeId,
    tenantId: DEMO_TENANT_ID,
    territoryId: DEMO_TERRITORY_ID,
    moduleId: "official",
  };
}

function buildConversation(
  noticeId: string,
  title: string,
  createdBy: string,
  policy: Conversation["participantPolicy"],
): Conversation {
  const now = new Date().toISOString();
  return {
    id: `conv-official-${noticeId}`,
    tenantId: DEMO_TENANT_ID,
    context: buildContext(noticeId),
    title,
    status: "active",
    participantPolicy: policy,
    createdByPersonId: createdBy,
    createdAt: hoursAgo(20),
    updatedAt: now,
    retentionPolicyId: "retention-official-long",
  };
}

function seedSnapshots(): OfficialConversationSnapshot[] {
  return [
    {
      id: DEMO_OFFICIAL_SECURITY_NOTICE_ID,
      title: "Revisión de barreras",
      officialEntityId: DEMO_AUTHORITY_SECURITY_ID,
      kind: "security",
      status: "active",
      interactionMode: "announcement_only",
      reactionsEnabled: true,
      staffPersonIds: [DEMO_PERSON_OWNER_ALDEA],
    },
    {
      id: DEMO_OFFICIAL_ADMIN_NOTICE_ID,
      title: "Consulta de administración",
      officialEntityId: DEMO_AUTHORITY_ADMIN_ID,
      kind: "administration",
      status: "active",
      interactionMode: "announcement_with_responses",
      reactionsEnabled: true,
      staffPersonIds: [`staff-${DEMO_AUTHORITY_ADMIN_ID}`],
    },
    {
      id: "off-municipality-notice",
      title: "Aviso municipal",
      officialEntityId: DEMO_AUTHORITY_MUNICIPALITY_ID,
      kind: "municipality",
      status: "active",
      interactionMode: "announcement_only",
      reactionsEnabled: true,
      staffPersonIds: [`staff-${DEMO_AUTHORITY_MUNICIPALITY_ID}`],
    },
    {
      id: "off-public-services-notice",
      title: "Información de servicios públicos",
      officialEntityId: DEMO_AUTHORITY_PUBLIC_SERVICES_ID,
      kind: "public_service",
      status: "active",
      interactionMode: "announcement_only",
      reactionsEnabled: true,
      staffPersonIds: [`staff-${DEMO_AUTHORITY_PUBLIC_SERVICES_ID}`],
    },
  ];
}

function seedMessages(): Message[] {
  const securityConv = `conv-official-${DEMO_OFFICIAL_SECURITY_NOTICE_ID}`;
  const adminConv = `conv-official-${DEMO_OFFICIAL_ADMIN_NOTICE_ID}`;
  const muniConv = "conv-official-off-municipality-notice";
  const publicConv = "conv-official-off-public-services-notice";
  return [
    {
      id: "msg-off-sec-1",
      conversationId: securityConv,
      tenantId: DEMO_TENANT_ID,
      authorPersonId: DEMO_PERSON_OWNER_ALDEA,
      body: "Mañana revisión de barreras",
      createdAt: hoursAgo(8),
      mediaRefs: [],
      reactionSummary: { thumbs_up: 2 },
    },
    {
      id: "msg-off-admin-1",
      conversationId: adminConv,
      tenantId: DEMO_TENANT_ID,
      authorPersonId: `staff-${DEMO_AUTHORITY_ADMIN_ID}`,
      body: "¿Tenéis alguna duda sobre el nuevo horario de la administración?",
      createdAt: hoursAgo(10),
      mediaRefs: [],
      reactionSummary: emptyMessageReactionSummary(),
    },
    {
      id: "msg-off-admin-ana-1",
      conversationId: adminConv,
      tenantId: DEMO_TENANT_ID,
      authorPersonId: DEMO_PERSON_ANA,
      body: "¿A qué hora empieza?",
      createdAt: hoursAgo(7),
      mediaRefs: [],
      reactionSummary: emptyMessageReactionSummary(),
    },
    {
      id: "msg-off-muni-1",
      conversationId: muniConv,
      tenantId: DEMO_TENANT_ID,
      authorPersonId: `staff-${DEMO_AUTHORITY_MUNICIPALITY_ID}`,
      body: "Recogida especial de residuos este viernes en la zona centro.",
      createdAt: hoursAgo(12),
      mediaRefs: [],
      reactionSummary: emptyMessageReactionSummary(),
    },
    {
      id: "msg-off-public-1",
      conversationId: publicConv,
      tenantId: DEMO_TENANT_ID,
      authorPersonId: `staff-${DEMO_AUTHORITY_PUBLIC_SERVICES_ID}`,
      body: "Punto de información sanitaria abierto en el centro cívico.",
      createdAt: hoursAgo(14),
      mediaRefs: [],
      reactionSummary: emptyMessageReactionSummary(),
    },
  ];
}

function seedStore(): ConversationStore {
  const snapshots = seedSnapshots();
  const conversations = snapshots.map((s) => {
    const policy =
      s.interactionMode === "announcement_with_responses"
        ? ("open_context" as const)
        : ("role_gated" as const);
    const staff = s.staffPersonIds?.[0] ?? DEMO_PERSON_OWNER_ALDEA;
    return buildConversation(s.id, s.title, staff, policy);
  });
  return {
    snapshots,
    conversations,
    messages: seedMessages(),
    authors: {
      ...SEED_AUTHORS,
      [`staff-${DEMO_AUTHORITY_MUNICIPALITY_ID}`]: {
        personId: `staff-${DEMO_AUTHORITY_MUNICIPALITY_ID}`,
        displayName: "Ayuntamiento",
        isOfficial: true,
      },
      [`staff-${DEMO_AUTHORITY_PUBLIC_SERVICES_ID}`]: {
        personId: `staff-${DEMO_AUTHORITY_PUBLIC_SERVICES_ID}`,
        displayName: "Servicios públicos",
        isOfficial: true,
      },
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
      !Array.isArray(parsed.messages) ||
      !Array.isArray(parsed.snapshots)
    ) {
      const seeded = seedStore();
      writeStore(seeded);
      return seeded;
    }
    return {
      snapshots: parsed.snapshots,
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
  const raw = JSON.stringify(store);
  window.localStorage.setItem(STORAGE_KEY, raw);
  durableSync?.(raw);
}

function toMessageView(
  message: Message,
  authors: Record<string, OfficialMessageAuthorView>,
): OfficialMessageView {
  const author = authors[message.authorPersonId] ?? {
    personId: message.authorPersonId,
    displayName: "Vecino",
  };
  return { ...message, author };
}

/** Resident acknowledgment shortcuts — not Work/Experience copy. */
export const OFFICIAL_QUICK_ACTION_LABELS: Partial<
  Record<QuickActionKind, string>
> = {
  thanks: "Gracias",
  going: "Entendido",
};

export const OFFICIAL_RESIDENT_QUICK_ACTIONS: readonly QuickActionKind[] = [
  "thanks",
  "going",
];

export const DEMO_OFFICIAL_CONVERSATION_REACTIONS: readonly ReactionType[] = [
  "thumbs_up",
  "heart",
  "laugh",
  "surprised",
  "pray",
  "clap",
];

export function getPrimaryOfficialNoticeId(
  entityId: string,
): string | undefined {
  const store = readStore();
  const match = store.snapshots.find((s) => s.officialEntityId === entityId);
  return match?.id;
}

export function getOfficialConversationSnapshot(
  noticeId: string,
): OfficialConversationSnapshot | undefined {
  return readStore().snapshots.find((s) => s.id === noticeId);
}

export function ensureOfficialConversation(
  noticeId: string,
): Conversation | undefined {
  const store = readStore();
  const snapshot = store.snapshots.find((s) => s.id === noticeId);
  if (!snapshot) return undefined;

  const existing = store.conversations.find(
    (c) =>
      c.context.contextType === "official" &&
      c.context.contextId === noticeId,
  );
  if (existing) return existing;

  const now = new Date().toISOString();
  const conversation = buildConversation(
    noticeId,
    snapshot.title,
    snapshot.staffPersonIds?.[0] ?? DEMO_PERSON_OWNER_ALDEA,
    snapshot.interactionMode === "announcement_with_responses"
      ? "open_context"
      : "role_gated",
  );
  conversation.createdAt = now;
  conversation.updatedAt = now;
  store.conversations = [conversation, ...store.conversations];
  writeStore(store);
  return conversation;
}

/**
 * Primary official communication for an entity (by id or slug).
 */
export function getOfficialConversationBundleForEntity(
  entityKey: string,
): OfficialConversationBundle | undefined {
  const entity =
    getOfficialEntityById(entityKey) ?? getOfficialEntityBySlug(entityKey);
  if (!entity) return undefined;

  const noticeId = getPrimaryOfficialNoticeId(entity.id);
  if (!noticeId) return undefined;

  return getOfficialConversationBundle(noticeId);
}

export function getOfficialConversationBundle(
  noticeId: string,
): OfficialConversationBundle | undefined {
  const store = readStore();
  let snapshot = store.snapshots.find((s) => s.id === noticeId);
  if (!snapshot) return undefined;

  const entity = getOfficialEntityById(snapshot.officialEntityId);
  if (!entity) return undefined;

  // Keep adapter kind aligned with entity (security submodule gating).
  snapshot = {
    ...snapshot,
    kind: toOfficialAdapterKind(entity),
  };

  const conversation = ensureOfficialConversation(noticeId);
  if (!conversation) return undefined;

  const current =
    readStore().conversations.find((c) => c.id === conversation.id) ??
    conversation;
  const messages = readStore()
    .messages.filter((m) => m.conversationId === current.id && !m.deletedAt)
    .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1))
    .map((m) => toMessageView(m, readStore().authors));

  return { conversation: current, messages, snapshot, entity };
}

function canResidentPost(snapshot: OfficialConversationSnapshot): boolean {
  if (snapshot.status === "locked" || snapshot.status === "archived") {
    return false;
  }
  return snapshot.interactionMode === "announcement_with_responses";
}

export function postOfficialResidentMessage(input: {
  noticeId: string;
  authorPersonId: string;
  authorName: string;
  authorAvatarUrl?: string;
  body: string;
  replyToMessageId?: string;
}): OfficialMessageView | undefined {
  const bundle = getOfficialConversationBundle(input.noticeId);
  if (!bundle) return undefined;
  if (!canResidentPost(bundle.snapshot)) return undefined;

  const body = input.body.trim();
  if (!body) return undefined;

  const store = readStore();
  const now = new Date().toISOString();
  const message: Message = {
    id: `msg-off-${Date.now().toString(36)}`,
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

export function postOfficialQuickAction(input: {
  noticeId: string;
  authorPersonId: string;
  authorName: string;
  authorAvatarUrl?: string;
  kind: QuickActionKind;
}): OfficialMessageView | undefined {
  if (!isQuickActionKind(input.kind)) return undefined;
  if (!OFFICIAL_RESIDENT_QUICK_ACTIONS.includes(input.kind)) return undefined;
  const label = OFFICIAL_QUICK_ACTION_LABELS[input.kind];
  if (!label) return undefined;

  const bundle = getOfficialConversationBundle(input.noticeId);
  if (!bundle) return undefined;
  if (!canResidentPost(bundle.snapshot)) return undefined;

  const store = readStore();
  const now = new Date().toISOString();
  const message: Message = {
    id: `msg-off-qa-${Date.now().toString(36)}`,
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

export function toggleOfficialMessageReaction(input: {
  noticeId: string;
  messageId: string;
  reaction: ReactionType;
}): OfficialMessageView | undefined {
  if (!isReactionType(input.reaction)) return undefined;
  const bundle = getOfficialConversationBundle(input.noticeId);
  if (!bundle) return undefined;
  if (bundle.snapshot.reactionsEnabled === false) return undefined;
  if (bundle.snapshot.status === "archived") return undefined;

  const store = readStore();
  const existing = store.messages.find((m) => m.id === input.messageId);
  if (!existing) return undefined;
  if (existing.conversationId !== bundle.conversation.id) return undefined;

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

export function softDeleteOfficialMessage(input: {
  noticeId: string;
  messageId: string;
  actorPersonId: string;
}): OfficialMessageView | undefined {
  const bundle = getOfficialConversationBundle(input.noticeId);
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

/**
 * Official moderation helpers — reuse announcement capability in UI.
 * No new communication roles.
 */
export function setOfficialConversationStatus(input: {
  noticeId: string;
  status: "active" | "locked" | "archived";
}): OfficialConversationSnapshot | undefined {
  const store = readStore();
  const idx = store.snapshots.findIndex((s) => s.id === input.noticeId);
  if (idx < 0) return undefined;

  const next: OfficialConversationSnapshot = {
    ...store.snapshots[idx]!,
    status: input.status,
  };
  store.snapshots = store.snapshots.map((s, i) => (i === idx ? next : s));

  const convStatus =
    input.status === "archived"
      ? ("archived" as const)
      : input.status === "locked"
        ? ("locked" as const)
        : ("active" as const);
  const now = new Date().toISOString();
  store.conversations = store.conversations.map((c) =>
    c.context.contextId === input.noticeId
      ? {
          ...c,
          status: convStatus,
          updatedAt: now,
          archivedAt: input.status === "archived" ? now : c.archivedAt,
        }
      : c,
  );
  writeStore(store);
  return next;
}

export function officialInteractionModeLabel(
  mode: OfficialInteractionMode | undefined,
): string {
  if (mode === "announcement_with_responses") return "Con respuestas";
  return "Solo aviso";
}
