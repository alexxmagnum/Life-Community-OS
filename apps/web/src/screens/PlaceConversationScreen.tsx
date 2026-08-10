"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DEMO_PLACE_CONVERSATION_REACTIONS,
  getLocalEntityById,
  getPlaceConversationBundle,
  joinPlaceConversation,
  PLACE_QUICK_ACTION_LABELS,
  postPlaceMessage,
  postPlaceQuickAction,
  togglePlaceMessageReaction,
  type PlaceMessageView,
} from "@life-community-os/tenant-life-panoramica";
import {
  QUICK_ACTION_KINDS,
  REACTION_TYPE_GLYPH,
  type QuickActionKind,
  type ReactionType,
} from "@life-community-os/types";
import {
  ContextHeader,
  ConversationShell,
  EmptyState,
  FlowScreenHeader,
  MessageComposer,
  MessageList,
  MobileScreen,
  ReactionPicker,
  type MessageListItem,
} from "@life-community-os/ui";
import {
  canOpenPlaceConversation,
  canViewPlaceConversation,
} from "@/lib/place-conversation-access";
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";

/**
 * Contextual place Conversation — Shared Product shell (Phase 2.5).
 * Neighbours asking about a specific place — not a global chat.
 */
export function PlaceConversationScreen({ placeId }: { placeId: string }) {
  const router = useRouter();
  const {
    configuration,
    isFeatureEnabled,
    isModuleEnabled,
    hasCapability,
    demoMember,
  } = useTenant();
  const [messages, setMessages] = useState<PlaceMessageView[]>([]);
  const [draft, setDraft] = useState("");
  const [ready, setReady] = useState(false);
  const [allowed, setAllowed] = useState(false);
  const [placeName, setPlaceName] = useState("Lugar");
  const [placeImageUrl, setPlaceImageUrl] = useState<string | undefined>();

  const moduleOn =
    isModuleEnabled("nearby") && isFeatureEnabled("localLife");

  const refresh = useCallback(() => {
    if (!moduleOn || !hasCapability(CAPABILITIES.localView)) {
      setAllowed(false);
      setMessages([]);
      setReady(true);
      return;
    }

    const bundle = getPlaceConversationBundle(placeId);
    if (!bundle) {
      setAllowed(false);
      setMessages([]);
      setReady(true);
      return;
    }

    joinPlaceConversation({
      placeId,
      personId: demoMember.personId,
    });

    const open = canOpenPlaceConversation({
      placeId,
      configuration,
      isModuleEnabled,
      hasCapability,
    });
    const view = canViewPlaceConversation({
      placeId,
      personId: demoMember.personId,
      configuration,
      isModuleEnabled,
      hasCapability,
    });
    setAllowed(open && view);
    setMessages(getPlaceConversationBundle(placeId)?.messages ?? []);
    setPlaceName(bundle.placeName);
    const entity = getLocalEntityById(placeId);
    setPlaceImageUrl(entity?.imageUrl);
    setReady(true);
  }, [
    configuration,
    demoMember.personId,
    hasCapability,
    isModuleEnabled,
    moduleOn,
    placeId,
  ]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (!moduleOn) {
    return (
      <MobileScreen>
        <FlowScreenHeader
          title="Conversación"
          onBack={() => router.push(`/near/place/${placeId}`)}
          onExit={() => router.push("/")}
        />
        <EmptyState
          title="No disponible"
          description="La vida local no está activa en tu comunidad."
          actionLabel="Volver al inicio"
          onAction={() => router.push("/")}
        />
      </MobileScreen>
    );
  }

  if (ready && !allowed) {
    return (
      <MobileScreen>
        <FlowScreenHeader
          title="Conversación"
          onBack={() => router.push(`/near/place/${placeId}`)}
          onExit={() => router.push("/")}
        />
        <EmptyState
          title="Conversación no disponible"
          description="No puedes preguntar sobre este lugar con tu cuenta actual."
          actionLabel="Volver al lugar"
          onAction={() => router.push(`/near/place/${placeId}`)}
        />
      </MobileScreen>
    );
  }

  const sendDraft = () => {
    const created = postPlaceMessage({
      placeId,
      authorPersonId: demoMember.personId,
      authorName: demoMember.displayName,
      authorAvatarUrl: demoMember.avatarUrl,
      body: draft,
    });
    if (created) {
      setDraft("");
      refresh();
    }
  };

  const onQuickAction = (kind: QuickActionKind) => {
    postPlaceQuickAction({
      placeId,
      authorPersonId: demoMember.personId,
      authorName: demoMember.displayName,
      authorAvatarUrl: demoMember.avatarUrl,
      kind,
    });
    refresh();
  };

  const onReaction = (messageId: string, reaction: ReactionType) => {
    togglePlaceMessageReaction({ placeId, messageId, reaction });
    refresh();
  };

  const listItems: MessageListItem[] = messages.map((message) => ({
    id: message.id,
    authorPersonId: message.authorPersonId,
    author: {
      personId: message.author.personId,
      displayName: message.author.displayName,
      avatarUrl: message.author.avatarUrl,
    },
    body: message.body,
    createdAt: message.createdAt,
    badge: message.quickActionKind ? (
      <span className="rounded-full bg-black/10 px-2 py-0.5 text-[12px] font-semibold">
        {PLACE_QUICK_ACTION_LABELS[message.quickActionKind]}
      </span>
    ) : undefined,
    reactions: (
      <ReactionPicker
        options={DEMO_PLACE_CONVERSATION_REACTIONS.map((reaction) => ({
          id: reaction,
          glyph: REACTION_TYPE_GLYPH[reaction],
          count: message.reactionSummary?.[reaction] ?? 0,
        }))}
        onSelect={(id) => onReaction(message.id, id as ReactionType)}
      />
    ),
  }));

  return (
    <MobileScreen dense>
      <ConversationShell
        header={
          <>
            <FlowScreenHeader
              title="Conversación"
              subtitle="Sobre este lugar"
              onBack={() => router.push(`/near/place/${placeId}`)}
              onExit={() => router.push("/")}
            />
            <ContextHeader
              name="Vecinos"
              reason="Pregunta sobre este lugar"
              context={{
                title: placeName,
                subtitle: "Vida cerca",
                imageUrl: placeImageUrl,
                onClick: () => router.push(`/near/place/${placeId}`),
              }}
            />
          </>
        }
        footer={
          <MessageComposer
            value={draft}
            onChange={setDraft}
            onSend={sendDraft}
            placeholder={`Pregunta sobre ${placeName}…`}
            quickActions={
              <div className="space-y-2">
                <p className="text-[12px] font-semibold text-[var(--color-text-tertiary)]">
                  Respuestas rápidas
                </p>
                <div className="flex flex-wrap gap-2">
                  {QUICK_ACTION_KINDS.map((kind) => (
                    <button
                      key={kind}
                      type="button"
                      onClick={() => onQuickAction(kind)}
                      className="min-h-[40px] rounded-full bg-[var(--color-surface-elevated)] px-3 text-[13px] font-semibold text-[var(--color-text-primary)] shadow-[var(--shadow-elev-1)] transition-transform active:scale-[0.98]"
                    >
                      {PLACE_QUICK_ACTION_LABELS[kind]}
                    </button>
                  ))}
                </div>
              </div>
            }
          />
        }
      >
        <MessageList
          messages={listItems}
          viewerPersonId={demoMember.personId}
          emptyTitle="Todavía no hay preguntas"
          emptyDescription="Sé el primero en preguntar a tus vecinos sobre este lugar."
        />
      </ConversationShell>
    </MobileScreen>
  );
}
