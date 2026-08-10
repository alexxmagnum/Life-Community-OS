"use client";

import { useState, type ReactNode } from "react";

import { cn } from "../lib/cn";
import { EmojiPicker, DEFAULT_COMPOSER_EMOJIS } from "./EmojiPicker";

export type MessageComposerProps = {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  placeholder?: string;
  disabled?: boolean;
  maxLength?: number;
  /** Contextual quick-action chips above the field. */
  quickActions?: ReactNode;
  /** Prepared attachment entry — no real upload in 2.5. */
  onAttachPress?: () => void;
  /** Called when user picks an emoji from the tray. */
  onEmojiSelect?: (emoji: string) => void;
  emojis?: readonly string[];
  className?: string;
};

/**
 * Calm composer: emoji · attach · text · send.
 * Voice and real file delivery are intentionally not implemented.
 */
export function MessageComposer({
  value,
  onChange,
  onSend,
  placeholder = "Escribe un mensaje…",
  disabled = false,
  maxLength = 500,
  quickActions,
  onAttachPress,
  onEmojiSelect,
  emojis = DEFAULT_COMPOSER_EMOJIS,
  className,
}: MessageComposerProps) {
  const [emojiOpen, setEmojiOpen] = useState(false);
  const canSend = Boolean(value.trim()) && !disabled;

  const insertEmoji = (emoji: string) => {
    if (disabled) return;
    const next = `${value}${emoji}`.slice(0, maxLength);
    onChange(next);
    onEmojiSelect?.(emoji);
  };

  return (
    <div className={cn("space-y-2.5", className)}>
      {quickActions}

      {emojiOpen ? (
        <EmojiPicker
          emojis={emojis}
          onSelect={insertEmoji}
          onClose={() => setEmojiOpen(false)}
        />
      ) : null}

      <div className="flex items-end gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setEmojiOpen((o) => !o)}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-elevated)] text-[18px] shadow-[var(--shadow-elev-1)] disabled:opacity-40"
          aria-label="Emoji"
          aria-expanded={emojiOpen}
        >
          😊
        </button>
        <button
          type="button"
          disabled={disabled || !onAttachPress}
          onClick={onAttachPress}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-elevated)] text-[18px] font-semibold text-[var(--color-text-secondary)] shadow-[var(--shadow-elev-1)] disabled:opacity-40"
          aria-label="Adjuntar (próximamente)"
          title={onAttachPress ? "Adjuntar" : "Adjuntos próximamente"}
        >
          +
        </button>
        <label className="min-w-0 flex-1">
          <span className="sr-only">{placeholder}</span>
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            rows={1}
            placeholder={placeholder}
            maxLength={maxLength}
            className="max-h-28 min-h-[44px] w-full resize-none rounded-[22px] border border-[var(--color-border-subtle)] bg-white px-3.5 py-2.5 text-[15px] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-action-primary)] focus:ring-2 focus:ring-[var(--color-action-primary-subtle)] disabled:opacity-50"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (canSend) onSend();
              }
            }}
          />
        </label>
        <button
          type="button"
          disabled={!canSend}
          onClick={onSend}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-action-primary)] text-[16px] font-semibold text-[var(--color-text-inverse)] disabled:opacity-40"
          aria-label="Enviar"
        >
          ➤
        </button>
      </div>
    </div>
  );
}
