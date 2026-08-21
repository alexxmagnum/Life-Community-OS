"use client";

import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type TextareaHTMLAttributes,
} from "react";

import { cn } from "../lib/cn";
import { AttachmentSheet } from "./AttachmentSheet";
import { EmojiPicker } from "./EmojiPicker";
import { VoiceRecorderControl } from "./VoiceRecorderControl";

export type MessageComposerReplyTarget = {
  messageId: string;
  authorName: string;
  bodyPreview: string;
};

export type MessageComposerProps = {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  placeholder?: string;
  disabled?: boolean;
  maxLength?: number;
  quickActions?: ReactNode;
  replyTo?: MessageComposerReplyTarget | null;
  onCancelReply?: () => void;
  attachmentsEnabled?: boolean;
  onAttachSelect?: (kind: string) => void;
  hasPendingMedia?: boolean;
  voiceEnabled?: boolean;
  onVoiceSendRequest?: () => void;
  onEmojiSelect?: (emoji: string) => void;
  /** @deprecated Full catalog is used by EmojiPicker. */
  emojis?: readonly string[];
  className?: string;
};

/**
 * Stable mobile messenger composer.
 * + · text · emoji · (mic when empty | send when typing)
 * Voice recording never replaces the composer chrome — it stacks above.
 */
export function MessageComposer({
  value,
  onChange,
  onSend,
  placeholder = "Escribe un mensaje…",
  disabled = false,
  maxLength = 2000,
  quickActions,
  replyTo,
  onCancelReply,
  attachmentsEnabled = true,
  onAttachSelect,
  hasPendingMedia = false,
  voiceEnabled = true,
  onVoiceSendRequest,
  onEmojiSelect,
  className,
}: MessageComposerProps) {
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const trimmed = value.trim();
  const canSend = (Boolean(trimmed) || hasPendingMedia) && !disabled;
  const showMic = voiceEnabled && !trimmed && !hasPendingMedia;

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(Math.max(el.scrollHeight, 36), 112)}px`;
  }, [value]);

  useEffect(() => {
    if (replyTo) textareaRef.current?.focus();
  }, [replyTo?.messageId]);

  const insertEmoji = (emoji: string) => {
    if (disabled) return;
    onChange(`${value}${emoji}`.slice(0, maxLength));
    onEmojiSelect?.(emoji);
    textareaRef.current?.focus();
  };

  const onKeyDown: TextareaHTMLAttributes<HTMLTextAreaElement>["onKeyDown"] = (
    e,
  ) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (canSend) {
        onSend();
        setEmojiOpen(false);
        setAttachOpen(false);
      }
    }
  };

  return (
    <div className={cn("space-y-1.5", className)}>
      {quickActions}

      {replyTo ? (
        <div className="flex items-start gap-2 rounded-[10px] border-l-[3px] border-[var(--color-action-primary)] bg-[var(--color-surface-muted)] px-2.5 py-1.5">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold text-[var(--color-action-primary)]">
              Respondiendo a {replyTo.authorName}
            </p>
            <p className="mt-0.5 truncate text-[12px] text-[var(--color-text-secondary)]">
              {replyTo.bodyPreview}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancelReply}
            className="shrink-0 px-1 text-[14px] font-semibold text-[var(--color-text-tertiary)]"
            aria-label="Cancelar respuesta"
          >
            ×
          </button>
        </div>
      ) : null}

      {attachOpen ? (
        <AttachmentSheet
          onSelect={(id) => {
            onAttachSelect?.(id);
            setAttachOpen(false);
          }}
          onClose={() => setAttachOpen(false)}
        />
      ) : null}

      {emojiOpen ? (
        <EmojiPicker
          onSelect={insertEmoji}
          onClose={() => setEmojiOpen(false)}
        />
      ) : null}

      {voiceMode ? (
        <VoiceRecorderControl
          disabled={disabled}
          onCancel={() => setVoiceMode(false)}
          onSendRequest={() => {
            onVoiceSendRequest?.();
            setVoiceMode(false);
          }}
        />
      ) : null}

      {/* Composer row always present — never swaps into an unknown state. */}
      <div className="flex items-end gap-1">
        <button
          type="button"
          disabled={disabled || !attachmentsEnabled}
          onClick={() => {
            setEmojiOpen(false);
            setVoiceMode(false);
            setAttachOpen((o) => !o);
          }}
          className={cn(
            "mb-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-full disabled:opacity-30",
            "bg-[var(--color-action-primary-subtle)] text-[var(--color-action-primary)]",
            "shadow-[0_6px_14px_-6px_rgba(20,80,60,0.35)]",
            "transition-transform active:scale-95",
            attachOpen &&
              "ring-2 ring-[var(--color-action-primary)] ring-offset-2",
          )}
          aria-label="Adjuntar"
          aria-expanded={attachOpen}
        >
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
          >
            <path
              d="M14.5 6.5 8.2 12.9a3.2 3.2 0 0 0 4.5 4.5l7.1-7.2a4.6 4.6 0 0 0-6.5-6.5L6 11a6 6 0 0 0 8.5 8.5l.9-.9"
              stroke="currentColor"
              strokeWidth="2.15"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <div className="flex min-w-0 flex-1 items-end rounded-[22px] bg-[var(--color-surface-muted)] px-3 py-0.5">
          <label className="min-w-0 flex-1">
            <span className="sr-only">{placeholder}</span>
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              disabled={disabled}
              rows={1}
              placeholder={placeholder}
              maxLength={maxLength}
              className="max-h-28 min-h-[36px] w-full resize-none bg-transparent py-2 text-[15px] leading-5 text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-tertiary)] disabled:opacity-50"
              onKeyDown={onKeyDown}
              onFocus={() => {
                setAttachOpen(false);
              }}
            />
          </label>
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              setAttachOpen(false);
              setVoiceMode(false);
              setEmojiOpen((o) => !o);
            }}
            className={cn(
              "mb-1 ml-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[22px] leading-none disabled:opacity-40",
              emojiOpen && "bg-[var(--color-action-primary-subtle)]",
            )}
            aria-label="Emoji"
            aria-expanded={emojiOpen}
          >
            <span aria-hidden className="translate-y-[0.5px]">
              😊
            </span>
          </button>
        </div>

        {showMic ? (
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              setAttachOpen(false);
              setEmojiOpen(false);
              setVoiceMode(true);
            }}
            className={cn(
              "mb-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-full disabled:opacity-30",
              "bg-gradient-to-br from-[var(--color-action-primary)] to-[color-mix(in_srgb,var(--color-action-primary)_72%,#0a2e24)]",
              "text-white",
              "shadow-[0_8px_18px_-6px_rgba(20,80,60,0.55)]",
              "transition-transform active:scale-95",
              voiceMode && "ring-2 ring-[var(--color-action-primary)] ring-offset-2",
            )}
            aria-label="Nota de voz"
            aria-pressed={voiceMode}
          >
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden
            >
              <rect
                x="8.2"
                y="2.4"
                width="7.6"
                height="11.2"
                rx="3.8"
                fill="currentColor"
              />
              <path
                d="M5.5 11.2a6.5 6.5 0 0 0 13 0"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M12 17.7v3.1M9.2 20.8h5.6"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        ) : (
          <button
            type="button"
            disabled={!canSend}
            onClick={() => {
              onSend();
              setEmojiOpen(false);
              setAttachOpen(false);
            }}
            className="mb-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-action-primary)] to-[color-mix(in_srgb,var(--color-action-primary)_72%,#0a2e24)] text-white shadow-[0_8px_18px_-6px_rgba(20,80,60,0.55)] transition-transform active:scale-95 disabled:opacity-30"
            aria-label="Enviar"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden
            >
              <path
                d="M3.2 11.05 19.7 3.85a.95.95 0 0 1 1.3 1.15L17.4 19.9a.95.95 0 0 1-1.52.52l-4.7-3.55-2.45 2.8a.75.75 0 0 1-1.32-.42v-4.2L3.15 12.4a.95.95 0 0 1 .05-1.35Z"
                fill="currentColor"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
