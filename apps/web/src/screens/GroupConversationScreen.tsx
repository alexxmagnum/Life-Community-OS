"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DEMO_GROUP_CONVERSATION_REACTIONS,
  getGroupConversationBundle,
  getGroupConversationSnapshotParts,
  GROUP_QUICK_ACTION_LABELS,
  postGroupMessage,
  postGroupQuickAction,
  toggleGroupMessageReaction,
  type GroupMessageView,
} from "@life-community-os/tenant-life-panoramica";
import {
  createGroupConversationAdapter,
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
  canOpenGroupConversation,
  canViewGroupConversation,
} from "@/lib/group-conversation-access";
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";

/**
 * Membership-scoped Group Conversation — Shared Product shell (Phase 2.6).
 *
 * Classification (A): private group conversation for members.
 * Not a WhatsApp clone. Not public plaza posts. Membership ≠ messages.
 */
export function GroupConversationScreen({ groupId }: { groupId: string }) {
  const router = useRouter();
  const {
    configuration,
    isFeatureEnabled,
    isModuleEnabled,
    hasCapability,
    demoMember,
  } = useTenant();
  const [messages, setMessages] = useState<GroupMessageView[]>([]);
  const [draft, setDraft] = useState("");
  const [ready, setReady] = useState(false);
  const [allowed, setAllowed] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupImageUrl, setGroupImageUrl] = useState<string | undefined>();
  const [memberCount, setMemberCount] = useState(0);
  const [categoryLabel, setCategoryLabel] = useState("");
  const [archived, setArchived] = useState(false);

  const moduleOn =
    isModuleEnabled("community.groups") && isFeatureEnabled("groups");

  const refresh = useCallback(() => {
    if (!moduleOn || !hasCapability(CAPABILITIES.contentView)) {
      setAllowed(false);
      setMessages([]);
      setReady(true);
      return;
    }

    const bundle = getGroupConversationBundle(groupId);
    if (!bundle) {
      setAllowed(false);
      setMessages([]);
      setReady(true);
      return;
    }

    const open = canOpenGroupConversation({
      group: bundle.group,
      configuration,
      isModuleEnabled,
      hasCapability,
    });
    const view = canViewGroupConversation({
      group: bundle.group,
      personId: demoMember.personId,
      configuration,
      isModuleEnabled,
      hasCapability,
    });
    setAllowed(open && view);
    setMessages(bundle.messages);
    setGroupName(bundle.group.name);
    setGroupImageUrl(bundle.group.imageUrl);
    setMemberCount(bundle.group.memberCount);
    setCategoryLabel(bundle.group.categoryLabel);
    setArchived(
      bundle.group.status === "archived" ||
        bundle.conversation.status === "archived",
    );

    const snapshot = getGroupConversationSnapshotParts(groupId);
    if (snapshot) {
      const adapter = createGroupConversationAdapter();
      adapter.listParticipants(bundle.conversation.context, snapshot);
    }
    setReady(true);
  }, [
    configuration,
    demoMember.personId,
    groupId,
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
          onBack={() => router.push("/community")}
          onExit={() => router.push("/")}
        />
        <EmptyState
          title="No disponible"
          description="Los grupos no están activos en tu comunidad."
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
          onBack={() => router.push(`/community/groups/${groupId}`)}
          onExit={() => router.push("/")}
        />
        <EmptyState
          title="Conversación no disponible"
          description="Esta conversación es para miembros del grupo, o el grupo ya no admite mensajes."
          actionLabel="Volver al grupo"
          onAction={() => router.push(`/community/groups/${groupId}`)}
        />
      </MobileScreen>
    );
  }

  const sendDraft = () => {
    const created = postGroupMessage({
      groupId,
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
    postGroupQuickAction({
      groupId,
      authorPersonId: demoMember.personId,
      authorName: demoMember.displayName,
      authorAvatarUrl: demoMember.avatarUrl,
      kind,
    });
    refresh();
  };

  const onReaction = (messageId: string, reaction: ReactionType) => {
    toggleGroupMessageReaction({
      groupId,
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
        {GROUP_QUICK_ACTION_LABELS[message.quickActionKind]}
      </span>
    ) : undefined,
    reactions: (
      <ReactionPicker
        options={DEMO_GROUP_CONVERSATION_REACTIONS.map((reaction) => ({
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
              subtitle="Grupo de miembros"
              onBack={() => router.push(`/community/groups/${groupId}`)}
              onExit={() => router.push("/")}
            />
            <ContextHeader
              name={groupName || "Grupo"}
              avatarUrl={groupImageUrl}
              reason="Conversación del grupo"
              context={{
                title: groupName || "Grupo",
                subtitle: `${memberCount} miembros`,
                imageUrl: groupImageUrl,
                statusLabel: archived
                  ? "Archivado"
                  : categoryLabel || undefined,
                onClick: () => router.push(`/community/groups/${groupId}`),
              }}
            />
          </>
        }
        footer={
          archived ? (
            <p className="px-1 text-[14px] text-[var(--color-text-tertiary)]">
              Este grupo está archivado. La conversación queda en solo lectura.
            </p>
          ) : (
            <MessageComposer
              value={draft}
              onChange={setDraft}
              onSend={sendDraft}
              placeholder="Escribe al grupo…"
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
                        {GROUP_QUICK_ACTION_LABELS[kind]}
                      </button>
                    ))}
                  </div>
                </div>
              }
            />
          )
        }
      >
        <MessageList
          messages={listItems}
          viewerPersonId={demoMember.personId}
          emptyTitle="Todavía no hay mensajes"
          emptyDescription="Sé el primero en escribir a los miembros de este grupo."
        />
      </ConversationShell>
    </MobileScreen>
  );
}
