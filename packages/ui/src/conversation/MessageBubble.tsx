"use client";

import type { ReactNode } from "react";

import { cn } from "../lib/cn";

/** Delivery only — never invent read receipts. */
export type MessageDeliveryState = "sending" | "sent" | "delivered";

export type MessageBubbleProps = {
  body?: string;
  /** Own messages align right. */
  mine?: boolean;
  /** Formatted time label (e.g. "14:32"). */
  timeLabel?: string;
  /** Optional quick-action or system chip above body. */
  badge?: ReactNode;
  /** Quoted reply preview (placeholder support). */
  replyPreview?: string;
  deliveryState?: MessageDeliveryState;
  /** Reaction controls under the bubble. */
  reactions?: ReactNode;
  className?: string;
};

const DELIVERY_LABEL: Record<MessageDeliveryState, string> = {
  sending: "Enviando…",
  sent: "Enviado",
  delivered: "Entregado",
};

/**
 * Calm messaging bubble — familiar usability, not brand cloning.
 */
export function MessageBubble({
  body,
  mine = false,
  timeLabel,
  badge,
  replyPreview,
  deliveryState,
  reactions,
  className,
}: MessageBubbleProps) {
  return (
    <div
      className={cn(
        "flex w-full flex-col",
        mine ? "items-end" : "items-start",
        className,
      )}
    >
      <div
        className={cn(
          "max-w-[86%] rounded-[18px] px-3.5 py-2.5",
          mine
            ? "rounded-br-[6px] bg-[var(--color-action-primary)] text-[var(--color-text-inverse)]"
            : "rounded-bl-[6px] bg-[var(--color-surface-elevated)] text-[var(--color-text-primary)] shadow-[var(--shadow-elev-1)]",
        )}
      >
        {replyPreview ? (
          <p
            className={cn(
              "mb-1.5 border-l-2 pl-2 text-[12px] leading-4 opacity-90",
              mine
                ? "border-[var(--color-text-inverse)]"
                : "border-[var(--color-action-primary)] text-[var(--color-text-secondary)]",
            )}
          >
            {replyPreview}
          </p>
        ) : null}
        {badge ? <div className="mb-1.5">{badge}</div> : null}
        {body ? (
          <p className="whitespace-pre-wrap text-[15px] leading-snug">{body}</p>
        ) : null}
        {(timeLabel || deliveryState) && (
          <p
            className={cn(
              "mt-1 flex items-center justify-end gap-1.5 text-[11px]",
              mine
                ? "text-[var(--color-text-inverse)]/80"
                : "text-[var(--color-text-tertiary)]",
            )}
          >
            {timeLabel ? <span>{timeLabel}</span> : null}
            {deliveryState && mine ? (
              <span aria-label={DELIVERY_LABEL[deliveryState]}>
                {deliveryState === "sending" ? "·" : "✓"}
              </span>
            ) : null}
          </p>
        )}
      </div>
      {reactions ? <div className="mt-1 max-w-[86%]">{reactions}</div> : null}
    </div>
  );
}
