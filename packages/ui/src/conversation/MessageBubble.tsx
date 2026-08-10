"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "../lib/cn";
import { Avatar } from "../people/Avatar";
import { MessageActionMenu } from "./MessageActionMenu";
import { MediaPreview, type MediaPreviewKind } from "./MediaPreview";
import {
  ReactionPicker,
  type ReactionPickerOption,
} from "./ReactionPicker";

/** Delivery only — never invent read receipts. */
export type MessageDeliveryState = "sending" | "sent" | "delivered";

export type MessageBubbleReactor = {
  personId: string;
  displayName: string;
  reactionId: string;
};

export type MessageBubbleProps = {
  body?: string;
  mine?: boolean;
  /** Shown above first message in a group from others. */
  authorName?: string;
  /** Avatar only on first bubble after author change (incoming). */
  authorAvatarUrl?: string;
  showAvatar?: boolean;
  /** Keep column aligned when consecutive messages omit avatar. */
  reserveAvatarSpace?: boolean;
  /** Groups: start (left). Neighbour chats: end (right). */
  avatarSide?: "start" | "end";
  timeLabel?: string;
  /** Hide clock on tightly grouped middle bubbles. */
  showTime?: boolean;
  badge?: ReactNode;
  replyPreview?: string;
  replyAuthorName?: string;
  deliveryState?: MessageDeliveryState;
  reactionSummary?: ReactionPickerOption[];
  reactionOptions?: ReactionPickerOption[];
  reactors?: MessageBubbleReactor[];
  onReaction?: (id: string) => void;
  onCopy?: () => void;
  onReply?: () => void;
  onForward?: () => void;
  onSelect?: () => void;
  onDeleteOwn?: () => void;
  forwardEnabled?: boolean;
  selectEnabled?: boolean;
  deleteEnabled?: boolean;
  selected?: boolean;
  selectionMode?: boolean;
  media?: {
    kind: MediaPreviewKind;
    title: string;
    subtitle?: string;
    previewUrl?: string;
  };
  actionsDisabled?: boolean;
  className?: string;
};

const DELIVERY_LABEL: Record<MessageDeliveryState, string> = {
  sending: "Enviando…",
  sent: "Enviado",
  delivered: "Entregado",
};

/**
 * Natural messaging bubble — width follows text, not a card/pill strip.
 * Tap / long-press opens contextual actions.
 */
export function MessageBubble({
  body,
  mine = false,
  authorName,
  authorAvatarUrl,
  showAvatar = false,
  reserveAvatarSpace = false,
  avatarSide = "start",
  timeLabel,
  showTime = true,
  badge,
  replyPreview,
  replyAuthorName,
  deliveryState,
  reactionSummary,
  reactionOptions,
  reactors,
  onReaction,
  onCopy,
  onReply,
  onForward,
  onSelect,
  onDeleteOwn,
  forwardEnabled = false,
  selectEnabled = true,
  deleteEnabled = Boolean(onDeleteOwn),
  selected = false,
  selectionMode = false,
  media,
  actionsDisabled = false,
  className,
}: MessageBubbleProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [reactorsOpen, setReactorsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPress = useRef(false);

  useEffect(() => {
    if (!menuOpen && !reactorsOpen) return;
    const onDoc = (e: MouseEvent | TouchEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        setMenuOpen(false);
        setReactorsOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("touchstart", onDoc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("touchstart", onDoc);
    };
  }, [menuOpen, reactorsOpen]);

  const clearLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const openMenu = () => {
    if (actionsDisabled || selectionMode) return;
    setReactorsOpen(false);
    setMenuOpen(true);
  };

  const copyBody = () => {
    if (body && onCopy) onCopy();
    else if (body && typeof navigator !== "undefined" && navigator.clipboard) {
      void navigator.clipboard.writeText(body);
    }
    setMenuOpen(false);
  };

  const closeMenu = () => setMenuOpen(false);

  const timeNode =
    showTime && timeLabel ? (
      <span
        className={cn(
          "inline-flex shrink-0 items-center gap-0.5 whitespace-nowrap text-[10px] tabular-nums leading-none text-[var(--color-text-tertiary)]",
          body ? "ml-1.5 translate-y-[1px]" : "",
        )}
      >
        {timeLabel}
        {deliveryState && mine ? (
          <span aria-label={DELIVERY_LABEL[deliveryState]}>
            {deliveryState === "sending" ? " ·" : " ✓"}
          </span>
        ) : null}
      </span>
    ) : null;

  const avatarSlot =
    !mine && (showAvatar || reserveAvatarSpace) ? (
      <span
        className="mb-0.5 h-7 w-7 shrink-0 self-end"
        aria-hidden={!showAvatar}
      >
        {showAvatar ? (
          <Avatar
            src={authorAvatarUrl}
            alt={authorName ?? ""}
            size="xs"
            zoomable={false}
          />
        ) : null}
      </span>
    ) : null;

  return (
    <div
      ref={rootRef}
      className={cn(
        "relative flex w-full flex-col",
        mine ? "items-end" : "items-start",
        className,
      )}
    >
      {authorName && !mine ? (
        <p
          className={cn(
            "mb-0.5 truncate text-[11px] font-semibold text-[var(--color-action-primary)]",
            reserveAvatarSpace || showAvatar
              ? avatarSide === "end"
                ? "pr-9"
                : "pl-9"
              : "px-0.5",
          )}
        >
          {authorName}
        </p>
      ) : null}

      <div
        className={cn(
          "flex w-full items-end gap-1.5",
          mine ? "justify-end" : "justify-start",
        )}
      >
        {selectionMode ? (
          <button
            type="button"
            onClick={onSelect}
            className={cn(
              "mb-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px]",
              selected
                ? "border-[var(--color-action-primary)] bg-[var(--color-action-primary)] text-[var(--color-text-inverse)]"
                : "border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)]",
            )}
            aria-label={selected ? "Deseleccionar" : "Seleccionar"}
            aria-pressed={selected}
          >
            {selected ? "✓" : ""}
          </button>
        ) : null}

        {avatarSide === "start" ? avatarSlot : null}

        <div
          role="button"
          tabIndex={0}
          className={cn(
            // Full-row parent → % max is real. Bubble shrink-wraps text.
            "w-fit max-w-[78%] select-text outline-none",
            "px-2 py-[5px]",
            mine
              ? "rounded-[16px] rounded-br-[4px] bg-[var(--color-action-primary-subtle)] text-[var(--color-text-primary)]"
              : "rounded-[16px] rounded-bl-[4px] bg-[var(--color-surface-muted)] text-[var(--color-text-primary)]",
            selected && "ring-2 ring-[var(--color-action-primary)]",
          )}
          onContextMenu={(e) => {
            e.preventDefault();
            openMenu();
          }}
          onTouchStart={() => {
            didLongPress.current = false;
            clearLongPress();
            longPressTimer.current = setTimeout(() => {
              didLongPress.current = true;
              openMenu();
            }, 420);
          }}
          onTouchEnd={clearLongPress}
          onTouchMove={clearLongPress}
          onClick={() => {
            if (selectionMode) {
              onSelect?.();
              return;
            }
            if (didLongPress.current) {
              didLongPress.current = false;
              return;
            }
            openMenu();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              if (selectionMode) onSelect?.();
              else openMenu();
            }
          }}
          aria-haspopup={actionsDisabled ? undefined : "menu"}
          aria-expanded={menuOpen}
        >
          {replyPreview ? (
            <div className="mb-1 border-l-2 border-[var(--color-action-primary)] pl-1.5">
              {replyAuthorName ? (
                <p className="text-[11px] font-semibold text-[var(--color-action-primary)]">
                  {replyAuthorName}
                </p>
              ) : null}
              <p className="line-clamp-2 text-[12px] leading-4 text-[var(--color-text-secondary)]">
                {replyPreview}
              </p>
            </div>
          ) : null}
          {badge ? <div className="mb-1">{badge}</div> : null}
          {media ? (
            <div className="mb-1">
              <MediaPreview
                kind={media.kind}
                title={media.title}
                subtitle={media.subtitle}
                previewUrl={media.previewUrl}
              />
            </div>
          ) : null}
          {body ? (
            <p
              className={cn(
                "m-0 text-[15px] font-normal leading-[1.3]",
                "whitespace-pre-wrap [overflow-wrap:break-word] [word-break:normal] [hyphens:none]",
              )}
            >
              {body}
              {timeNode}
            </p>
          ) : timeNode ? (
            <div className="flex justify-end">{timeNode}</div>
          ) : null}
        </div>

        {avatarSide === "end" ? avatarSlot : null}
      </div>

      {reactionSummary && reactionSummary.some((r) => (r.count ?? 0) > 0) ? (
        <div
          className={cn(
            "relative mt-0.5",
            mine
              ? "mr-0.5"
              : showAvatar || reserveAvatarSpace
                ? avatarSide === "end"
                  ? "mr-9"
                  : "ml-9"
                : "ml-0.5",
          )}
        >
          <ReactionPicker
            variant="summary"
            options={reactionSummary}
            onSelect={() => {
              if (reactors && reactors.length > 0) {
                setMenuOpen(false);
                setReactorsOpen((o) => !o);
              }
            }}
          />
          {reactorsOpen && reactors && reactors.length > 0 ? (
            <div
              className={cn(
                "absolute z-20 mt-1 min-w-[10rem] rounded-[12px] border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] px-3 py-2 shadow-[var(--shadow-elev-2)]",
                mine ? "right-0" : "left-0",
              )}
              role="dialog"
              aria-label="Quién reaccionó"
            >
              <ul className="space-y-1.5">
                {reactors.map((r) => (
                  <li
                    key={`${r.personId}-${r.reactionId}`}
                    className="flex items-center justify-between gap-3 text-[12px]"
                  >
                    <span className="truncate font-medium text-[var(--color-text-primary)]">
                      {r.displayName}
                    </span>
                    <span aria-hidden>
                      {reactionOptions?.find((o) => o.id === r.reactionId)
                        ?.glyph ??
                        reactionSummary.find((o) => o.id === r.reactionId)
                          ?.glyph ??
                        "·"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}

      {menuOpen ? (
        <div
          className={cn(
            "absolute bottom-full z-30 mb-1.5",
            mine ? "right-0" : "left-0",
          )}
        >
          <MessageActionMenu
            align={mine ? "end" : "start"}
            reactionOptions={reactionOptions}
            onReaction={
              onReaction
                ? (id) => {
                    onReaction(id);
                    closeMenu();
                  }
                : undefined
            }
            onReply={
              onReply
                ? () => {
                    onReply();
                    closeMenu();
                  }
                : undefined
            }
            onCopy={body ? copyBody : undefined}
            onForward={
              onForward
                ? () => {
                    onForward();
                    closeMenu();
                  }
                : () => {
                    closeMenu();
                  }
            }
            onSelect={
              onSelect
                ? () => {
                    onSelect();
                    closeMenu();
                  }
                : undefined
            }
            onDeleteOwn={
              mine && onDeleteOwn
                ? () => {
                    onDeleteOwn();
                    closeMenu();
                  }
                : undefined
            }
            forwardEnabled={forwardEnabled}
            selectEnabled={selectEnabled}
            deleteEnabled={deleteEnabled && mine}
          />
        </div>
      ) : null}
    </div>
  );
}
