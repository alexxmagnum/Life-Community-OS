"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DEMO_WORK_CONVERSATION_REACTIONS,
  expressWorkInterest,
  getWorkConversationBundle,
  postWorkMessage,
  postWorkQuickAction,
  toggleWorkMessageReaction,
  WORK_QUICK_ACTION_LABELS,
  type WorkMessageView,
  type WorkPostListing,
} from "@life-community-os/tenant-life-panoramica";
import {
  createWorkConversationAdapter,
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
  canOpenWorkConversation,
  canViewWorkConversation,
} from "@/lib/work-conversation-access";
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";

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
    });
    if (created) {
      setDraft("");
      refresh();
    }
  };

  const onQuickAction = (kind: QuickActionKind) => {
    postWorkQuickAction({
      workPostId,
      authorPersonId: demoMember.personId,
      authorName: demoMember.displayName,
      authorAvatarUrl: demoMember.avatarUrl,
      kind,
    });
    refresh();
  };

  const onReaction = (messageId: string, reaction: ReactionType) => {
    toggleWorkMessageReaction({
      workPostId,
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
        {WORK_QUICK_ACTION_LABELS[message.quickActionKind]}
      </span>
    ) : undefined,
    reactions: (
      <ReactionPicker
        options={DEMO_WORK_CONVERSATION_REACTIONS.map((reaction) => ({
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
              subtitle="Sobre este servicio"
              onBack={() => router.push(`/services/work/${workPostId}`)}
              onExit={() => router.push("/services")}
            />
            <ContextHeader
              name={peerName}
              avatarUrl={peerAvatarUrl}
              reason="Conversación sobre servicio"
              context={{
                title: workPost?.title ?? "Anuncio",
                subtitle: categoryLabel || undefined,
                statusLabel: categoryLabel || undefined,
                onClick: () => router.push(`/services/work/${workPostId}`),
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
                      {WORK_QUICK_ACTION_LABELS[kind]}
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
          emptyDescription="Escribe para coordinar detalles sobre este servicio."
        />
      </ConversationShell>
    </MobileScreen>
  );
}
