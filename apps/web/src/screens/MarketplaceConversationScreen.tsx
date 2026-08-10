"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DEMO_MARKETPLACE_CONVERSATION_REACTIONS,
  expressMarketplaceInterest,
  getMarketplaceConversationBundle,
  MARKETPLACE_QUICK_ACTION_LABELS,
  marketplaceKindLabel,
  postMarketplaceMessage,
  postMarketplaceQuickAction,
  toggleMarketplaceMessageReaction,
  type MarketplaceListing,
  type MarketplaceMessageView,
} from "@life-community-os/tenant-life-panoramica";
import {
  createMarketplaceConversationAdapter,
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
  canOpenMarketplaceConversation,
  canViewMarketplaceConversation,
} from "@/lib/marketplace-conversation-access";
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";

/**
 * Contextual Marketplace Listing Conversation — Shared Product shell (Phase 2.5).
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

  const moduleOn =
    isModuleEnabled("marketplace") && isFeatureEnabled("marketplace");

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
    });
    if (created) {
      setDraft("");
      refresh();
    }
  };

  const onQuickAction = (kind: QuickActionKind) => {
    postMarketplaceQuickAction({
      listingId,
      authorPersonId: demoMember.personId,
      authorName: demoMember.displayName,
      authorAvatarUrl: demoMember.avatarUrl,
      kind,
    });
    refresh();
  };

  const onReaction = (messageId: string, reaction: ReactionType) => {
    toggleMarketplaceMessageReaction({
      listingId,
      messageId,
      reaction,
    });
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
        {MARKETPLACE_QUICK_ACTION_LABELS[message.quickActionKind]}
      </span>
    ) : undefined,
    reactions: (
      <ReactionPicker
        options={DEMO_MARKETPLACE_CONVERSATION_REACTIONS.map((reaction) => ({
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
              subtitle="Sobre este anuncio"
              onBack={() => router.push(`/marketplace/${listingId}`)}
              onExit={() => router.push("/services")}
            />
            <ContextHeader
              name={peerName}
              avatarUrl={peerAvatarUrl}
              reason="Consulta de anuncio"
              context={{
                title: listing?.title ?? "Anuncio",
                subtitle: kindLabel || undefined,
                imageUrl: listing?.imageUrl,
                statusLabel: kindLabel || undefined,
                onClick: () => router.push(`/marketplace/${listingId}`),
              }}
            />
          </>
        }
        footer={
          <MessageComposer
            value={draft}
            onChange={setDraft}
            onSend={sendDraft}
            placeholder="Escribe sobre este anuncio…"
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
                      {MARKETPLACE_QUICK_ACTION_LABELS[kind]}
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
          emptyTitle="Todavía no hay mensajes"
          emptyDescription="Escribe para coordinar recogida o detalles sobre este anuncio."
        />
      </ConversationShell>
    </MobileScreen>
  );
}
