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
  canOpenOfficialConversation,
  canViewOfficialConversation,
  isOfficialEntitySurfaceAvailable,
} from "@/lib/official-conversation-access";
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";

/**
 * Official contextual communication — Shared Product shell (Phase 2.6).
 * Not a resident chat room. Preserves authority, reply gates, and trust.
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
  const [noticeTitle, setNoticeTitle] = useState("Comunicación oficial");
  const [entityName, setEntityName] = useState("");
  const [entityImageUrl, setEntityImageUrl] = useState<string | undefined>();
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
    setNoticeTitle(bundle.snapshot.title);
    setEntityName(bundle.entity.name);
    setEntityImageUrl(bundle.entity.imageUrl);
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

  const listItems: MessageListItem[] = messages.map((message) => {
    const official = Boolean(message.author.isOfficial);
    const badges = (
      <>
        {official ? (
          <span className="rounded-full bg-[var(--color-accent-official)]/20 px-2 py-0.5 text-[12px] font-semibold text-[var(--color-accent-official)]">
            Oficial
          </span>
        ) : null}
        {message.quickActionKind &&
        OFFICIAL_QUICK_ACTION_LABELS[message.quickActionKind] ? (
          <span className="ml-1 rounded-full bg-black/10 px-2 py-0.5 text-[12px] font-semibold">
            {OFFICIAL_QUICK_ACTION_LABELS[message.quickActionKind]}
          </span>
        ) : null}
      </>
    );

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
      badge:
        official || message.quickActionKind ? (
          <span className="inline-flex flex-wrap items-center gap-1">
            {badges}
          </span>
        ) : undefined,
      reactions: canReact ? (
        <ReactionPicker
          options={DEMO_OFFICIAL_CONVERSATION_REACTIONS.map((reaction) => ({
            id: reaction,
            glyph: REACTION_TYPE_GLYPH[reaction],
            count: message.reactionSummary?.[reaction] ?? 0,
          }))}
          onSelect={(id) => onReaction(message.id, id as ReactionType)}
        />
      ) : undefined,
    };
  });

  return (
    <MobileScreen dense>
      <ConversationShell
        header={
          <>
            <FlowScreenHeader
              title="Comunicación oficial"
              subtitle={entityName}
              onBack={() => router.push(`/official/${entity.slug}`)}
              onExit={() => router.push("/")}
            />
            <ContextHeader
              name={entityName}
              avatarUrl={entityImageUrl}
              reason={modeLabel || "Aviso oficial"}
              context={{
                title: noticeTitle,
                subtitle: statusLabel,
                imageUrl: entityImageUrl,
                statusLabel: statusLabel || undefined,
                onClick: () => router.push(`/official/${entity.slug}`),
              }}
              trailing={
                canModerate && noticeId ? (
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setOfficialConversationStatus({
                          noticeId,
                          status: "locked",
                        });
                        refresh();
                      }}
                      className="min-h-[32px] rounded-full bg-[var(--color-surface-elevated)] px-2.5 text-[12px] font-semibold shadow-[var(--shadow-elev-1)]"
                    >
                      Bloquear
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setOfficialConversationStatus({
                          noticeId,
                          status: "archived",
                        });
                        refresh();
                      }}
                      className="min-h-[32px] rounded-full bg-[var(--color-surface-elevated)] px-2.5 text-[12px] font-semibold shadow-[var(--shadow-elev-1)]"
                    >
                      Archivar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setOfficialConversationStatus({
                          noticeId,
                          status: "active",
                        });
                        refresh();
                      }}
                      className="min-h-[32px] rounded-full bg-[var(--color-surface-elevated)] px-2.5 text-[12px] font-semibold shadow-[var(--shadow-elev-1)]"
                    >
                      Reactivar
                    </button>
                  </div>
                ) : undefined
              }
            />
          </>
        }
        footer={
          canReply ? (
            <MessageComposer
              value={draft}
              onChange={setDraft}
              onSend={sendDraft}
              placeholder="Pregunta o responde a la administración…"
              quickActions={
                <div className="space-y-2">
                  <p className="text-[12px] font-semibold text-[var(--color-text-tertiary)]">
                    Respuestas
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {OFFICIAL_RESIDENT_QUICK_ACTIONS.map((kind) => (
                      <button
                        key={kind}
                        type="button"
                        onClick={() => onQuickAction(kind)}
                        className="min-h-[40px] rounded-full bg-[var(--color-surface-elevated)] px-3 text-[13px] font-semibold text-[var(--color-text-primary)] shadow-[var(--shadow-elev-1)] transition-transform active:scale-[0.98]"
                      >
                        {OFFICIAL_QUICK_ACTION_LABELS[kind]}
                      </button>
                    ))}
                  </div>
                </div>
              }
            />
          ) : (
            <p className="px-1 text-[14px] leading-6 text-[var(--color-text-tertiary)]">
              Este es un aviso oficial. Puedes leerlo
              {canReact ? " y reaccionar" : ""}, pero no hay discusión abierta.
            </p>
          )
        }
      >
        <MessageList
          messages={listItems}
          viewerPersonId={demoMember.personId}
          emptyTitle="Todavía no hay mensajes"
          emptyDescription="Cuando haya respuestas o actualizaciones aparecerán aquí."
        />
      </ConversationShell>
    </MobileScreen>
  );
}
