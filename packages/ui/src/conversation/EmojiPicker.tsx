"use client";

import { cn } from "../lib/cn";

export const DEFAULT_COMPOSER_EMOJIS = [
  "😀",
  "🙂",
  "😊",
  "❤️",
  "👍",
  "🙏",
  "👏",
  "😂",
  "🎉",
  "👋",
] as const;

export type EmojiPickerProps = {
  emojis?: readonly string[];
  onSelect: (emoji: string) => void;
  onClose?: () => void;
  className?: string;
};

/** Lightweight emoji tray for the composer — not a sticker pack. */
export function EmojiPicker({
  emojis = DEFAULT_COMPOSER_EMOJIS,
  onSelect,
  onClose,
  className,
}: EmojiPickerProps) {
  return (
    <div
      className={cn(
        "rounded-[14px] bg-[var(--color-surface-elevated)] p-2 shadow-[var(--shadow-elev-1)]",
        className,
      )}
      role="listbox"
      aria-label="Emojis"
    >
      <div className="flex flex-wrap gap-1">
        {emojis.map((emoji) => (
          <button
            key={emoji}
            type="button"
            role="option"
            onClick={() => onSelect(emoji)}
            className="flex h-10 w-10 items-center justify-center rounded-[10px] text-[20px] transition-colors hover:bg-[var(--color-surface-muted)] active:scale-95"
            aria-label={emoji}
          >
            {emoji}
          </button>
        ))}
      </div>
      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          className="mt-1 w-full py-1.5 text-[12px] font-semibold text-[var(--color-text-tertiary)]"
        >
          Cerrar
        </button>
      ) : null}
    </div>
  );
}
