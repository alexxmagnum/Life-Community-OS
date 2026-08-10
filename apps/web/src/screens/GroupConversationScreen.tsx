"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DEMO_GROUP_CONVERSATION_REACTIONS,
  getGroupById,
  getGroupConversationBundle,
  getGroupConversationSnapshotParts,
  GROUP_QUICK_ACTION_LABELS,
  postGroupMessage,
  softDeleteGroupMessage,
  toggleGroupMessageReaction,
  type GroupMessageView,
} from "@life-community-os/tenant-life-panoramica";
import {
  createGroupConversationAdapter,
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
  canOpenGroupConversation,
  canViewGroupConversation,
} from "@/lib/group-conversation-access";
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";

function previewBody(body?: string): string {
  const t = (body ?? "").trim();
  if (!t) return "Mensaje";
  return t.length > 80 ? `${t.slice(0, 77)}…` : t;
}

/**
 * Group context → universal Conversation Experience.
 * Same UI as Marketplace / Place / Work / Experience / Official.
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
  const [groupDescription, setGroupDescription] = useState("");
  const [memberCount, setMemberCount] = useState(0);
  const [categoryLabel, setCategoryLabel] = useState("");
  const [archived, setArchived] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [replyTo, setReplyTo] = useState<MessageComposerReplyTarget | null>(
    null,
  );
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [firstUnreadMessageId, setFirstUnreadMessageId] = useState<
    string | null
  >(null);

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
    const group = getGroupById(groupId);
    if (!bundle || !group) {
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
    setGroupDescription(group.description);
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

  useEffect(() => {
    if (messages.length === 0) {
      setFirstUnreadMessageId(null);
      return;
    }
    const key = `lcos.unread.group.${groupId}.${demoMember.personId}`;
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
  }, [demoMember.personId, groupId, messages]);

  const byId = useMemo(() => {
    const map = new Map<string, GroupMessageView>();
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
          onBack={() => router.push("/community")}
          onExit={() => router.push("/community")}
        />
        <EmptyState
          title="No disponible"
          description="Los grupos no están activos en tu comunidad."
          actionLabel="Volver"
          onAction={() => router.push("/community")}
        />
      </MobileScreen>
    );
  }

  if (ready && !allowed) {
    return (
      <MobileScreen>
        <FlowScreenHeader
          title="Conversación"
          onBack={() => router.push("/community")}
          onExit={() => router.push("/community")}
        />
        <EmptyState
          title="Conversación no disponible"
          description="Esta conversación es solo para miembros del grupo."
          actionLabel="Volver a Comunidad"
          onAction={() => router.push("/community")}
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
      replyToMessageId: replyTo?.messageId,
    });
    if (created) {
      setDraft("");
      setReplyTo(null);
      refresh();
    }
  };

  const onReaction = (messageId: string, reaction: ReactionType) => {
    toggleGroupMessageReaction({
      groupId,
      messageId,
      reaction,
    });
    refresh();
  };

  const reactionOptions = DEMO_GROUP_CONVERSATION_REACTIONS.map((reaction) => ({
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
          {GROUP_QUICK_ACTION_LABELS[message.quickActionKind]}
        </span>
      ) : undefined,
      reactionSummary: DEMO_GROUP_CONVERSATION_REACTIONS.map((reaction) => ({
        id: reaction,
        glyph: REACTION_TYPE_GLYPH[reaction],
        count: message.reactionSummary?.[reaction] ?? 0,
      })),
      reactionOptions,
      onReaction: (id) => onReaction(message.id, id as ReactionType),
      onReply: archived
        ? undefined
        : () =>
            setReplyTo({
              messageId: message.id,
              authorName: message.author.displayName,
              bodyPreview: previewBody(message.body),
            }),
      onSelect: archived ? undefined : () => toggleSelect(message.id),
      onDeleteOwn:
        !archived && message.authorPersonId === demoMember.personId
          ? () => {
              softDeleteGroupMessage({
                groupId,
                messageId: message.id,
                actorPersonId: demoMember.personId,
              });
              refresh();
            }
          : undefined,
      selected: selectedIds.includes(message.id),
      deleteEnabled: message.authorPersonId === demoMember.personId,
      forwardEnabled: false,
      actionsDisabled: archived,
    };
  });

  const reason = archived
    ? "Archivado"
    : `${memberCount} miembros${categoryLabel ? ` · ${categoryLabel}` : ""}`;

  return (
    <MobileScreen dense className="gap-0 pb-0">
      <ConversationExperience
        onBack={() => router.push("/community")}
        infoOpen={infoOpen}
        onInfoOpenChange={setInfoOpen}
        infoDescription={groupDescription || reason}
        infoMembers={infoMembers}
        header={{
          name: groupName || "Grupo",
          avatarUrl: groupImageUrl,
          reason,
          contextTitle: groupName || "Grupo",
          contextImageUrl: groupImageUrl,
        }}
        messages={listItems}
        viewerPersonId={demoMember.personId}
        selectionMode={selectionMode}
        firstUnreadMessageId={firstUnreadMessageId}
        emptyTitle="Todavía no hay mensajes"
        emptyDescription="Sé el primero en escribir a los miembros de este grupo."
        footerOverride={
          archived ? (
            <p className="px-1 py-2 text-[13px] text-[var(--color-text-tertiary)]">
              Este grupo está archivado. La conversación queda en solo lectura.
            </p>
          ) : undefined
        }
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
