"use client";

import { cn } from "../lib/cn";
import {
  ReactionPicker,
  type ReactionPickerOption,
} from "./ReactionPicker";

export type MessageActionMenuProps = {
  reactionOptions?: ReactionPickerOption[];
  onReaction?: (id: string) => void;
  onReply?: () => void;
  onCopy?: () => void;
  onForward?: () => void;
  onSelect?: () => void;
  onDeleteOwn?: () => void;
  /** When true, show foundation-disabled forward. */
  forwardEnabled?: boolean;
  selectEnabled?: boolean;
  deleteEnabled?: boolean;
  align?: "start" | "end";
  className?: string;
};

/**
 * Contextual message actions — long-press surface.
 */
export function MessageActionMenu({
  reactionOptions,
  onReaction,
  onReply,
  onCopy,
  onForward,
  onSelect,
  onDeleteOwn,
  forwardEnabled = false,
  selectEnabled = true,
  deleteEnabled = true,
  align = "start",
  className,
}: MessageActionMenuProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1.5",
        align === "end" ? "items-end" : "items-start",
        className,
      )}
      role="menu"
    >
      {reactionOptions && reactionOptions.length > 0 && onReaction ? (
        <ReactionPicker
          variant="bar"
          options={reactionOptions}
          onSelect={onReaction}
        />
      ) : null}
      <div className="min-w-[11rem] overflow-hidden rounded-[14px] border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] shadow-[var(--shadow-elev-2)]">
        {onReply ? (
          <button
            type="button"
            role="menuitem"
            className="block w-full px-4 py-2.5 text-left text-[14px] font-medium text-[var(--color-text-primary)]"
            onClick={onReply}
          >
            Responder
          </button>
        ) : null}
        {onCopy ? (
          <button
            type="button"
            role="menuitem"
            className="block w-full px-4 py-2.5 text-left text-[14px] font-medium text-[var(--color-text-primary)]"
            onClick={onCopy}
          >
            Copiar
          </button>
        ) : null}
        {onForward ? (
          <button
            type="button"
            role="menuitem"
            disabled={!forwardEnabled}
            className="block w-full px-4 py-2.5 text-left text-[14px] font-medium text-[var(--color-text-primary)] disabled:opacity-40"
            onClick={onForward}
          >
            Reenviar{forwardEnabled ? "" : " (próx.)"}
          </button>
        ) : null}
        {onSelect && selectEnabled ? (
          <button
            type="button"
            role="menuitem"
            className="block w-full px-4 py-2.5 text-left text-[14px] font-medium text-[var(--color-text-primary)]"
            onClick={onSelect}
          >
            Seleccionar
          </button>
        ) : null}
        {onDeleteOwn && deleteEnabled ? (
          <button
            type="button"
            role="menuitem"
            className="block w-full px-4 py-2.5 text-left text-[14px] font-medium text-[var(--color-feedback-danger)]"
            onClick={onDeleteOwn}
          >
            Eliminar
          </button>
        ) : null}
      </div>
    </div>
  );
}
