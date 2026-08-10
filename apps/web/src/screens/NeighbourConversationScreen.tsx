"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getNeighbourConversationBundle,
  postNeighbourMessage,
  softDeleteNeighbourMessage,
  type NeighbourMessageView,
} from "@life-community-os/tenant-life-panoramica";
import {
  ConversationExperience,
  EmptyState,
  FlowScreenHeader,
  MobileScreen,
  type MessageComposerReplyTarget,
  type MessageListItem,
} from "@life-community-os/ui";
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";

function previewBody(body?: string): string {
  const t = (body ?? "").trim();
  if (!t) return "Mensaje";
  return t.length > 80 ? `${t.slice(0, 77)}…` : t;
}

/**
 * Private neighbour chat — ConversationExperience only.
 * Entry: public post → Contactar (not public comments).
 */
export function NeighbourConversationScreen({
  peerPersonId,
}: {
  peerPersonId: string;
  /** @deprecated Entry is plaza → chat; kept for route compat. */
  fromContentId?: string;
}) {
  const router = useRouter();
  const { hasCapability, demoMember, isFeatureEnabled } = useTenant();
  const [messages, setMessages] = useState<NeighbourMessageView[]>([]);
  const [draft, setDraft] = useState("");
  const [ready, setReady] = useState(false);
  const [allowed, setAllowed] = useState(false);
  const [peerName, setPeerName] = useState("Vecino");
  const [peerAvatarUrl, setPeerAvatarUrl] = useState<string | undefined>();
  const [replyTo, setReplyTo] = useState<MessageComposerReplyTarget | null>(
    null,
  );
  const [infoOpen, setInfoOpen] = useState(false);

  const backHref = "/community";

  const refresh = useCallback(() => {
    if (!isFeatureEnabled("interactions") || !hasCapability(CAPABILITIES.contentView)) {
      setAllowed(false);
      setMessages([]);
      setReady(true);
      return;
    }
    const bundle = getNeighbourConversationBundle({
      viewerPersonId: demoMember.personId,
      peerPersonId,
    });
    if (!bundle) {
      setAllowed(false);
      setMessages([]);
      setReady(true);
      return;
    }
    setAllowed(true);
    setMessages(bundle.messages.filter((m) => !m.deletedAt));
    setPeerName(bundle.peerName);
    setPeerAvatarUrl(bundle.peerAvatarUrl);
    setReady(true);
  }, [
    demoMember.personId,
    hasCapability,
    isFeatureEnabled,
    peerPersonId,
  ]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const byId = useMemo(() => {
    const map = new Map<string, NeighbourMessageView>();
    for (const m of messages) map.set(m.id, m);
    return map;
  }, [messages]);

  if (ready && !allowed) {
    return (
      <MobileScreen>
        <FlowScreenHeader
          title="Conversación"
          onBack={() => router.push(backHref)}
          onExit={() => router.push("/community")}
        />
        <EmptyState
          title="Conversación no disponible"
          description="No se puede abrir este chat ahora mismo."
          actionLabel="Volver a Comunidad"
          onAction={() => router.push(backHref)}
        />
      </MobileScreen>
    );
  }

  const listItems: MessageListItem[] = messages.map((message) => {
    const parent = message.replyToMessageId
      ? byId.get(message.replyToMessageId)
      : undefined;
    return {
      id: message.id,
      authorPersonId: message.authorPersonId,
      author: {
        personId: message.author.personId,
        displayName: message.author.displayName,
        avatarUrl: message.author.avatarUrl,
      },
      body: message.body,
      createdAt: message.createdAt,
      replyPreview: parent ? previewBody(parent.body) : undefined,
      replyAuthorName: parent?.author.displayName,
      onReply: () =>
        setReplyTo({
          messageId: message.id,
          authorName: message.author.displayName,
          bodyPreview: previewBody(message.body),
        }),
      onDeleteOwn:
        message.authorPersonId === demoMember.personId
          ? () => {
              softDeleteNeighbourMessage({
                viewerPersonId: demoMember.personId,
                peerPersonId,
                messageId: message.id,
                actorPersonId: demoMember.personId,
              });
              refresh();
            }
          : undefined,
      deleteEnabled: message.authorPersonId === demoMember.personId,
      forwardEnabled: false,
    };
  });

  return (
    <MobileScreen dense className="gap-0 pb-0">
      <ConversationExperience
        onBack={() => router.push(backHref)}
        infoOpen={infoOpen}
        onInfoOpenChange={setInfoOpen}
        infoDescription="Conversación privada entre vecinos."
        infoMembers={[
          {
            id: demoMember.personId,
            name: demoMember.displayName,
            avatarUrl: demoMember.avatarUrl,
          },
          {
            id: peerPersonId,
            name: peerName,
            avatarUrl: peerAvatarUrl,
          },
        ]}
        header={{
          name: peerName,
          avatarUrl: peerAvatarUrl,
          reason: "Vecino",
          contextTitle: peerName,
          contextSubtitle: "Entre vecinos",
          contextImageUrl: peerAvatarUrl,
        }}
        messages={listItems}
        viewerPersonId={demoMember.personId}
        emptyTitle="Todavía no hay mensajes"
        emptyDescription="Sé el primero en escribir a tu vecino."
        composer={{
          value: draft,
          onChange: setDraft,
          onSend: () => {
            const created = postNeighbourMessage({
              viewerPersonId: demoMember.personId,
              peerPersonId,
              authorPersonId: demoMember.personId,
              authorName: demoMember.displayName,
              authorAvatarUrl: demoMember.avatarUrl,
              body: draft,
              replyToMessageId: replyTo?.messageId,
            });
            if (created) {
              setDraft("");
              setReplyTo(null);
              refresh();
            }
          },
          replyTo,
          onCancelReply: () => setReplyTo(null),
          placeholder: "Escribe un mensaje…",
        }}
      />
    </MobileScreen>
  );
}
