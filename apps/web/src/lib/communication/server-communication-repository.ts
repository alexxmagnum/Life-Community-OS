/**
 * Communication Core repository.
 *
 * Production: PostgreSQL conversations / participants / messages / attachments.
 * Tests / dev fixture: apps/web/.data/communication when LCOS_COMMUNICATION_FIXTURE=1.
 * created_by and sender_person_id come from the session actor. Client sender ids are ignored.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import {
  createConversationParticipantRecord,
  createConversationRecord,
  createMessageAttachmentRecord,
  createMessageRecord,
  emptyMessageReactionSummary,
  isConversationKind,
  isMessageAttachmentKind,
  messageStatusFromRecord,
  moduleIdForCommunicationContext,
  normalizeCommunicationContextType,
  type Conversation,
  type ConversationKind,
  type ConversationListItem,
  type ConversationParticipantRecord,
  type ConversationThread,
  type Message,
  type MessageAttachment,
  type MessageStatus,
} from "@life-community-os/types";
import {
  isDatabaseConfigured,
  isFilePersistenceAllowed,
  isProductionDataPlane,
  PersistenceUnavailableError,
} from "@/lib/data/data-plane";
import { createDomainDatabaseClient } from "@/lib/data/database-access";
import {
  resolveTenantPublicId,
  tenantSlugToUuid,
} from "@/lib/tenant/ids";
import type { RequestActor } from "@/lib/auth/request-actor";
import {
  actorCanEditMessage,
  actorCanManageParticipants,
  actorCanModerateMessage,
  actorCanPostInConversation,
  actorCanReadConversation,
  isActiveParticipant,
} from "./permissions";

export type CommunicationWriteScope = {
  accessToken?: string | null;
  personId?: string | null;
};

export type CommunicationStore = {
  conversations: Conversation[];
  participants: ConversationParticipantRecord[];
  messages: Message[];
  attachments: MessageAttachment[];
};

export class CommunicationDeniedError extends Error {
  constructor(
    public readonly code: string,
    message?: string,
  ) {
    super(message ?? code);
    this.name = "CommunicationDeniedError";
  }
}

const DATA_DIR = path.join(process.cwd(), ".data", "communication");

function fixtureEnabled(): boolean {
  return process.env.LCOS_COMMUNICATION_FIXTURE === "1";
}

function filePath(tenantSlug: string): string {
  return path.join(DATA_DIR, `${tenantSlug}.json`);
}

function emptyStore(): CommunicationStore {
  return {
    conversations: [],
    participants: [],
    messages: [],
    attachments: [],
  };
}

async function fileExists(tenantSlug: string): Promise<boolean> {
  try {
    await fs.access(filePath(tenantSlug));
    return true;
  } catch {
    return false;
  }
}

async function readFileStore(tenantSlug: string): Promise<CommunicationStore> {
  if (!(await fileExists(tenantSlug))) return emptyStore();
  try {
    const raw = await fs.readFile(filePath(tenantSlug), "utf8");
    const parsed = JSON.parse(raw) as Partial<CommunicationStore>;
    return {
      conversations: Array.isArray(parsed.conversations)
        ? parsed.conversations
        : [],
      participants: Array.isArray(parsed.participants)
        ? parsed.participants
        : [],
      messages: Array.isArray(parsed.messages) ? parsed.messages : [],
      attachments: Array.isArray(parsed.attachments) ? parsed.attachments : [],
    };
  } catch {
    return emptyStore();
  }
}

async function writeFileStore(
  tenantSlug: string,
  store: CommunicationStore,
): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(filePath(tenantSlug), JSON.stringify(store, null, 2), "utf8");
}

function fileStoreEnabled(): boolean {
  if (fixtureEnabled() && isFilePersistenceAllowed()) return true;
  if (isDatabaseConfigured()) return false;
  return isFilePersistenceAllowed() && !isProductionDataPlane();
}

function hydrateConversation(row: Conversation, tenantSlug: string): Conversation {
  const contextType = normalizeCommunicationContextType(
    String(row.contextType ?? row.context?.contextType ?? "community"),
  );
  const contextId = String(row.contextId ?? row.context?.contextId ?? "").trim();
  const createdBy = String(row.createdBy ?? row.createdByPersonId ?? "").trim();
  return {
    ...row,
    tenantId: tenantSlug,
    type: isConversationKind(String(row.type ?? "context"))
      ? (row.type as ConversationKind)
      : "context",
    contextType,
    contextId,
    createdBy,
    createdByPersonId: createdBy,
    context: {
      id: row.context?.id ?? `ctx-${row.id}`,
      contextType,
      contextId,
      tenantId: tenantSlug,
      moduleId: moduleIdForCommunicationContext(contextType),
    },
  };
}

function hydrateMessage(row: Message, tenantSlug: string): Message {
  const sender = String(row.senderPersonId ?? row.authorPersonId ?? "").trim();
  const content = String(row.content ?? row.body ?? "");
  return {
    ...row,
    tenantId: tenantSlug,
    authorPersonId: sender,
    senderPersonId: sender,
    createdBy: sender,
    body: content,
    content,
    mediaRefs: row.mediaRefs ?? [],
    reactionSummary: row.reactionSummary ?? emptyMessageReactionSummary(),
    attachments: row.attachments ?? [],
    status: messageStatusFromRecord(row),
  };
}

type ConversationRow = {
  id: string;
  tenant_id: string;
  created_by: string;
  type: string;
  context_type: string;
  context_id: string;
  title: string | null;
  status: string;
  participant_policy: string;
  created_at: string;
  updated_at: string;
};

type ParticipantRow = {
  id: string;
  tenant_id: string;
  created_by: string;
  conversation_id: string;
  person_id: string;
  role: string;
  status: string;
  display_name: string | null;
  joined_at: string;
  created_at: string;
  updated_at: string;
};

type MessageRow = {
  id: string;
  tenant_id: string;
  created_by: string;
  conversation_id: string;
  sender_person_id: string;
  content: string;
  reply_to_message_id: string | null;
  status: string;
  edited_at: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
};

type AttachmentRow = {
  id: string;
  tenant_id: string;
  created_by: string;
  message_id: string;
  kind: string;
  file_name: string;
  mime_type: string;
  file_id: string | null;
  url: string | null;
  created_at: string;
  updated_at: string;
};

function rowToConversation(row: ConversationRow, tenantSlug: string): Conversation {
  const record = createConversationRecord({
    id: row.id,
    tenantId: tenantSlug,
    createdBy: row.created_by,
    type: isConversationKind(row.type) ? row.type : "context",
    contextType: row.context_type,
    contextId: row.context_id,
    title: row.title ?? undefined,
  });
  return hydrateConversation(
    {
      ...record,
      status: record.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    },
    tenantSlug,
  );
}

function rowToParticipant(
  row: ParticipantRow,
  tenantSlug: string,
): ConversationParticipantRecord {
  return {
    id: row.id,
    tenantId: tenantSlug,
    conversationId: row.conversation_id,
    personId: row.person_id,
    role: row.role as ConversationParticipantRecord["role"],
    status: row.status as ConversationParticipantRecord["status"],
    createdBy: row.created_by,
    joinedAt: row.joined_at,
    displayName: row.display_name ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToMessage(row: MessageRow, tenantSlug: string): Message {
  return hydrateMessage(
    {
      id: row.id,
      conversationId: row.conversation_id,
      tenantId: tenantSlug,
      authorPersonId: row.sender_person_id,
      senderPersonId: row.sender_person_id,
      createdBy: row.created_by,
      body: row.content,
      content: row.content,
      replyToMessageId: row.reply_to_message_id ?? undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      editedAt: row.edited_at ?? undefined,
      deletedAt: row.deleted_at ?? undefined,
      status: row.status as MessageStatus,
      mediaRefs: [],
      reactionSummary: emptyMessageReactionSummary(),
    },
    tenantSlug,
  );
}

function rowToAttachment(
  row: AttachmentRow,
  tenantSlug: string,
): MessageAttachment {
  return {
    id: row.id,
    tenantId: tenantSlug,
    messageId: row.message_id,
    createdBy: row.created_by,
    kind: isMessageAttachmentKind(row.kind) ? row.kind : "file",
    fileName: row.file_name,
    mimeType: row.mime_type,
    fileId: row.file_id ?? undefined,
    url: row.url ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function loadStore(
  tenantSlug: string,
  scope?: CommunicationWriteScope,
): Promise<CommunicationStore> {
  if (fileStoreEnabled()) {
    return readFileStore(tenantSlug);
  }
  const client = await createDomainDatabaseClient(scope);
  if (!client) {
    if (isFilePersistenceAllowed()) return readFileStore(tenantSlug);
    throw new PersistenceUnavailableError("communication");
  }
  const tenantUuid = tenantSlugToUuid(tenantSlug);
  const [conversationsRes, participantsRes, messagesRes, attachmentsRes] =
    await Promise.all([
      client.from("conversations").select("*").eq("tenant_id", tenantUuid),
      client
        .from("conversation_participants")
        .select("*")
        .eq("tenant_id", tenantUuid),
      client.from("messages").select("*").eq("tenant_id", tenantUuid),
      client
        .from("message_attachments")
        .select("*")
        .eq("tenant_id", tenantUuid),
    ]);
  if (conversationsRes.error) throw conversationsRes.error;
  const conversations = ((conversationsRes.data ?? []) as ConversationRow[]).map(
    (row) => rowToConversation(row, tenantSlug),
  );
  const participants = ((participantsRes.data ?? []) as ParticipantRow[]).map(
    (row) => rowToParticipant(row, tenantSlug),
  );
  const messages = ((messagesRes.data ?? []) as MessageRow[]).map((row) =>
    rowToMessage(row, tenantSlug),
  );
  const attachments = ((attachmentsRes.data ?? []) as AttachmentRow[]).map(
    (row) => rowToAttachment(row, tenantSlug),
  );
  const byMessage = new Map<string, MessageAttachment[]>();
  for (const item of attachments) {
    const list = byMessage.get(item.messageId) ?? [];
    list.push(item);
    byMessage.set(item.messageId, list);
  }
  return {
    conversations,
    participants,
    messages: messages.map((item) => ({
      ...item,
      attachments: byMessage.get(item.id) ?? [],
      mediaRefs: (byMessage.get(item.id) ?? [])
        .map((att) => att.fileId)
        .filter((id): id is string => Boolean(id))
        .map((fileId) => ({ fileId })),
    })),
    attachments,
  };
}

async function persistStore(
  tenantSlug: string,
  store: CommunicationStore,
  scope?: CommunicationWriteScope,
): Promise<void> {
  if (fileStoreEnabled()) {
    await writeFileStore(tenantSlug, store);
    return;
  }
  const client = await createDomainDatabaseClient(scope);
  if (!client) {
    if (isFilePersistenceAllowed()) {
      await writeFileStore(tenantSlug, store);
      return;
    }
    throw new PersistenceUnavailableError("communication");
  }
  const tenantUuid = tenantSlugToUuid(tenantSlug);
  const conversationRows = store.conversations.map((item) => ({
    id: item.id,
    tenant_id: tenantUuid,
    created_by: item.createdBy ?? item.createdByPersonId ?? "",
    type: item.type ?? "context",
    context_type: item.contextType ?? item.context.contextType,
    context_id: item.contextId ?? item.context.contextId,
    title: item.title ?? null,
    status: item.status,
    participant_policy: item.participantPolicy,
    created_at: item.createdAt,
    updated_at: item.updatedAt,
  }));
  const participantRows = store.participants.map((item) => ({
    id: item.id,
    tenant_id: tenantUuid,
    created_by: item.createdBy,
    conversation_id: item.conversationId,
    person_id: item.personId,
    role: item.role,
    status: item.status,
    display_name: item.displayName ?? null,
    joined_at: item.joinedAt,
    created_at: item.createdAt,
    updated_at: item.updatedAt,
  }));
  const messageRows = store.messages.map((item) => ({
    id: item.id,
    tenant_id: tenantUuid,
    created_by: item.createdBy ?? item.senderPersonId ?? item.authorPersonId,
    conversation_id: item.conversationId,
    sender_person_id: item.senderPersonId ?? item.authorPersonId,
    content: item.content ?? item.body ?? "",
    reply_to_message_id: item.replyToMessageId ?? null,
    status: messageStatusFromRecord(item),
    edited_at: item.editedAt ?? null,
    deleted_at: item.deletedAt ?? null,
    created_at: item.createdAt,
    updated_at: item.updatedAt ?? item.createdAt,
  }));
  const attachmentRows = store.attachments.map((item) => ({
    id: item.id,
    tenant_id: tenantUuid,
    created_by: item.createdBy,
    message_id: item.messageId,
    kind: item.kind,
    file_name: item.fileName,
    mime_type: item.mimeType,
    file_id: item.fileId ?? null,
    url: item.url ?? null,
    created_at: item.createdAt,
    updated_at: item.updatedAt,
  }));
  const upsert = async (
    table: string,
    rows: Record<string, unknown>[],
  ) => {
    if (rows.length === 0) return;
    const { error } = await client.from(table).upsert(rows);
    if (error) throw error;
  };
  await upsert("conversations", conversationRows);
  await upsert("conversation_participants", participantRows);
  await upsert("messages", messageRows);
  await upsert("message_attachments", attachmentRows);
}

function threadFromStore(
  store: CommunicationStore,
  conversation: Conversation,
): ConversationThread {
  const participants = store.participants.filter(
    (item) => item.conversationId === conversation.id,
  );
  const messages = store.messages
    .filter((item) => item.conversationId === conversation.id)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  return { conversation, participants, messages };
}

function listItemFromStore(
  store: CommunicationStore,
  conversation: Conversation,
): ConversationListItem {
  const thread = threadFromStore(store, conversation);
  const visible = thread.messages.filter((item) => !item.deletedAt);
  return {
    conversation,
    participants: thread.participants,
    lastMessage: visible[visible.length - 1],
  };
}

async function notifyParticipants(input: {
  tenantId: string;
  conversation: Conversation;
  senderPersonId: string;
  content: string;
  participants: ConversationParticipantRecord[];
  scope?: CommunicationWriteScope;
}): Promise<void> {
  try {
    const { createCommunityNotification } = await import(
      "@/lib/community/server-community-repository"
    );
    const preview = input.content.trim().slice(0, 140);
    const recipients = input.participants.filter(
      (item) =>
        item.status === "active" && item.personId !== input.senderPersonId,
    );
    await Promise.all(
      recipients.map((item) =>
        createCommunityNotification({
          tenantId: input.tenantId,
          recipientPersonId: item.personId,
          kind: "mention",
          title: "Nuevo mensaje",
          body: preview || "Tienes un mensaje nuevo.",
          entityType: "comment",
          entityId: input.conversation.id,
          createdBy: input.senderPersonId,
          scope: input.scope,
        }),
      ),
    );
  } catch {
    /* Community notifications stay optional for communication writes. */
  }
}

export async function replaceCommunicationStoreForTests(
  tenantId: string,
  store: CommunicationStore = emptyStore(),
): Promise<void> {
  if (!isFilePersistenceAllowed()) return;
  await writeFileStore(resolveTenantPublicId(tenantId), store);
}

export async function listMyConversationsServer(
  tenantId: string,
  actor: RequestActor,
  scope?: CommunicationWriteScope,
): Promise<ConversationListItem[]> {
  const slug = resolveTenantPublicId(tenantId);
  const store = await loadStore(slug, scope);
  return store.conversations
    .filter((item) =>
      actorCanReadConversation(
        actor,
        item,
        store.participants.filter((p) => p.conversationId === item.id),
      ),
    )
    .map((item) => listItemFromStore(store, item))
    .sort((a, b) => {
      const left = a.lastMessage?.createdAt ?? a.conversation.updatedAt;
      const right = b.lastMessage?.createdAt ?? b.conversation.updatedAt;
      return right.localeCompare(left);
    });
}

export async function getConversationThreadServer(
  tenantId: string,
  conversationId: string,
  actor: RequestActor,
  scope?: CommunicationWriteScope,
): Promise<ConversationThread | null> {
  const slug = resolveTenantPublicId(tenantId);
  const store = await loadStore(slug, scope);
  const conversation = store.conversations.find(
    (item) => item.id === conversationId,
  );
  if (!conversation) return null;
  const thread = threadFromStore(store, conversation);
  if (!actorCanReadConversation(actor, conversation, thread.participants)) {
    throw new CommunicationDeniedError("forbidden");
  }
  return thread;
}

export async function findConversationByContextServer(
  tenantId: string,
  contextType: string,
  contextId: string,
  actor: RequestActor,
  scope?: CommunicationWriteScope,
): Promise<ConversationThread | null> {
  const slug = resolveTenantPublicId(tenantId);
  const store = await loadStore(slug, scope);
  const normalized = normalizeCommunicationContextType(contextType);
  const conversation = store.conversations.find(
    (item) =>
      (item.contextType ?? item.context.contextType) === normalized &&
      (item.contextId ?? item.context.contextId) === contextId.trim(),
  );
  if (!conversation) return null;
  const thread = threadFromStore(store, conversation);
  if (!actorCanReadConversation(actor, conversation, thread.participants)) {
    throw new CommunicationDeniedError("forbidden");
  }
  return thread;
}

export async function findOrCreateConversationServer(input: {
  tenantId: string;
  actor: RequestActor;
  type: ConversationKind;
  contextType: string;
  contextId: string;
  title?: string;
  participantPersonIds?: string[];
  displayNames?: Record<string, string>;
  scope?: CommunicationWriteScope;
}): Promise<ConversationThread> {
  const personId = input.actor.personId?.trim();
  if (!personId) throw new CommunicationDeniedError("unauthorized");
  const slug = resolveTenantPublicId(input.tenantId);
  const store = await loadStore(slug, input.scope);
  const contextType = normalizeCommunicationContextType(input.contextType);
  const contextId = input.contextId.trim();
  const existing = store.conversations.find(
    (item) =>
      (item.contextType ?? item.context.contextType) === contextType &&
      (item.contextId ?? item.context.contextId) === contextId,
  );
  if (existing) {
    const existingParticipants = store.participants.filter(
      (item) => item.conversationId === existing.id,
    );
    if (!isActiveParticipant(existingParticipants, personId)) {
      if (
        existing.type === "direct" ||
        existing.participantPolicy === "invited" ||
        existing.participantPolicy === "role_gated"
      ) {
        throw new CommunicationDeniedError("forbidden");
      }
      store.participants.push(
        createConversationParticipantRecord({
          tenantId: slug,
          conversationId: existing.id,
          personId,
          createdBy: personId,
          role: "participant",
          displayName: input.displayNames?.[personId],
        }),
      );
      await persistStore(slug, store, input.scope);
    }
    return threadFromStore(store, existing);
  }

  const conversation = createConversationRecord({
    tenantId: slug,
    createdBy: personId,
    type: input.type,
    contextType,
    contextId,
    title: input.title,
  });
  const names = input.displayNames ?? {};
  const owner = createConversationParticipantRecord({
    tenantId: slug,
    conversationId: conversation.id,
    personId,
    createdBy: personId,
    role: "owner",
    displayName: names[personId],
  });
  const extras = Array.from(
    new Set(
      (input.participantPersonIds ?? []).filter(
        (id) => id.trim() && id.trim() !== personId,
      ),
    ),
  ).map((id) =>
    createConversationParticipantRecord({
      tenantId: slug,
      conversationId: conversation.id,
      personId: id.trim(),
      createdBy: personId,
      role: "participant",
      displayName: names[id.trim()],
    }),
  );
  store.conversations.push(conversation);
  store.participants.push(owner, ...extras);
  await persistStore(slug, store, input.scope);
  return threadFromStore(store, conversation);
}

export async function postMessageServer(input: {
  tenantId: string;
  conversationId: string;
  actor: RequestActor;
  content: string;
  replyToMessageId?: string;
  attachments?: Array<{
    kind?: string;
    fileName?: string;
    mimeType?: string;
    fileId?: string;
    url?: string;
  }>;
  senderPersonId?: string;
  scope?: CommunicationWriteScope;
}): Promise<Message> {
  if (input.senderPersonId && input.senderPersonId !== input.actor.personId) {
    throw new CommunicationDeniedError("sender_immutable");
  }
  const personId = input.actor.personId?.trim();
  if (!personId) throw new CommunicationDeniedError("unauthorized");
  const slug = resolveTenantPublicId(input.tenantId);
  const store = await loadStore(slug, input.scope);
  const conversation = store.conversations.find(
    (item) => item.id === input.conversationId,
  );
  if (!conversation) throw new CommunicationDeniedError("not_found");
  const participants = store.participants.filter(
    (item) => item.conversationId === conversation.id,
  );
  if (!actorCanPostInConversation(input.actor, conversation, participants)) {
    throw new CommunicationDeniedError("forbidden");
  }
  const attachments = (input.attachments ?? []).map((item) => {
    const rawKind = item.kind ?? "file";
    return createMessageAttachmentRecord({
      tenantId: slug,
      messageId: "pending",
      createdBy: personId,
      kind: isMessageAttachmentKind(rawKind) ? rawKind : "file",
      fileName: item.fileName ?? "file",
      mimeType: item.mimeType ?? "application/octet-stream",
      fileId: item.fileId,
      url: item.url,
    });
  });
  const message = createMessageRecord({
    tenantId: slug,
    conversationId: conversation.id,
    senderPersonId: personId,
    content: input.content,
    replyToMessageId: input.replyToMessageId,
    attachments,
  });
  const boundAttachments = attachments.map((item) => ({
    ...item,
    messageId: message.id,
  }));
  message.attachments = boundAttachments;
  store.messages.push(message);
  store.attachments.push(...boundAttachments);
  conversation.updatedAt = message.createdAt;
  await persistStore(slug, store, input.scope);
  await notifyParticipants({
    tenantId: slug,
    conversation,
    senderPersonId: personId,
    content: message.content ?? message.body ?? "",
    participants,
    scope: input.scope,
  });
  return message;
}

export async function updateMessageServer(input: {
  tenantId: string;
  messageId: string;
  actor: RequestActor;
  content?: string;
  deleted?: boolean;
  senderPersonId?: string;
  authorPersonId?: string;
  createdBy?: string;
  scope?: CommunicationWriteScope;
}): Promise<Message> {
  if (
    (input.senderPersonId && input.senderPersonId !== input.actor.personId) ||
    (input.authorPersonId && input.authorPersonId !== input.actor.personId) ||
    (input.createdBy && input.createdBy !== input.actor.personId)
  ) {
    throw new CommunicationDeniedError("sender_immutable");
  }
  const slug = resolveTenantPublicId(input.tenantId);
  const store = await loadStore(slug, input.scope);
  const index = store.messages.findIndex((item) => item.id === input.messageId);
  if (index < 0) throw new CommunicationDeniedError("not_found");
  const current = store.messages[index];
  if (!current) throw new CommunicationDeniedError("not_found");
  const conversation = store.conversations.find(
    (item) => item.id === current.conversationId,
  );
  if (!conversation) throw new CommunicationDeniedError("not_found");
  const participants = store.participants.filter(
    (item) => item.conversationId === conversation.id,
  );
  if (!actorCanReadConversation(input.actor, conversation, participants)) {
    throw new CommunicationDeniedError("forbidden");
  }
  const now = new Date().toISOString();
  if (input.deleted) {
    if (
      !actorCanModerateMessage(
        input.actor,
        conversation,
        participants,
        current,
      )
    ) {
      throw new CommunicationDeniedError("forbidden");
    }
    const next: Message = {
      ...current,
      deletedAt: now,
      updatedAt: now,
      status: "deleted",
      body: "",
      content: "",
    };
    store.messages[index] = next;
    await persistStore(slug, store, input.scope);
    return next;
  }
  if (!actorCanEditMessage(input.actor, current)) {
    throw new CommunicationDeniedError("forbidden");
  }
  const content = input.content?.trim();
  if (!content) throw new CommunicationDeniedError("invalid_input");
  const next: Message = {
    ...current,
    body: content,
    content,
    editedAt: now,
    updatedAt: now,
    status: "edited",
  };
  store.messages[index] = next;
  await persistStore(slug, store, input.scope);
  return next;
}

export async function addParticipantServer(input: {
  tenantId: string;
  conversationId: string;
  actor: RequestActor;
  personId: string;
  role?: ConversationParticipantRecord["role"];
  displayName?: string;
  scope?: CommunicationWriteScope;
}): Promise<ConversationParticipantRecord> {
  const slug = resolveTenantPublicId(input.tenantId);
  const store = await loadStore(slug, input.scope);
  const conversation = store.conversations.find(
    (item) => item.id === input.conversationId,
  );
  if (!conversation) throw new CommunicationDeniedError("not_found");
  const participants = store.participants.filter(
    (item) => item.conversationId === conversation.id,
  );
  if (!actorCanManageParticipants(input.actor, conversation, participants)) {
    throw new CommunicationDeniedError("forbidden");
  }
  const personId = input.personId.trim();
  if (!personId) throw new CommunicationDeniedError("invalid_input");
  const existing = participants.find((item) => item.personId === personId);
  if (existing) {
    if (existing.status !== "active") {
      existing.status = "active";
      existing.updatedAt = new Date().toISOString();
      await persistStore(slug, store, input.scope);
    }
    return existing;
  }
  const created = createConversationParticipantRecord({
    tenantId: slug,
    conversationId: conversation.id,
    personId,
    createdBy: input.actor.personId ?? conversation.createdBy ?? personId,
    role: input.role === "owner" ? "participant" : input.role ?? "participant",
    displayName: input.displayName,
  });
  store.participants.push(created);
  await persistStore(slug, store, input.scope);
  return created;
}
