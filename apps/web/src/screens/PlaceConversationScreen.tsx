"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DEMO_PLACE_CONVERSATION_REACTIONS,
  getLocalEntityById,
  getPlaceConversationBundle,
  joinPlaceConversation,
  PLACE_QUICK_ACTION_LABELS,
  postPlaceMessage,
  softDeletePlaceMessage,
  togglePlaceMessageReaction,
  type PlaceMessageView,
} from "@life-community-os/tenant-life-panoramica";
import {
  REACTION_TYPE_GLYPH,
  type ReactionType,
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
  canOpenPlaceConversation,
  canViewPlaceConversation,
} from "@/lib/place-conversation-access";
import { resolvePlaceHref } from "@/lib/location";
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";

function previewBody(body?: string): string {
  const t = (body ?? "").trim();
  if (!t) return "Mensaje";
  return t.length > 80 ? `${t.slice(0, 77)}…` : t;
}

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
  const [replyTo, setReplyTo] = useState<MessageComposerReplyTarget | null>(
    null,
  );
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [firstUnreadMessageId, setFirstUnreadMessageId] = useState<
    string | null
  >(null);
  const [infoOpen, setInfoOpen] = useState(false);

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

  useEffect(() => {
    if (messages.length === 0) {
      setFirstUnreadMessageId(null);
      return;
    }
    const key = `lcos.unread.place.${placeId}.${demoMember.personId}`;
    const lastSeen = window.localStorage.getItem(key);
    const firstUnread = messages.find(
      (m) =>
        m.authorPersonId !== demoMember.personId &&
        (!lastSeen || m.createdAt > lastSeen),
    );
    setFirstUnreadMessageId(firstUnread?.id ?? null);
    const latest = messages[messages.length - 1];
    if (!latest) return;
    const t = window.setTimeout(() => {
      window.localStorage.setItem(key, latest.createdAt);
    }, 1200);
    return () => window.clearTimeout(t);
  }, [demoMember.personId, messages, placeId]);

  const byId = useMemo(() => {
    const map = new Map<string, PlaceMessageView>();
    for (const m of messages) map.set(m.id, m);
    return map;
  }, [messages]);

  const infoMembers = useMemo(() => {
    const seen = new Map<string, { id: string; name: string; avatarUrl?: string }>();
    for (const m of messages) {
      if (!seen.has(m.authorPersonId)) {
        seen.set(m.authorPersonId, {
          id: m.authorPersonId,
          name: m.author.displayName,
          avatarUrl: m.author.avatarUrl,
        });
      }
    }
    if (!seen.has(demoMember.personId)) {
      seen.set(demoMember.personId, {
        id: demoMember.personId,
        name: demoMember.displayName,
        avatarUrl: demoMember.avatarUrl,
      });
    }
    return [...seen.values()];
  }, [demoMember, messages]);

  if (!moduleOn) {
    return (
      <MobileScreen>
        <FlowScreenHeader
          title="Conversación"
          onBack={() => router.push(resolvePlaceHref({ entityOrLocationId: placeId, tenantId: configuration.tenantId, prefer: "map" }))}
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
          onBack={() => router.push(resolvePlaceHref({ entityOrLocationId: placeId, tenantId: configuration.tenantId, prefer: "map" }))}
          onExit={() => router.push("/")}
        />
        <EmptyState
          title="Conversación no disponible"
          description="No puedes preguntar sobre este lugar con tu cuenta actual."
          actionLabel="Volver al lugar"
          onAction={() => router.push(resolvePlaceHref({ entityOrLocationId: placeId, tenantId: configuration.tenantId, prefer: "map" }))}
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
      replyToMessageId: replyTo?.messageId,
    });
    if (created) {
      setDraft("");
      setReplyTo(null);
      refresh();
    }
  };

  const onReaction = (messageId: string, reaction: ReactionType) => {
    togglePlaceMessageReaction({ placeId, messageId, reaction });
    refresh();
  };

  const reactionOptions = DEMO_PLACE_CONVERSATION_REACTIONS.map((reaction) => ({
    id: reaction,
    glyph: REACTION_TYPE_GLYPH[reaction],
  }));

  const toggleSelect = (id: string) => {
    setSelectionMode(true);
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

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
      badge: message.quickActionKind ? (
        <span className="rounded-full bg-black/10 px-2 py-0.5 text-[11px] font-semibold">
          {PLACE_QUICK_ACTION_LABELS[message.quickActionKind]}
        </span>
      ) : undefined,
      reactionSummary: DEMO_PLACE_CONVERSATION_REACTIONS.map((reaction) => ({
        id: reaction,
        glyph: REACTION_TYPE_GLYPH[reaction],
        count: message.reactionSummary?.[reaction] ?? 0,
      })),
      reactionOptions,
      onReaction: (id) => onReaction(message.id, id as ReactionType),
      onReply: () =>
        setReplyTo({
          messageId: message.id,
          authorName: message.author.displayName,
          bodyPreview: previewBody(message.body),
        }),
      onSelect: () => toggleSelect(message.id),
      onDeleteOwn:
        message.authorPersonId === demoMember.personId
          ? () => {
              softDeletePlaceMessage({
                placeId,
                messageId: message.id,
                actorPersonId: demoMember.personId,
              });
              refresh();
            }
          : undefined,
      selected: selectedIds.includes(message.id),
      deleteEnabled: message.authorPersonId === demoMember.personId,
      forwardEnabled: false,
    };
  });

  const reason = placeName || "Pregunta sobre este lugar";

  return (
    <MobileScreen dense className="gap-0 pb-0">
      <ConversationExperience
        onBack={() => router.push(resolvePlaceHref({ entityOrLocationId: placeId, tenantId: configuration.tenantId, prefer: "map" }))}
        infoOpen={infoOpen}
        onInfoOpenChange={setInfoOpen}
        infoDescription={reason}
        infoMembers={infoMembers}
        header={{
          name: "Vecinos",
          reason,
          contextTitle: placeName,
          contextImageUrl: placeImageUrl,
        }}
        messages={listItems}
        viewerPersonId={demoMember.personId}
        selectionMode={selectionMode}
        firstUnreadMessageId={firstUnreadMessageId}
        emptyTitle="Todavía no hay preguntas"
        emptyDescription="Sé el primero en preguntar a tus vecinos sobre este lugar."
        composer={{
          value: draft,
          onChange: setDraft,
          onSend: sendDraft,
          placeholder: `Pregunta sobre ${placeName}…`,
          replyTo,
          onCancelReply: () => setReplyTo(null),
          attachmentsEnabled: true,
          voiceEnabled: true,
          quickActions: selectionMode ? (
            <div className="flex items-center justify-between gap-2 px-1">
              <p className="text-[12px] font-semibold text-[var(--color-text-secondary)]">
                {selectedIds.length} seleccionados
              </p>
              <button
                type="button"
                className="text-[12px] font-semibold text-[var(--color-action-primary)]"
                onClick={() => {
                  setSelectionMode(false);
                  setSelectedIds([]);
                }}
              >
                Listo
              </button>
            </div>
          ) : undefined,
        }}
      />
    </MobileScreen>
  );
}
