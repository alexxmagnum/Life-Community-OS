import type {
  ConversationKind,
  ConversationListItem,
  ConversationThread,
  Message,
  ConversationParticipantRecord,
} from "@life-community-os/types";

async function parseJson<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}

export async function fetchMyConversations(): Promise<ConversationListItem[]> {
  const response = await fetch("/api/conversations", { cache: "no-store" });
  if (!response.ok) return [];
  const json = await parseJson<{ conversations?: ConversationListItem[] }>(
    response,
  );
  return json.conversations ?? [];
}

export async function fetchConversationThread(
  conversationId: string,
): Promise<ConversationThread | null> {
  const response = await fetch(`/api/conversations/${conversationId}`, {
    cache: "no-store",
  });
  if (!response.ok) return null;
  return parseJson<ConversationThread>(response);
}

export async function fetchConversationByContext(
  contextType: string,
  contextId: string,
): Promise<ConversationThread | null> {
  const params = new URLSearchParams({ contextType, contextId });
  const response = await fetch(`/api/conversations?${params.toString()}`, {
    cache: "no-store",
  });
  if (!response.ok) return null;
  const json = await parseJson<
    ConversationThread & { conversation: ConversationThread["conversation"] | null }
  >(response);
  if (!json.conversation) return null;
  return json;
}

export async function createConversationRequest(input: {
  type: ConversationKind;
  contextType: string;
  contextId: string;
  title?: string;
  participantPersonIds?: string[];
}): Promise<ConversationThread | null> {
  const response = await fetch("/api/conversations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) return null;
  return parseJson<ConversationThread>(response);
}

export async function sendConversationMessage(input: {
  conversationId: string;
  content: string;
  replyToMessageId?: string;
}): Promise<Message | null> {
  const response = await fetch(
    `/api/conversations/${input.conversationId}/messages`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: input.content,
        replyToMessageId: input.replyToMessageId,
      }),
    },
  );
  if (!response.ok) return null;
  const json = await parseJson<{ message?: Message }>(response);
  return json.message ?? null;
}

export async function patchConversationMessage(input: {
  messageId: string;
  content?: string;
  deleted?: boolean;
}): Promise<Message | null> {
  const response = await fetch(`/api/messages/${input.messageId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content: input.content,
      deleted: input.deleted,
    }),
  });
  if (!response.ok) return null;
  const json = await parseJson<{ message?: Message }>(response);
  return json.message ?? null;
}

export async function addConversationParticipant(input: {
  conversationId: string;
  personId: string;
  displayName?: string;
}): Promise<ConversationParticipantRecord | null> {
  const response = await fetch(
    `/api/conversations/${input.conversationId}/participants`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        personId: input.personId,
        displayName: input.displayName,
      }),
    },
  );
  if (!response.ok) return null;
  const json = await parseJson<{ participant?: ConversationParticipantRecord }>(
    response,
  );
  return json.participant ?? null;
}
