"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DEMO_WORK_CONVERSATION_REACTIONS,
  expressWorkInterest,
  getWorkConversationBundle,
  postWorkMessage,
  softDeleteWorkMessage,
  toggleWorkMessageReaction,
  WORK_QUICK_ACTION_LABELS,
  type WorkMessageView,
  type WorkPostListing,
} from "@life-community-os/tenant-life-panoramica";
import {
  createWorkConversationAdapter,
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
  canOpenWorkConversation,
  canViewWorkConversation,
} from "@/lib/work-conversation-access";
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";

function previewBody(body?: string): string {
  const t = (body ?? "").trim();
  if (!t) return "Mensaje";
  return t.length > 80 ? `${t.slice(0, 77)}…` : t;
}

/**
 * Contextual Work / service Conversation — Shared Product shell (Phase 2.6).
 * Not a global chat inbox. Domain logic unchanged.
 */
export function WorkConversationScreen({ workPostId }: { workPostId: string }) {
  const router = useRouter();
  const {
    configuration,
    isFeatureEnabled,
    isModuleEnabled,
    hasCapability,
    demoMember,
  } = useTenant();
  const [messages, setMessages] = useState<WorkMessageView[]>([]);
  const [draft, setDraft] = useState("");
  const [ready, setReady] = useState(false);
  const [allowed, setAllowed] = useState(false);
  const [workPost, setWorkPost] = useState<WorkPostListing | null>(null);
  const [peerName, setPeerName] = useState("Vecino");
  const [peerAvatarUrl, setPeerAvatarUrl] = useState<string | undefined>();
  const [categoryLabel, setCategoryLabel] = useState("");
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
    isModuleEnabled("services") &&
    (isFeatureEnabled("work") || isFeatureEnabled("services"));

  const refresh = useCallback(() => {
    if (!moduleOn || !hasCapability(CAPABILITIES.localView)) {
      setAllowed(false);
      setMessages([]);
      setWorkPost(null);
      setReady(true);
      return;
    }

    const bundle = getWorkConversationBundle(workPostId);
    if (!bundle) {
      setAllowed(false);
      setMessages([]);
      setWorkPost(null);
      setReady(true);
      return;
    }

    const snapshot = {
      ...bundle.workPost,
      interestedPersonIds: bundle.interestedPersonIds,
    };

    const open = canOpenWorkConversation({
      workPost: snapshot,
      configuration,
      isModuleEnabled,
      hasCapability,
    });
    const view = canViewWorkConversation({
      workPost: snapshot,
      personId: demoMember.personId,
      configuration,
      isModuleEnabled,
      hasCapability,
    });
    setAllowed(open && view);
    setMessages(bundle.messages);
    setWorkPost(bundle.workPost);
    setCategoryLabel(bundle.workPost.categoryLabel);

    const iAmAuthor =
      bundle.workPost.createdByPersonId === demoMember.personId;
    if (iAmAuthor) {
      const other = bundle.messages.find(
        (m) => m.authorPersonId !== demoMember.personId,
      );
      setPeerName(other?.author.displayName ?? "Interesado");
      setPeerAvatarUrl(other?.author.avatarUrl);
    } else {
      setPeerName(bundle.workPost.authorName);
      setPeerAvatarUrl(bundle.workPost.authorAvatarUrl);
    }

    const adapter = createWorkConversationAdapter();
    adapter.listParticipants(bundle.conversation.context, snapshot);
    setReady(true);
  }, [
    configuration,
    demoMember.personId,
    hasCapability,
    isModuleEnabled,
    moduleOn,
    workPostId,
  ]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (messages.length === 0) {
      setFirstUnreadMessageId(null);
      return;
    }
    const key = `lcos.unread.work.${workPostId}.${demoMember.personId}`;
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
  }, [demoMember.personId, messages, workPostId]);

  const byId = useMemo(() => {
    const map = new Map<string, WorkMessageView>();
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
          onBack={() => router.push("/services")}
          onExit={() => router.push("/services")}
        />
        <EmptyState
          title="No disponible"
          description="Los servicios no están activos en tu comunidad."
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
          onBack={() => router.push(`/services/work/${workPostId}`)}
          onExit={() => router.push("/services")}
        />
        <EmptyState
          title="Conversación no disponible"
          description="Esta conversación es privada entre quien publicó y quien contacta, o el anuncio ya no admite mensajes."
          actionLabel="Volver al anuncio"
          onAction={() => router.push(`/services/work/${workPostId}`)}
        />
      </MobileScreen>
    );
  }

  const sendDraft = () => {
    expressWorkInterest({
      workPostId,
      personId: demoMember.personId,
    });
    const created = postWorkMessage({
      workPostId,
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
    toggleWorkMessageReaction({
      workPostId,
      messageId,
      reaction,
    });
    refresh();
  };

  const reactionOptions = DEMO_WORK_CONVERSATION_REACTIONS.map((reaction) => ({
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
          {WORK_QUICK_ACTION_LABELS[message.quickActionKind]}
        </span>
      ) : undefined,
      reactionSummary: DEMO_WORK_CONVERSATION_REACTIONS.map((reaction) => ({
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
              softDeleteWorkMessage({
                workPostId,
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

  const reason = categoryLabel || "Servicio";

  return (
    <MobileScreen dense className="gap-0 pb-0">
      <ConversationExperience
        onBack={() => router.push(`/services/work/${workPostId}`)}
        infoOpen={infoOpen}
        onInfoOpenChange={setInfoOpen}
        infoDescription={workPost?.title ? `${workPost.title} · ${reason}` : reason}
        infoMembers={infoMembers}
        header={{
          name: peerName,
          avatarUrl: peerAvatarUrl,
          reason,
          contextTitle: workPost?.title ?? "Anuncio",
        }}
        messages={listItems}
        viewerPersonId={demoMember.personId}
        selectionMode={selectionMode}
        firstUnreadMessageId={firstUnreadMessageId}
        emptyTitle="Todavía no hay mensajes"
        emptyDescription="Escribe para coordinar detalles sobre este servicio."
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
