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
  Avatar,
  EmptyState,
  FlowScreenHeader,
  MobileScreen,
} from "@life-community-os/ui";
import {
  canOpenGroupConversation,
  canViewGroupConversation,
} from "@/lib/group-conversation-access";
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";

/**
 * Contextual Group Conversation — long-lived, membership-scoped.
 * Not a global chat inbox.
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
  const [title, setTitle] = useState("Conversación del grupo");
  const [groupName, setGroupName] = useState("");
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
    setTitle(bundle.conversation.title ?? bundle.group.name);
    setGroupName(bundle.group.name);
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
          onExit={() => router.push("/community")}
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
          onExit={() => router.push("/community")}
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

  return (
    <MobileScreen>
      <FlowScreenHeader
        title={title}
        subtitle={groupName || "Grupo"}
        onBack={() => router.push(`/community/groups/${groupId}`)}
        onExit={() => router.push("/community")}
      />

      <header className="space-y-2 border-b border-[var(--color-border-subtle)] pb-4">
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {categoryLabel ? (
            <span className="rounded-full bg-[var(--color-action-primary-subtle)] px-2.5 py-1 text-[14px] font-semibold text-[var(--color-action-primary)]">
              {categoryLabel}
            </span>
          ) : null}
          <span className="text-[15px] text-[var(--color-text-tertiary)]">
            {memberCount} miembros
          </span>
          {archived ? (
            <span className="rounded-full bg-[var(--color-surface-elevated)] px-2.5 py-1 text-[14px] font-semibold text-[var(--color-text-secondary)]">
              Archivado
            </span>
          ) : null}
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
                      {GROUP_QUICK_ACTION_LABELS[message.quickActionKind]}
                    </span>
                  ) : null}
                </div>
                {message.body ? (
                  <p className="mt-1 text-[15px] leading-snug text-[var(--color-text-secondary)]">
                    {message.body}
                  </p>
                ) : null}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {DEMO_GROUP_CONVERSATION_REACTIONS.map((reaction) => {
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

      {!archived ? (
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
                {GROUP_QUICK_ACTION_LABELS[kind]}
              </button>
            ))}
          </div>

          <label className="block space-y-1.5">
            <span className="sr-only">Escribe un mensaje</span>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={2}
              placeholder="Escribe al grupo…"
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
        <p className="mt-6 text-[14px] text-[var(--color-text-tertiary)]">
          Este grupo está archivado. La conversación queda en solo lectura.
        </p>
      )}
    </MobileScreen>
  );
}
