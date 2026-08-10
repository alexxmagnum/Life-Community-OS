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
import { canOpenExperienceConversation } from "@/lib/experience-conversation-access";
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";

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
        {QUICK_ACTION_LABELS[message.quickActionKind]}
      </span>
    ) : undefined,
    reactions: (
      <ReactionPicker
        options={DEMO_CONVERSATION_REACTIONS.map((reaction) => ({
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
              subtitle="Sobre esta experiencia"
              onBack={() => router.push(`/experiences/${experienceId}`)}
              onExit={() => router.push("/")}
            />
            <ContextHeader
              name={organizerName}
              avatarUrl={organizerAvatarUrl}
              reason="Conversación sobre experiencia"
              context={{
                title: experienceTitle || "Actividad",
                subtitle: `${participantCount} personas preparándose`,
                imageUrl: experienceImageUrl,
                statusLabel: "Experiencia",
                onClick: () => router.push(`/experiences/${experienceId}`),
              }}
            />
          </>
        }
        footer={
          <MessageComposer
            value={draft}
            onChange={setDraft}
            onSend={sendDraft}
            placeholder="Escribe a tus vecinos…"
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
                      {QUICK_ACTION_LABELS[kind]}
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
          emptyDescription="Coordina detalles con quien se prepara para esta experiencia."
        />
      </ConversationShell>
    </MobileScreen>
  );
}
