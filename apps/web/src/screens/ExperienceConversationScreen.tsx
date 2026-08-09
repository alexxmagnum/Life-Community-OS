"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DEMO_CONVERSATION_REACTIONS,
  getExperienceConversationBundle,
  postExperienceMessage,
  postExperienceQuickAction,
  QUICK_ACTION_LABELS,
  toggleExperienceMessageReaction,
  type ExperienceMessageView,
} from "@life-community-os/tenant-life-panoramica";
import {
  createExperienceConversationAdapter,
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
import { canOpenExperienceConversation } from "@/lib/experience-conversation-access";
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";

/**
 * Contextual Experience Conversation — not a global chat inbox.
 * "People preparing something together."
 */
export function ExperienceConversationScreen({
  experienceId,
}: {
  experienceId: string;
}) {
  const router = useRouter();
  const {
    configuration,
    isFeatureEnabled,
    isModuleEnabled,
    hasCapability,
    demoMember,
  } = useTenant();
  const [messages, setMessages] = useState<ExperienceMessageView[]>([]);
  const [draft, setDraft] = useState("");
  const [ready, setReady] = useState(false);
  const [allowed, setAllowed] = useState(false);
  const [title, setTitle] = useState("Conversación del evento");
  const [experienceTitle, setExperienceTitle] = useState("");
  const [participantCount, setParticipantCount] = useState(0);

  const moduleOn =
    isFeatureEnabled("experiences") && isModuleEnabled("experiences");

  const refresh = useCallback(() => {
    if (!moduleOn || !hasCapability(CAPABILITIES.experienceView)) {
      setAllowed(false);
      setMessages([]);
      setReady(true);
      return;
    }

    const bundle = getExperienceConversationBundle(experienceId);
    if (!bundle) {
      setAllowed(false);
      setMessages([]);
      setReady(true);
      return;
    }

    const open = canOpenExperienceConversation({
      experience: bundle.experience,
      configuration,
      isModuleEnabled,
      hasCapability,
    });
    setAllowed(open);
    setMessages(bundle.messages);
    setTitle(bundle.conversation.title ?? "Conversación del evento");
    setExperienceTitle(bundle.experience.title);
    const adapter = createExperienceConversationAdapter();
    const participants = adapter.listParticipants(
      bundle.conversation.context,
      bundle.experience as never,
    );
    setParticipantCount(
      Math.max(participants.length, bundle.experience.participantCount),
    );
    setReady(true);
  }, [
    configuration,
    experienceId,
    hasCapability,
    isModuleEnabled,
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
          onBack={() => router.push("/experiences")}
          onExit={() => router.push("/experiences")}
        />
        <EmptyState
          title="No disponible"
          description="Las actividades no están activas en tu comunidad."
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
          onBack={() => router.push(`/experiences/${experienceId}`)}
          onExit={() => router.push("/experiences")}
        />
        <EmptyState
          title="Conversación no disponible"
          description="Esta conversación no está abierta para tu cuenta o el evento ya no admite mensajes."
          actionLabel="Volver a la actividad"
          onAction={() => router.push(`/experiences/${experienceId}`)}
        />
      </MobileScreen>
    );
  }

  const sendDraft = () => {
    const created = postExperienceMessage({
      experienceId,
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
    postExperienceQuickAction({
      experienceId,
      authorPersonId: demoMember.personId,
      authorName: demoMember.displayName,
      authorAvatarUrl: demoMember.avatarUrl,
      kind,
    });
    refresh();
  };

  const onReaction = (messageId: string, reaction: ReactionType) => {
    toggleExperienceMessageReaction({
      experienceId,
      messageId,
      reaction,
    });
    refresh();
  };

  return (
    <MobileScreen>
      <FlowScreenHeader
        title={title}
        subtitle={experienceTitle || "Actividad"}
        onBack={() => router.push(`/experiences/${experienceId}`)}
        onExit={() => router.push("/experiences")}
      />

      <header className="space-y-2 border-b border-[var(--color-border-subtle)] pb-4">
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="rounded-full bg-[var(--color-action-primary-subtle)] px-2.5 py-1 text-[14px] font-semibold text-[var(--color-action-primary)]">
            Experiencia
          </span>
          <span className="text-[15px] text-[var(--color-text-tertiary)]">
            {participantCount} personas preparándose
          </span>
        </div>
      </header>

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
                      {QUICK_ACTION_LABELS[message.quickActionKind]}
                    </span>
                  ) : null}
                </div>
                {message.body ? (
                  <p className="mt-1 text-[15px] leading-snug text-[var(--color-text-secondary)]">
                    {message.body}
                  </p>
                ) : null}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {DEMO_CONVERSATION_REACTIONS.map((reaction) => {
                    const count = message.reactionSummary?.[reaction] ?? 0;
                    return (
                      <button
                        key={reaction}
                        type="button"
                        onClick={() => onReaction(message.id, reaction)}
                        className={
                          count > 0
                            ? "inline-flex min-h-[36px] items-center gap-1 rounded-full bg-[var(--color-action-primary-subtle)] px-2.5 text-[15px] font-semibold text-[var(--color-action-primary)]"
                            : "inline-flex min-h-[36px] items-center gap-1 rounded-full bg-[var(--color-surface-elevated)] px-2.5 text-[15px] text-[var(--color-text-tertiary)]"
                        }
                        aria-label={`Reacción ${REACTION_TYPE_GLYPH[reaction]}`}
                      >
                        <span aria-hidden>{REACTION_TYPE_GLYPH[reaction]}</span>
                        {count > 0 ? <span>{count}</span> : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

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
              {QUICK_ACTION_LABELS[kind]}
            </button>
          ))}
        </div>

        <label className="block space-y-1.5">
          <span className="sr-only">Escribe un mensaje</span>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={2}
            placeholder="Escribe a tus vecinos…"
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
