"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  ConversationKind,
  ConversationParticipantRecord,
  Message,
} from "@life-community-os/types";
import {
  ConversationExperience,
  EmptyState,
  FlowScreenHeader,
  MobileScreen,
  type MessageComposerReplyTarget,
  type MessageListItem,
} from "@life-community-os/ui";
import {
  createConversationRequest,
  fetchConversationByContext,
  fetchConversationThread,
  patchConversationMessage,
  sendConversationMessage,
} from "@/lib/communication/communication-client";
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";
import { useCurrentUser } from "@/providers/CurrentUserProvider";

function previewBody(body?: string): string {
  const t = (body ?? "").trim();
  if (!t) return "Mensaje";
  return t.length > 80 ? `${t.slice(0, 77)}…` : t;
}

export type CommunicationThreadScreenProps = {
  type: ConversationKind;
  contextType: string;
  contextId: string;
  title: string;
  subtitle?: string;
  reason?: string;
  backHref: string;
  conversationId?: string;
  peerPersonIds?: string[];
  headerImageUrl?: string;
};

export function CommunicationThreadScreen({
  type,
  contextType,
  contextId,
  title,
  subtitle,
  reason,
  backHref,
  conversationId,
  peerPersonIds,
  headerImageUrl,
}: CommunicationThreadScreenProps) {
  const router = useRouter();
  const { hasCapability } = useTenant();
  const { currentUser, sessionReady } = useCurrentUser();
  const personId = currentUser.personId ?? "";
  const [messages, setMessages] = useState<Message[]>([]);
  const [participants, setParticipants] = useState<
    ConversationParticipantRecord[]
  >([]);
  const [threadId, setThreadId] = useState<string | null>(
    conversationId ?? null,
  );
  const [draft, setDraft] = useState("");
  const [ready, setReady] = useState(false);
  const [allowed, setAllowed] = useState(false);
  const [replyTo, setReplyTo] = useState<MessageComposerReplyTarget | null>(
    null,
  );
  const [infoOpen, setInfoOpen] = useState(false);

  const peerKey = peerPersonIds?.join(",") ?? "";

  const refresh = useCallback(async () => {
    if (!hasCapability(CAPABILITIES.contentView) || !personId) {
      setAllowed(false);
      setMessages([]);
      setReady(true);
      return;
    }
    let thread = conversationId
      ? await fetchConversationThread(conversationId)
      : await fetchConversationByContext(contextType, contextId);
    if (!thread && !conversationId) {
      thread = await createConversationRequest({
        type,
        contextType,
        contextId,
        title,
        participantPersonIds: peerKey ? peerKey.split(",") : undefined,
      });
    }
    if (!thread) {
      setAllowed(false);
      setMessages([]);
      setReady(true);
      return;
    }
    setAllowed(true);
    setThreadId(thread.conversation.id);
    setParticipants(thread.participants);
    setMessages(thread.messages.filter((item) => !item.deletedAt));
    setReady(true);
  }, [
    contextId,
    contextType,
    conversationId,
    hasCapability,
    peerKey,
    personId,
    title,
    type,
  ]);

  useEffect(() => {
    if (!sessionReady) return;
    void refresh();
  }, [refresh, sessionReady]);

  const byId = useMemo(() => {
    const map = new Map<string, Message>();
    for (const item of messages) map.set(item.id, item);
    return map;
  }, [messages]);

  const infoMembers = participants
    .filter((item) => item.status === "active")
    .map((item) => ({
      id: item.personId,
      name: item.displayName || item.personId,
    }));

  if (ready && !allowed) {
    return (
      <MobileScreen>
        <FlowScreenHeader
          title="Conversación"
          onBack={() => router.push(backHref)}
          onExit={() => router.push(backHref)}
        />
        <EmptyState
          title="Conversación no disponible"
          description="Solo los participantes pueden leer este hilo."
          actionLabel="Volver"
          onAction={() => router.push(backHref)}
        />
      </MobileScreen>
    );
  }

  const listItems: MessageListItem[] = messages.map((message) => {
    const parent = message.replyToMessageId
      ? byId.get(message.replyToMessageId)
      : undefined;
    const body = message.content ?? message.body ?? "";
    const sender = message.senderPersonId ?? message.authorPersonId;
    return {
      id: message.id,
      authorPersonId: sender,
      author: {
        personId: sender,
        displayName:
          participants.find((item) => item.personId === sender)?.displayName ||
          (sender === personId ? currentUser.displayName || "Tú" : "Vecino"),
      },
      body,
      createdAt: message.createdAt,
      replyPreview: parent
        ? previewBody(parent.content ?? parent.body)
        : undefined,
      replyAuthorName: parent
        ? participants.find((item) => item.personId === parent.authorPersonId)
            ?.displayName
        : undefined,
      onReply: () =>
        setReplyTo({
          messageId: message.id,
          authorName:
            participants.find((item) => item.personId === sender)?.displayName ||
            "Vecino",
          bodyPreview: previewBody(body),
        }),
      onDeleteOwn:
        sender === personId && threadId
          ? () => {
              void patchConversationMessage({
                messageId: message.id,
                deleted: true,
              }).then(() => refresh());
            }
          : undefined,
      deleteEnabled: sender === personId,
      forwardEnabled: false,
    };
  });

  return (
    <MobileScreen dense className="gap-0 pb-0">
      <ConversationExperience
        onBack={() => router.push(backHref)}
        infoOpen={infoOpen}
        onInfoOpenChange={setInfoOpen}
        infoDescription={subtitle ?? "Conversación de la comunidad."}
        infoMembers={infoMembers}
        header={{
          name: title,
          avatarUrl: headerImageUrl,
          reason: reason ?? "Conversación",
          contextTitle: title,
          contextSubtitle: subtitle,
          contextImageUrl: headerImageUrl,
        }}
        messages={listItems}
        viewerPersonId={personId}
        emptyTitle="Todavía no hay mensajes"
        emptyDescription="Sé el primero en escribir."
        composer={{
          value: draft,
          onChange: setDraft,
          onSend: () => {
            if (!threadId || !draft.trim()) return;
            void sendConversationMessage({
              conversationId: threadId,
              content: draft,
              replyToMessageId: replyTo?.messageId,
            }).then((created) => {
              if (created) {
                setDraft("");
                setReplyTo(null);
                void refresh();
              }
            });
          },
          replyTo,
          onCancelReply: () => setReplyTo(null),
          placeholder: "Escribe un mensaje…",
        }}
      />
    </MobileScreen>
  );
}
