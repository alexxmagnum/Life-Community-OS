"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { cn } from "../lib/cn";
import {
  MessageBubble,
  type MessageBubbleReactor,
  type MessageDeliveryState,
} from "./MessageBubble";
import type { MediaPreviewKind } from "./MediaPreview";
import type { ReactionPickerOption } from "./ReactionPicker";

export type MessageListAuthor = {
  personId: string;
  displayName: string;
  avatarUrl?: string;
};

export type MessageListItem = {
  id: string;
  authorPersonId: string;
  author: MessageListAuthor;
  body?: string;
  createdAt: string;
  badge?: ReactNode;
  replyPreview?: string;
  replyAuthorName?: string;
  deliveryState?: MessageDeliveryState;
  /** @deprecated Prefer reactionSummary + reactionOptions. */
  reactions?: ReactNode;
  reactionSummary?: ReactionPickerOption[];
  reactionOptions?: ReactionPickerOption[];
  reactors?: MessageBubbleReactor[];
  onReaction?: (reactionId: string) => void;
  onCopy?: () => void;
  onReply?: () => void;
  onForward?: () => void;
  onSelect?: () => void;
  onDeleteOwn?: () => void;
  forwardEnabled?: boolean;
  selectEnabled?: boolean;
  deleteEnabled?: boolean;
  selected?: boolean;
  media?: {
    kind: MediaPreviewKind;
    title: string;
    subtitle?: string;
    previewUrl?: string;
  };
  actionsDisabled?: boolean;
};

export type MessageListProps = {
  messages: MessageListItem[];
  viewerPersonId: string;
  emptyTitle?: string;
  emptyDescription?: string;
  /** Group consecutive same-author messages within this window (ms). */
  groupWindowMs?: number;
  /** Avatars next to bubbles — first of each sender group only. */
  showAvatars?: boolean;
  /** Groups keep avatars on the start (left). Neighbour chats use end (right). */
  avatarSide?: "start" | "end";
  /** Insert unread separator before this message id. */
  firstUnreadMessageId?: string | null;
  unreadLabel?: string;
  selectionMode?: boolean;
  className?: string;
};

function startOfLocalDay(iso: string): number {
  const d = new Date(iso);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function dateSeparatorLabel(iso: string, now = new Date()): string {
  const day = startOfLocalDay(iso);
  const today = startOfLocalDay(now.toISOString());
  const yesterday = today - 86_400_000;
  if (day === today) return "Hoy";
  if (day === yesterday) return "Ayer";
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

function timeLabel(iso: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

/**
 * Conversation rhythm: day lines, sender grouping, unread separator.
 * On enter → always last message. Never restore a stale mid-thread scroll.
 */
export function MessageList({
  messages,
  viewerPersonId,
  emptyTitle = "Todavía no hay mensajes",
  emptyDescription = "Escribe el primero para empezar la conversación.",
  groupWindowMs = 2 * 60 * 1000,
  showAvatars = true,
  avatarSide = "start",
  firstUnreadMessageId = null,
  unreadLabel = "Mensajes no leídos",
  selectionMode = false,
  className,
}: MessageListProps) {
  const listRef = useRef<HTMLUListElement>(null);
  const endRef = useRef<HTMLLIElement>(null);
  const stickToBottom = useRef(true);
  const initialScrollDone = useRef(false);
  const conversationFingerprint = `${viewerPersonId}:${messages[0]?.id ?? "empty"}:${messages.length}`;

  useEffect(() => {
    // New conversation mount / thread change → force latest.
    initialScrollDone.current = false;
    stickToBottom.current = true;
  }, [conversationFingerprint]);

  useEffect(() => {
    const el = listRef.current?.parentElement;
    if (!el) return;
    const onScroll = () => {
      const remaining = el.scrollHeight - el.scrollTop - el.clientHeight;
      stickToBottom.current = remaining < 80;
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const el = listRef.current?.parentElement;
    if (!el || messages.length === 0) return;

    const jumpToLatest = () => {
      el.scrollTop = el.scrollHeight;
      endRef.current?.scrollIntoView({ block: "end" });
    };

    if (!initialScrollDone.current) {
      jumpToLatest();
      // Second frame — layout may settle after images/fonts.
      requestAnimationFrame(jumpToLatest);
      initialScrollDone.current = true;
      return;
    }

    if (stickToBottom.current) {
      jumpToLatest();
    }
  }, [messages.length, messages[messages.length - 1]?.id, conversationFingerprint]);

  if (messages.length === 0) {
    return (
      <div className="flex h-full min-h-[10rem] flex-col items-center justify-center px-6 text-center">
        <p className="text-[15px] font-semibold text-[var(--color-text-primary)]">
          {emptyTitle}
        </p>
        <p className="mt-1 max-w-xs text-[13px] leading-5 text-[var(--color-text-secondary)]">
          {emptyDescription}
        </p>
      </div>
    );
  }

  const rows: ReactNode[] = [];
  let lastDay: number | null = null;
  let lastAuthor: string | null = null;
  let lastTs = 0;

  messages.forEach((message, index) => {
    const day = startOfLocalDay(message.createdAt);
    if (lastDay !== day) {
      rows.push(
        <li
          key={`day-${message.createdAt}-${message.id}`}
          className="flex justify-center py-3"
        >
          <span className="text-[11px] font-medium tracking-wide text-[var(--color-text-tertiary)]">
            {dateSeparatorLabel(message.createdAt)}
          </span>
        </li>,
      );
      lastDay = day;
      lastAuthor = null;
    }

    if (firstUnreadMessageId && message.id === firstUnreadMessageId) {
      rows.push(
        <li
          key={`unread-${message.id}`}
          className="flex items-center gap-3 py-2"
          role="separator"
          aria-label={unreadLabel}
        >
          <span className="h-px flex-1 bg-[var(--color-border-subtle)]" />
          <span className="text-[11px] font-semibold tracking-wide text-[var(--color-action-primary)]">
            {unreadLabel}
          </span>
          <span className="h-px flex-1 bg-[var(--color-border-subtle)]" />
        </li>,
      );
    }

    const mine = message.authorPersonId === viewerPersonId;
    const ts = new Date(message.createdAt).getTime();
    const grouped =
      lastAuthor === message.authorPersonId && ts - lastTs <= groupWindowMs;

    const next = messages[index + 1];
    const nextTs = next ? new Date(next.createdAt).getTime() : 0;
    const nextGrouped =
      Boolean(next) &&
      next!.authorPersonId === message.authorPersonId &&
      nextTs - ts <= groupWindowMs;
    const showTime = !nextGrouped;

    lastAuthor = message.authorPersonId;
    lastTs = ts;

    rows.push(
      <li
        key={message.id}
        className={cn(
          "flex",
          mine ? "justify-end" : "justify-start",
          grouped ? "mt-[2px]" : "mt-2.5",
        )}
      >
        <MessageBubble
          body={message.body}
          mine={mine}
          authorName={!mine && !grouped ? message.author.displayName : undefined}
          authorAvatarUrl={
            !mine && showAvatars && !grouped
              ? message.author.avatarUrl
              : undefined
          }
          showAvatar={!mine && showAvatars && !grouped}
          reserveAvatarSpace={!mine && showAvatars && grouped}
          avatarSide={avatarSide}
          timeLabel={timeLabel(message.createdAt)}
          showTime={showTime}
          badge={message.badge}
          replyPreview={message.replyPreview}
          replyAuthorName={message.replyAuthorName}
          deliveryState={message.deliveryState}
          reactionSummary={message.reactionSummary}
          reactionOptions={message.reactionOptions}
          reactors={message.reactors}
          onReaction={message.onReaction}
          onCopy={message.onCopy}
          onReply={message.onReply}
          onForward={message.onForward}
          onSelect={message.onSelect}
          onDeleteOwn={message.onDeleteOwn}
          forwardEnabled={message.forwardEnabled}
          selectEnabled={message.selectEnabled}
          deleteEnabled={message.deleteEnabled}
          selected={message.selected}
          selectionMode={selectionMode}
          media={message.media}
          actionsDisabled={message.actionsDisabled}
        />
        {message.reactions && !message.reactionSummary ? (
          <div className="mt-0.5">{message.reactions}</div>
        ) : null}
      </li>,
    );
  });

  rows.push(<li key="scroll-end" ref={endRef} className="h-px" aria-hidden />);

  return (
    <ul
      ref={listRef}
      className={cn("flex flex-col", className)}
      aria-live="polite"
      data-show-avatars={showAvatars ? "true" : "false"}
    >
      {rows}
    </ul>
  );
}
