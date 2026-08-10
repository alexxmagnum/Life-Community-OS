"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DEMO_CONVERSATION_REACTIONS,
  getExperienceConversationBundle,
  postExperienceMessage,
  QUICK_ACTION_LABELS,
  softDeleteExperienceMessage,
  toggleExperienceMessageReaction,
  type ExperienceMessageView,
} from "@life-community-os/tenant-life-panoramica";
import {
  createExperienceConversationAdapter,
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
import { canOpenExperienceConversation } from "@/lib/experience-conversation-access";
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";

function previewBody(body?: string): string {
  const t = (body ?? "").trim();
  if (!t) return "Mensaje";
  return t.length > 80 ? `${t.slice(0, 77)}…` : t;
}

/**
 * Contextual Experience Conversation — Shared Product shell (Phase 2.6).
 * Participation (join/save/attendance) stays on the experience detail — not here.
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
  const [experienceTitle, setExperienceTitle] = useState("");
  const [experienceImageUrl, setExperienceImageUrl] = useState<
    string | undefined
  >();
  const [organizerName, setOrganizerName] = useState("Organizador");
  const [organizerAvatarUrl, setOrganizerAvatarUrl] = useState<
    string | undefined
  >();
  const [participantCount, setParticipantCount] = useState(0);
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
    setExperienceTitle(bundle.experience.title);
    setExperienceImageUrl(bundle.experience.imageUrl);
    setOrganizerName(bundle.experience.organizer?.name ?? "Organizador");
    setOrganizerAvatarUrl(bundle.experience.organizer?.avatarUrl);
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

  useEffect(() => {
    if (messages.length === 0) {
      setFirstUnreadMessageId(null);
      return;
    }
    const key = `lcos.unread.experience.${experienceId}.${demoMember.personId}`;
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
  }, [demoMember.personId, experienceId, messages]);

  const byId = useMemo(() => {
    const map = new Map<string, ExperienceMessageView>();
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
          onBack={() => router.push("/experiences")}
          onExit={() => router.push("/")}
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
          onExit={() => router.push("/")}
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
      replyToMessageId: replyTo?.messageId,
    });
    if (created) {
      setDraft("");
      setReplyTo(null);
      refresh();
    }
  };

  const onReaction = (messageId: string, reaction: ReactionType) => {
    toggleExperienceMessageReaction({
      experienceId,
      messageId,
      reaction,
    });
    refresh();
  };

  const reactionOptions = DEMO_CONVERSATION_REACTIONS.map((reaction) => ({
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
          {QUICK_ACTION_LABELS[message.quickActionKind]}
        </span>
      ) : undefined,
      reactionSummary: DEMO_CONVERSATION_REACTIONS.map((reaction) => ({
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
              softDeleteExperienceMessage({
                experienceId,
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

  const reason = `${participantCount} personas preparándose`;

  return (
    <MobileScreen dense className="gap-0 pb-0">
      <ConversationExperience
        onBack={() => router.push(`/experiences/${experienceId}`)}
        infoOpen={infoOpen}
        onInfoOpenChange={setInfoOpen}
        infoDescription={experienceTitle ? `${experienceTitle} · ${reason}` : reason}
        infoMembers={infoMembers}
        header={{
          name: organizerName,
          avatarUrl: organizerAvatarUrl,
          reason,
          contextTitle: experienceTitle || "Actividad",
          contextImageUrl: experienceImageUrl,
        }}
        messages={listItems}
        viewerPersonId={demoMember.personId}
        selectionMode={selectionMode}
        firstUnreadMessageId={firstUnreadMessageId}
        emptyTitle="Todavía no hay mensajes"
        emptyDescription="Coordina detalles con quien se prepara para esta experiencia."
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
