"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DEMO_PLACE_CONVERSATION_REACTIONS,
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
  Avatar,
  EmptyState,
  FlowScreenHeader,
  MobileScreen,
} from "@life-community-os/ui";
import {
  canOpenPlaceConversation,
  canViewPlaceConversation,
} from "@/lib/place-conversation-access";
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";

/**
 * Contextual place Conversation — neighbours asking about a specific place.
 * Not a global chat. Not a WhatsApp clone.
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

  return (
    <MobileScreen>
      <FlowScreenHeader
        title={placeName}
        subtitle="Pregunta a vecinos sobre este lugar"
        onBack={() => router.push(`/near/place/${placeId}`)}
        onExit={() => router.push("/")}
      />

      <header className="space-y-2 border-b border-[var(--color-border-subtle)] pb-4">
        <p className="text-[13px] leading-5 text-[var(--color-text-secondary)]">
          Conversación sobre “{placeName}” — no es un chat general.
        </p>
      </header>

      {messages.length === 0 ? (
        <EmptyState
          title="Todavía no hay preguntas"
          description="Sé el primero en preguntar a tus vecinos sobre este lugar."
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
                        {PLACE_QUICK_ACTION_LABELS[message.quickActionKind]}
                      </span>
                    ) : null}
                  </div>
                  {message.body ? (
                    <p className="mt-1 text-[15px] leading-snug text-[var(--color-text-secondary)]">
                      {message.body}
                    </p>
                  ) : null}
                  <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
                    {DEMO_PLACE_CONVERSATION_REACTIONS.map((reaction) => {
                      const count = message.reactionSummary?.[reaction] ?? 0;
                      return (
                        <button
                          key={reaction}
                          type="button"
                          onClick={() => onReaction(message.id, reaction)}
                          className={
                            count > 0
                              ? "min-h-[28px] text-[12px] font-semibold text-[var(--color-action-primary)]"
                              : "min-h-[28px] text-[12px] font-medium text-[var(--color-text-tertiary)]"
                          }
                          aria-label={`Reacción ${REACTION_TYPE_GLYPH[reaction]}`}
                        >
                          {REACTION_TYPE_GLYPH[reaction]}
                          {count > 0 ? ` ${count}` : ""}
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
              {PLACE_QUICK_ACTION_LABELS[kind]}
            </button>
          ))}
        </div>

        <label className="block space-y-1.5">
          <span className="sr-only">Pregunta sobre este lugar</span>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={2}
            placeholder={`Pregunta sobre ${placeName}…`}
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
