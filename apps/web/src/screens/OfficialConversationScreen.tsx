"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DEMO_OFFICIAL_CONVERSATION_REACTIONS,
  getOfficialConversationBundleForEntity,
  getOfficialEntityBySlug,
  officialInteractionModeLabel,
  OFFICIAL_QUICK_ACTION_LABELS,
  postOfficialResidentMessage,
  setOfficialConversationStatus,
  softDeleteOfficialMessage,
  toggleOfficialMessageReaction,
  type OfficialMessageView,
} from "@life-community-os/tenant-life-panoramica";
import {
  allowsOfficialReactions,
  allowsOfficialResidentReplies,
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
  canOpenOfficialConversation,
  canViewOfficialConversation,
  isOfficialEntitySurfaceAvailable,
} from "@/lib/official-conversation-access";
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";

function previewBody(body?: string): string {
  const t = (body ?? "").trim();
  if (!t) return "Mensaje";
  return t.length > 80 ? `${t.slice(0, 77)}…` : t;
}

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
  const [replyTo, setReplyTo] = useState<MessageComposerReplyTarget | null>(
    null,
  );
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [firstUnreadMessageId, setFirstUnreadMessageId] = useState<
    string | null
  >(null);
  const [infoOpen, setInfoOpen] = useState(false);

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

  useEffect(() => {
    if (!noticeId || messages.length === 0) {
      setFirstUnreadMessageId(null);
      return;
    }
    const key = `lcos.unread.official.${noticeId}.${demoMember.personId}`;
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
  }, [demoMember.personId, messages, noticeId]);

  const byId = useMemo(() => {
    const map = new Map<string, OfficialMessageView>();
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
      replyToMessageId: replyTo?.messageId,
    });
    if (created) {
      setDraft("");
      setReplyTo(null);
      refresh();
    }
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

  const reactionOptions = DEMO_OFFICIAL_CONVERSATION_REACTIONS.map(
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
    const official = Boolean(message.author.isOfficial);
    const parent = message.replyToMessageId
      ? byId.get(message.replyToMessageId)
      : undefined;
    const badges = (
      <>
        {official ? (
          <span className="rounded-full bg-[var(--color-accent-official)]/20 px-2 py-0.5 text-[11px] font-semibold text-[var(--color-accent-official)]">
            Oficial
          </span>
        ) : null}
        {message.quickActionKind &&
        OFFICIAL_QUICK_ACTION_LABELS[message.quickActionKind] ? (
          <span className="ml-1 rounded-full bg-black/10 px-2 py-0.5 text-[11px] font-semibold">
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
      replyPreview: parent ? previewBody(parent.body) : undefined,
      replyAuthorName: parent?.author.displayName,
      badge:
        official || message.quickActionKind ? (
          <span className="inline-flex flex-wrap items-center gap-1">
            {badges}
          </span>
        ) : undefined,
      reactionSummary: canReact
        ? DEMO_OFFICIAL_CONVERSATION_REACTIONS.map((reaction) => ({
            id: reaction,
            glyph: REACTION_TYPE_GLYPH[reaction],
            count: message.reactionSummary?.[reaction] ?? 0,
          }))
        : undefined,
      reactionOptions: canReact ? reactionOptions : undefined,
      onReaction: canReact
        ? (id) => onReaction(message.id, id as ReactionType)
        : undefined,
      onReply: canReply
        ? () =>
            setReplyTo({
              messageId: message.id,
              authorName: message.author.displayName,
              bodyPreview: previewBody(message.body),
            })
        : undefined,
      onSelect: () => toggleSelect(message.id),
      onDeleteOwn:
        message.authorPersonId === demoMember.personId
          ? () => {
              if (!noticeId) return;
              softDeleteOfficialMessage({
                noticeId,
                messageId: message.id,
                actorPersonId: demoMember.personId,
              });
              refresh();
            }
          : undefined,
      selected: selectedIds.includes(message.id),
      deleteEnabled: message.authorPersonId === demoMember.personId,
      forwardEnabled: false,
      actionsDisabled: !canReact && !canReply,
    };
  });

  const reason = modeLabel || statusLabel || "Aviso oficial";

  return (
    <MobileScreen dense className="gap-0 pb-0">
      <ConversationExperience
        onBack={() => router.push(`/official/${entity.slug}`)}
        infoOpen={infoOpen}
        onInfoOpenChange={setInfoOpen}
        infoDescription={noticeTitle ? `${noticeTitle} · ${reason}` : reason}
        infoMembers={infoMembers}
        header={{
          name: entityName,
          avatarUrl: entityImageUrl,
          reason,
          contextTitle: noticeTitle,
          contextImageUrl: entityImageUrl,
        }}
        trailing={
          canModerate && noticeId ? (
            <button
              type="button"
              onClick={() => {
                setOfficialConversationStatus({
                  noticeId,
                  status: "locked",
                });
                refresh();
              }}
              className="rounded-full bg-[var(--color-surface-muted)] px-2.5 py-1.5 text-[11px] font-semibold text-[var(--color-text-secondary)]"
            >
              Bloquear
            </button>
          ) : undefined
        }
        messages={listItems}
        viewerPersonId={demoMember.personId}
        selectionMode={selectionMode}
        firstUnreadMessageId={firstUnreadMessageId}
        emptyTitle="Todavía no hay mensajes"
        emptyDescription="Cuando haya respuestas o actualizaciones aparecerán aquí."
        footerOverride={
          canReply ? undefined : (
            <p className="px-1 py-2 text-[13px] leading-5 text-[var(--color-text-tertiary)]">
              Aviso oficial. Puedes leerlo
              {canReact ? " y reaccionar" : ""}; no hay discusión abierta.
            </p>
          )
        }
        composer={
          canReply
            ? {
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
              }
            : undefined
        }
      />
    </MobileScreen>
  );
}
