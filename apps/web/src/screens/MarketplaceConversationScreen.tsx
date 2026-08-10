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
  Avatar,
  EmptyState,
  FlowScreenHeader,
  MobileScreen,
} from "@life-community-os/ui";
import {
  canOpenMarketplaceConversation,
  canViewMarketplaceConversation,
} from "@/lib/marketplace-conversation-access";
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";

/**
 * Contextual Marketplace Listing Conversation — not a global chat inbox.
 * Contact is about this specific listing.
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
  const [title, setTitle] = useState("Conversación del anuncio");
  const [listingTitle, setListingTitle] = useState("");
  const [kindLabel, setKindLabel] = useState("");
  const [participantLabel, setParticipantLabel] = useState("");

  const moduleOn =
    isModuleEnabled("marketplace") && isFeatureEnabled("marketplace");

  const refresh = useCallback(() => {
    if (!moduleOn || !hasCapability(CAPABILITIES.marketplaceView)) {
      setAllowed(false);
      setMessages([]);
      setReady(true);
      return;
    }

    const bundle = getMarketplaceConversationBundle(listingId);
    if (!bundle || !bundle.listing.authorPersonId) {
      setAllowed(false);
      setMessages([]);
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
    setTitle(bundle.conversation.title ?? "Conversación del anuncio");
    setListingTitle(bundle.listing.title);
    setKindLabel(marketplaceKindLabel(bundle.listing.kind));

    const adapter = createMarketplaceConversationAdapter();
    const participants = adapter.listParticipants(bundle.conversation.context, {
      id: bundle.listing.id,
      title: bundle.listing.title,
      authorPersonId: bundle.listing.authorPersonId,
      interestedPersonIds: bundle.interestedPersonIds,
      status: "open",
    });
    const names = participants.map((p) => {
      if (p.personId === demoMember.personId) return "Tú";
      if (p.personId === bundle.listing.authorPersonId) {
        return bundle.listing.authorName;
      }
      return "Vecino";
    });
    setParticipantLabel(
      names.length > 0
        ? names.join(" · ")
        : `${Math.max(participants.length, 1)} personas`,
    );
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

  return (
    <MobileScreen>
      <FlowScreenHeader
        title={title}
        subtitle={listingTitle || "Anuncio"}
        onBack={() => router.push(`/marketplace/${listingId}`)}
        onExit={() => router.push("/services")}
      />

      <header className="space-y-2 border-b border-[var(--color-border-subtle)] pb-4">
        <p className="text-[13px] leading-5 text-[var(--color-text-secondary)]">
          Conversación sobre este anuncio concreto — no es un chat general.
        </p>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {kindLabel ? (
            <span className="rounded-full bg-[var(--color-action-primary-subtle)] px-2.5 py-1 text-[14px] font-semibold text-[var(--color-action-primary)]">
              {kindLabel}
            </span>
          ) : null}
          <span className="text-[15px] text-[var(--color-text-tertiary)]">
            {participantLabel}
          </span>
        </div>
      </header>

      {messages.length === 0 ? (
        <EmptyState
          title="Todavía no hay mensajes"
          description="Escribe para coordinar recogida o detalles sobre este anuncio."
        />
      ) : (
        <ul className="mt-2 space-y-4" aria-live="polite">
          {messages.map((message) => {
            const mine = message.authorPersonId === demoMember.personId;
            return (
              <li key={message.id} className="flex gap-3">
                <Avatar
                  src={message.author.avatarUrl}
                  alt={message.author.displayName}
                  size="md"
                  className="mt-0.5"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[14px] font-semibold text-[var(--color-text-primary)]">
                      {mine ? "Tú" : message.author.displayName}
                    </span>
                    {message.quickActionKind ? (
                      <span className="rounded-full bg-[var(--color-surface-elevated)] px-2 py-0.5 text-[15px] font-semibold text-[var(--color-text-secondary)]">
                        {MARKETPLACE_QUICK_ACTION_LABELS[message.quickActionKind]}
                      </span>
                    ) : null}
                  </div>
                  {message.body ? (
                    <p className="mt-1 text-[15px] leading-snug text-[var(--color-text-secondary)]">
                      {message.body}
                    </p>
                  ) : null}
                  <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
                    {DEMO_MARKETPLACE_CONVERSATION_REACTIONS.map((reaction) => {
                      const count = message.reactionSummary?.[reaction] ?? 0;
                      if (count <= 0) {
                        return (
                          <button
                            key={reaction}
                            type="button"
                            onClick={() => onReaction(message.id, reaction)}
                            className="min-h-[28px] text-[12px] font-medium text-[var(--color-text-tertiary)]"
                            aria-label={`Reacción ${REACTION_TYPE_GLYPH[reaction]}`}
                          >
                            {REACTION_TYPE_GLYPH[reaction]}
                          </button>
                        );
                      }
                      return (
                        <button
                          key={reaction}
                          type="button"
                          onClick={() => onReaction(message.id, reaction)}
                          className="min-h-[28px] text-[12px] font-semibold text-[var(--color-action-primary)]"
                          aria-label={`Reacción ${REACTION_TYPE_GLYPH[reaction]}`}
                        >
                          {REACTION_TYPE_GLYPH[reaction]} {count}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <section className="mt-6 space-y-3 border-t border-[var(--color-border-subtle)] pt-4">
        <p className="text-[15px] font-semibold text-[var(--color-text-secondary)]">
          Respuestas rápidas
        </p>
        <div className="flex flex-wrap gap-2">
          {QUICK_ACTION_KINDS.map((kind) => (
            <button
              key={kind}
              type="button"
              onClick={() => onQuickAction(kind)}
              className="min-h-[44px] rounded-full bg-[var(--color-surface-elevated)] px-3.5 text-[14px] font-semibold text-[var(--color-text-primary)] shadow-[var(--shadow-elev-1)] transition-transform active:scale-[0.98]"
            >
              {MARKETPLACE_QUICK_ACTION_LABELS[kind]}
            </button>
          ))}
        </div>

        <label className="block space-y-1.5">
          <span className="sr-only">Escribe un mensaje sobre este anuncio</span>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={2}
            placeholder="Escribe sobre este anuncio…"
            className="min-h-[88px] w-full resize-none rounded-[14px] border border-[var(--color-border-subtle)] bg-white px-3.5 py-3 text-[15px] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-action-primary)] focus:ring-2 focus:ring-[var(--color-action-primary-subtle)]"
            maxLength={500}
          />
        </label>
        <button
          type="button"
          onClick={sendDraft}
          disabled={!draft.trim()}
          className="flex min-h-[52px] w-full items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-action-primary)] text-[16px] font-semibold text-[var(--color-text-inverse)] disabled:opacity-45"
        >
          Enviar
        </button>
      </section>
    </MobileScreen>
  );
}
