"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DEMO_MARKETPLACE_CONVERSATION_REACTIONS,
  expressMarketplaceInterest,
  getMarketplaceConversationBundle,
  MARKETPLACE_QUICK_ACTION_LABELS,
  marketplaceKindLabel,
  postMarketplaceMessage,
  softDeleteMarketplaceMessage,
  toggleMarketplaceMessageReaction,
  type MarketplaceListing,
  type MarketplaceMessageView,
} from "@life-community-os/tenant-life-panoramica";
import {
  createMarketplaceConversationAdapter,
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
  canOpenMarketplaceConversation,
  canViewMarketplaceConversation,
} from "@/lib/marketplace-conversation-access";
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";

function previewBody(body?: string): string {
  const t = (body ?? "").trim();
  if (!t) return "Mensaje";
  return t.length > 80 ? `${t.slice(0, 77)}…` : t;
}

/**
 * Contextual Marketplace Listing Conversation — Shared Product shell (Phase 2.5.3).
 * Contact is about this specific listing — not a global chat inbox.
 */
export function MarketplaceConversationScreen({
  listingId,
}: {
  listingId: string;
}) {
  const router = useRouter();
  const {
    configuration,
    isFeatureEnabled,
    isModuleEnabled,
    hasCapability,
    isProductCapabilityEnabled,
    demoMember,
  } = useTenant();
  const [messages, setMessages] = useState<MarketplaceMessageView[]>([]);
  const [draft, setDraft] = useState("");
  const [ready, setReady] = useState(false);
  const [allowed, setAllowed] = useState(false);
  const [listing, setListing] = useState<MarketplaceListing | null>(null);
  const [peerName, setPeerName] = useState("Vecino");
  const [peerAvatarUrl, setPeerAvatarUrl] = useState<string | undefined>();
  const [kindLabel, setKindLabel] = useState("");
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
    isModuleEnabled("marketplace") &&
    isFeatureEnabled("marketplace") &&
    isProductCapabilityEnabled("marketplace");

  const refresh = useCallback(() => {
    if (!moduleOn || !hasCapability(CAPABILITIES.marketplaceView)) {
      setAllowed(false);
      setMessages([]);
      setListing(null);
      setReady(true);
      return;
    }

    const bundle = getMarketplaceConversationBundle(listingId);
    if (!bundle || !bundle.listing.authorPersonId) {
      setAllowed(false);
      setMessages([]);
      setListing(null);
      setReady(true);
      return;
    }

    const open = canOpenMarketplaceConversation({
      listing: bundle.listing,
      configuration,
      isModuleEnabled,
      hasCapability,
    });
    const view = canViewMarketplaceConversation({
      listing: bundle.listing,
      personId: demoMember.personId,
      configuration,
      isModuleEnabled,
      hasCapability,
    });
    setAllowed(open && view);
    setMessages(bundle.messages);
    setListing(bundle.listing);
    setKindLabel(marketplaceKindLabel(bundle.listing.kind));

    const iAmAuthor = bundle.listing.authorPersonId === demoMember.personId;
    if (iAmAuthor) {
      const other = bundle.messages.find(
        (m) => m.authorPersonId !== demoMember.personId,
      );
      setPeerName(other?.author.displayName ?? "Interesado");
      setPeerAvatarUrl(other?.author.avatarUrl);
    } else {
      setPeerName(bundle.listing.authorName);
      setPeerAvatarUrl(bundle.listing.authorAvatarUrl);
    }

    const adapter = createMarketplaceConversationAdapter();
    adapter.listParticipants(bundle.conversation.context, {
      id: bundle.listing.id,
      title: bundle.listing.title,
      authorPersonId: bundle.listing.authorPersonId,
      interestedPersonIds: bundle.interestedPersonIds,
      status: "open",
    });
    setReady(true);
  }, [
    configuration,
    demoMember.personId,
    hasCapability,
    isModuleEnabled,
    listingId,
    moduleOn,
  ]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (messages.length === 0) {
      setFirstUnreadMessageId(null);
      return;
    }
    const key = `lcos.unread.marketplace.${listingId}.${demoMember.personId}`;
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
  }, [demoMember.personId, listingId, messages]);

  const byId = useMemo(() => {
    const map = new Map<string, MarketplaceMessageView>();
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
          onBack={() => router.push("/marketplace")}
          onExit={() => router.push("/services")}
        />
        <EmptyState
          title="No disponible"
          description="El mercado no está activo en tu comunidad."
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
          onBack={() => router.push(`/marketplace/${listingId}`)}
          onExit={() => router.push("/services")}
        />
        <EmptyState
          title="Conversación no disponible"
          description="Esta conversación es privada entre quien publicó y quien contacta sobre este anuncio."
          actionLabel="Volver al anuncio"
          onAction={() => router.push(`/marketplace/${listingId}`)}
        />
      </MobileScreen>
    );
  }

  const sendDraft = () => {
    expressMarketplaceInterest({
      listingId,
      personId: demoMember.personId,
    });
    const created = postMarketplaceMessage({
      listingId,
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
    toggleMarketplaceMessageReaction({
      listingId,
      messageId,
      reaction,
      personId: demoMember.personId,
      displayName: demoMember.displayName,
    });
    refresh();
  };

  const reactionOptions = DEMO_MARKETPLACE_CONVERSATION_REACTIONS.map(
    (reaction) => ({
      id: reaction,
      glyph: REACTION_TYPE_GLYPH[reaction],
    }),
  );

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
          {MARKETPLACE_QUICK_ACTION_LABELS[message.quickActionKind]}
        </span>
      ) : undefined,
      reactionSummary: DEMO_MARKETPLACE_CONVERSATION_REACTIONS.map(
        (reaction) => ({
          id: reaction,
          glyph: REACTION_TYPE_GLYPH[reaction],
          count: message.reactionSummary?.[reaction] ?? 0,
          active: message.reactors.some(
            (r) =>
              r.personId === demoMember.personId && r.reaction === reaction,
          ),
        }),
      ),
      reactionOptions,
      reactors: message.reactors.map((r) => ({
        personId: r.personId,
        displayName: r.displayName,
        reactionId: r.reaction,
      })),
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
              softDeleteMarketplaceMessage({
                listingId,
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

  const reason = kindLabel || "Consulta de anuncio";

  return (
    <MobileScreen dense className="gap-0 pb-0">
      <ConversationExperience
        onBack={() => router.push(`/marketplace/${listingId}`)}
        infoOpen={infoOpen}
        onInfoOpenChange={setInfoOpen}
        infoDescription={listing?.title ? `${listing.title} · ${reason}` : reason}
        infoMembers={infoMembers}
        header={{
          name: peerName,
          avatarUrl: peerAvatarUrl,
          reason,
          contextTitle: listing?.title ?? "Anuncio",
          contextImageUrl: listing?.imageUrl,
        }}
        messages={listItems}
        viewerPersonId={demoMember.personId}
        selectionMode={selectionMode}
        firstUnreadMessageId={firstUnreadMessageId}
        emptyTitle="Todavía no hay mensajes"
        emptyDescription="Escribe para coordinar recogida o detalles sobre este anuncio."
        composer={{
          value: draft,
          onChange: setDraft,
          onSend: sendDraft,
          placeholder: "Escribe un mensaje…",
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
