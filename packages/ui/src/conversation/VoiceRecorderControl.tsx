"use client";

import { useState } from "react";

import { cn } from "../lib/cn";

export type VoiceRecorderControlProps = {
  /** Called when user would send — foundation only, no audio blob. */
  onSendRequest?: () => void;
  onCancel?: () => void;
  disabled?: boolean;
  className?: string;
};

type LocalState = "recording" | "ready_to_send";

/**
 * Voice message recording strip — Cancel / Stop / Send.
 * Does not capture or store audio.
 */
export function VoiceRecorderControl({
  onSendRequest,
  onCancel,
  disabled = false,
  className,
}: VoiceRecorderControlProps) {
  const [state, setState] = useState<LocalState>("recording");

  if (state === "recording") {
    return (
      <div
        className={cn(
          "flex items-center gap-2 rounded-[22px] bg-[var(--color-surface-muted)] px-3 py-2",
          className,
        )}
        role="status"
        aria-live="polite"
      >
        <span
          className="h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-[var(--color-feedback-danger)]"
          aria-hidden
        />
        <span className="min-w-0 flex-1 text-[13px] font-semibold text-[var(--color-text-primary)]">
          Grabando…
        </span>
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            onCancel?.();
          }}
          className="rounded-full px-2.5 py-1.5 text-[12px] font-semibold text-[var(--color-text-secondary)]"
        >
          Cancelar
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => setState("ready_to_send")}
          className="rounded-full bg-[var(--color-action-primary-subtle)] px-2.5 py-1.5 text-[12px] font-semibold text-[var(--color-action-primary)]"
        >
          Parar
        </button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-[22px] bg-[var(--color-surface-muted)] px-3 py-2",
        className,
      )}
    >
      <span className="min-w-0 flex-1 text-[13px] font-semibold text-[var(--color-text-primary)]">
        Nota de voz lista
      </span>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onCancel?.()}
        className="rounded-full px-2.5 py-1.5 text-[12px] font-semibold text-[var(--color-text-secondary)]"
      >
        Cancelar
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onSendRequest?.()}
        className="rounded-full bg-[var(--color-action-primary)] px-3 py-1.5 text-[12px] font-semibold text-[var(--color-text-on-action)]"
      >
        Enviar
      </button>
    </div>
  );
}
