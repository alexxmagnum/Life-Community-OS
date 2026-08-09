"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DEMO_OFFICIAL_CONVERSATION_REACTIONS,
  getOfficialConversationBundleForEntity,
  getOfficialEntityBySlug,
  officialInteractionModeLabel,
  OFFICIAL_QUICK_ACTION_LABELS,
  OFFICIAL_RESIDENT_QUICK_ACTIONS,
  postOfficialQuickAction,
  postOfficialResidentMessage,
  setOfficialConversationStatus,
  toggleOfficialMessageReaction,
  type OfficialMessageView,
} from "@life-community-os/tenant-life-panoramica";
import {
  allowsOfficialReactions,
  allowsOfficialResidentReplies,
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
  canOpenOfficialConversation,
  canViewOfficialConversation,
  isOfficialEntitySurfaceAvailable,
} from "@/lib/official-conversation-access";
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";

/**
 * Official contextual communication — not a resident chat room.
 */
export function OfficialConversationScreen({ slug }: { slug: string }) {
  const router = useRouter();
  const {
    configuration,
    isModuleEnabled,
    hasCapability,
    demoMember,
  } = useTenant();
  const [messages, setMessages] = useState<OfficialMessageView[]>([]);
  const [draft, setDraft] = useState("");
  const [ready, setReady] = useState(false);
  const [allowed, setAllowed] = useState(false);
  const [title, setTitle] = useState("Comunicación oficial");
  const [entityName, setEntityName] = useState("");
  const [statusLabel, setStatusLabel] = useState("");
  const [modeLabel, setModeLabel] = useState("");
  const [noticeId, setNoticeId] = useState<string | null>(null);
  const [canReply, setCanReply] = useState(false);
  const [canReact, setCanReact] = useState(false);
  const [canModerate, setCanModerate] = useState(false);

  const entity = getOfficialEntityBySlug(slug);
  const surfaceOn = entity
    ? isOfficialEntitySurfaceAvailable({ entity, isModuleEnabled })
    : false;

  const refresh = useCallback(() => {
    if (!entity || !surfaceOn) {
      setAllowed(false);
      setMessages([]);
      setReady(true);
      return;
    }

    const bundle = getOfficialConversationBundleForEntity(entity.id);
    if (!bundle) {
      setAllowed(false);
      setMessages([]);
      setReady(true);
      return;
    }

    const open = canOpenOfficialConversation({
      entity,
      noticeId: bundle.snapshot.id,
      configuration,
      isModuleEnabled,
      hasCapability,
    });
    const view = canViewOfficialConversation({
      entity,
      personId: demoMember.personId,
      noticeId: bundle.snapshot.id,
      configuration,
      isModuleEnabled,
      hasCapability,
    });
    setAllowed(open && view);
    setMessages(bundle.messages);
    setTitle(bundle.snapshot.title);
    setEntityName(bundle.entity.name);
    setNoticeId(bundle.snapshot.id);
    setModeLabel(officialInteractionModeLabel(bundle.snapshot.interactionMode));
    setStatusLabel(
      bundle.snapshot.status === "locked"
        ? "Bloqueado"
        : bundle.snapshot.status === "archived"
          ? "Archivado"
          : "Activo",
    );
    setCanReply(allowsOfficialResidentReplies(bundle.snapshot));
    setCanReact(allowsOfficialReactions(bundle.snapshot));
    setCanModerate(hasCapability(CAPABILITIES.announcementPublishOfficial));
    setReady(true);
  }, [
    configuration,
    demoMember.personId,
    entity,
    hasCapability,
    isModuleEnabled,
    surfaceOn,
  ]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (!entity || !surfaceOn) {
    return (
      <MobileScreen>
        <FlowScreenHeader
          title="Comunicación oficial"
          onBack={() => router.push("/")}
          onExit={() => router.push("/")}
        />
        <EmptyState
          title="No disponible"
          description="Esta comunicación oficial no está activa en tu comunidad."
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
          title="Comunicación oficial"
          onBack={() => router.push(`/official/${entity.slug}`)}
          onExit={() => router.push("/")}
        />
        <EmptyState
          title="Comunicación no disponible"
          description="No puedes ver este aviso ahora mismo, o el módulo está desactivado."
          actionLabel="Volver"
          onAction={() => router.push(`/official/${entity.slug}`)}
        />
      </MobileScreen>
    );
  }

  const sendDraft = () => {
    if (!noticeId || !canReply) return;
    const created = postOfficialResidentMessage({
      noticeId,
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
    if (!noticeId || !canReply) return;
    postOfficialQuickAction({
      noticeId,
      authorPersonId: demoMember.personId,
      authorName: demoMember.displayName,
      authorAvatarUrl: demoMember.avatarUrl,
      kind,
    });
    refresh();
  };

  const onReaction = (messageId: string, reaction: ReactionType) => {
    if (!noticeId || !canReact) return;
    toggleOfficialMessageReaction({
      noticeId,
      messageId,
      reaction,
    });
    refresh();
  };

  return (
    <MobileScreen>
      <FlowScreenHeader
        title={title}
        subtitle={entityName}
        onBack={() => router.push(`/official/${entity.slug}`)}
        onExit={() => router.push("/")}
      />

      <header className="space-y-2 border-b border-[var(--color-border-subtle)] pb-4">
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="rounded-full bg-[var(--color-action-primary-subtle)] px-2.5 py-1 text-[14px] font-semibold text-[var(--color-action-primary)]">
            {modeLabel}
          </span>
          <span className="text-[15px] text-[var(--color-text-tertiary)]">
            {statusLabel}
          </span>
        </div>
      </header>

      {canModerate && noticeId ? (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setOfficialConversationStatus({ noticeId, status: "locked" });
              refresh();
            }}
            className="min-h-[40px] rounded-full bg-[var(--color-surface-elevated)] px-3 text-[15px] font-semibold text-[var(--color-text-primary)] shadow-[var(--shadow-elev-1)]"
          >
            Bloquear
          </button>
          <button
            type="button"
            onClick={() => {
              setOfficialConversationStatus({ noticeId, status: "archived" });
              refresh();
            }}
            className="min-h-[40px] rounded-full bg-[var(--color-surface-elevated)] px-3 text-[15px] font-semibold text-[var(--color-text-primary)] shadow-[var(--shadow-elev-1)]"
          >
            Archivar
          </button>
          <button
            type="button"
            onClick={() => {
              setOfficialConversationStatus({ noticeId, status: "active" });
              refresh();
            }}
            className="min-h-[40px] rounded-full bg-[var(--color-surface-elevated)] px-3 text-[15px] font-semibold text-[var(--color-text-primary)] shadow-[var(--shadow-elev-1)]"
          >
            Reactivar
          </button>
        </div>
      ) : null}

      <ul className="mt-2 space-y-4" aria-live="polite">
        {messages.map((message) => {
          const mine = message.authorPersonId === demoMember.personId;
          const official = Boolean(message.author.isOfficial);
          return (
            <li key={message.id} className="flex gap-3">
              <Avatar
                src={message.author.avatarUrl}
                alt={message.author.displayName}
                size="md"
                className="mt-0.5"
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-[14px] font-semibold text-[var(--color-text-primary)]">
                    {mine ? "Tú" : message.author.displayName}
                  </span>
                  {official ? (
                    <span className="rounded-full bg-[var(--color-accent-official)]/15 px-2 py-0.5 text-[15px] font-semibold text-[var(--color-accent-official)]">
                      Oficial
                    </span>
                  ) : null}
                  {message.quickActionKind &&
                  OFFICIAL_QUICK_ACTION_LABELS[message.quickActionKind] ? (
                    <span className="rounded-full bg-[var(--color-surface-elevated)] px-2 py-0.5 text-[15px] font-semibold text-[var(--color-text-secondary)]">
                      {OFFICIAL_QUICK_ACTION_LABELS[message.quickActionKind]}
                    </span>
                  ) : null}
                </div>
                {message.body ? (
                  <p className="mt-1 text-[15px] leading-snug text-[var(--color-text-secondary)]">
                    {message.body}
                  </p>
                ) : null}
                {canReact ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {DEMO_OFFICIAL_CONVERSATION_REACTIONS.map((reaction) => {
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
                          <span aria-hidden>
                            {REACTION_TYPE_GLYPH[reaction]}
                          </span>
                          {count > 0 ? <span>{count}</span> : null}
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>

      {canReply ? (
        <section className="mt-6 space-y-3 border-t border-[var(--color-border-subtle)] pt-4">
          <p className="text-[15px] font-semibold text-[var(--color-text-secondary)]">
            Respuestas
          </p>
          <div className="flex flex-wrap gap-2">
            {OFFICIAL_RESIDENT_QUICK_ACTIONS.map((kind) => (
              <button
                key={kind}
                type="button"
                onClick={() => onQuickAction(kind)}
                className="min-h-[44px] rounded-full bg-[var(--color-surface-elevated)] px-3.5 text-[14px] font-semibold text-[var(--color-text-primary)] shadow-[var(--shadow-elev-1)] transition-transform active:scale-[0.98]"
              >
                {OFFICIAL_QUICK_ACTION_LABELS[kind]}
              </button>
            ))}
          </div>
          <label className="block space-y-1.5">
            <span className="sr-only">Escribe una respuesta</span>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={2}
              placeholder="Pregunta o responde a la administración…"
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
      ) : (
        <p className="mt-6 text-[14px] leading-6 text-[var(--color-text-tertiary)]">
          Este es un aviso oficial. Puedes leerlo
          {canReact ? " y reaccionar" : ""}, pero no hay discusión abierta.
        </p>
      )}
    </MobileScreen>
  );
}
