"use client";

import type { ReactNode } from "react";

import { Avatar } from "../people/Avatar";
import { EmptyState } from "../states/States";
import { cn } from "../lib/cn";
import {
  MessageBubble,
  type MessageDeliveryState,
} from "./MessageBubble";

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
  deliveryState?: MessageDeliveryState;
  reactions?: ReactNode;
};

export type MessageListProps = {
  messages: MessageListItem[];
  viewerPersonId: string;
  emptyTitle?: string;
  emptyDescription?: string;
  /** Group consecutive same-author messages within this window (ms). */
  groupWindowMs?: number;
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
    weekday: "long",
    day: "numeric",
    month: "short",
  }).format(new Date(iso));
}

function timeLabel(iso: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

/**
 * Message scroller with date separators and consecutive grouping.
 */
export function MessageList({
  messages,
  viewerPersonId,
  emptyTitle = "Todavía no hay mensajes",
  emptyDescription = "Escribe el primero para empezar la conversación.",
  groupWindowMs = 3 * 60 * 1000,
  className,
}: MessageListProps) {
  if (messages.length === 0) {
    return (
      <EmptyState title={emptyTitle} description={emptyDescription} />
    );
  }

  const rows: ReactNode[] = [];
  let lastDay: number | null = null;
  let lastAuthor: string | null = null;
  let lastTs = 0;

  messages.forEach((message) => {
    const day = startOfLocalDay(message.createdAt);
    if (lastDay !== day) {
      rows.push(
        <li
          key={`day-${message.createdAt}-${message.id}`}
          className="flex justify-center py-2"
        >
          <span className="rounded-full bg-[var(--color-surface-muted)] px-3 py-1 text-[12px] font-semibold capitalize text-[var(--color-text-tertiary)]">
            {dateSeparatorLabel(message.createdAt)}
          </span>
        </li>,
      );
      lastDay = day;
      lastAuthor = null;
    }

    const mine = message.authorPersonId === viewerPersonId;
    const ts = new Date(message.createdAt).getTime();
    const grouped =
      lastAuthor === message.authorPersonId &&
      ts - lastTs <= groupWindowMs;
    lastAuthor = message.authorPersonId;
    lastTs = ts;

    rows.push(
      <li
        key={message.id}
        className={cn(
          "flex gap-2",
          mine ? "justify-end" : "justify-start",
          grouped ? "mt-1" : "mt-3",
        )}
      >
        {!mine && !grouped ? (
          <Avatar
            src={message.author.avatarUrl}
            alt={message.author.displayName}
            size="sm"
            className="mt-1"
            zoomable={false}
          />
        ) : !mine ? (
          <span className="w-8 shrink-0" aria-hidden />
        ) : null}
        <div className={cn("min-w-0", mine ? "items-end" : "items-start")}>
          {!mine && !grouped ? (
            <p className="mb-1 px-1 text-[12px] font-semibold text-[var(--color-text-secondary)]">
              {message.author.displayName}
            </p>
          ) : null}
          <MessageBubble
            body={message.body}
            mine={mine}
            timeLabel={timeLabel(message.createdAt)}
            badge={message.badge}
            replyPreview={message.replyPreview}
            deliveryState={message.deliveryState}
            reactions={message.reactions}
          />
        </div>
      </li>,
    );
  });

  return (
    <ul className={cn("space-y-0 px-0.5", className)} aria-live="polite">
      {rows}
    </ul>
  );
}
