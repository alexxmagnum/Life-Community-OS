"use client";

import type { ReactNode } from "react";

import { Avatar } from "../people/Avatar";
import { cn } from "../lib/cn";

export type ConversationInfoMember = {
  id: string;
  name: string;
  avatarUrl?: string;
  roleLabel?: string;
};

export type ConversationInfoSheetProps = {
  open: boolean;
  onClose: () => void;
  name: string;
  avatarUrl?: string;
  description?: string;
  members?: ConversationInfoMember[];
  /** Extra sections (media / files / links / settings placeholders). */
  children?: ReactNode;
  className?: string;
};

/**
 * Premium info card — flush under chat header.
 * Collapse: bottom chevron or tap the dimmed area outside the card.
 */
export function ConversationInfoSheet({
  open,
  onClose,
  name,
  avatarUrl,
  description,
  members = [],
  children,
  className,
}: ConversationInfoSheetProps) {
  if (!open) return null;

  return (
    <div className={cn("absolute inset-0 z-30", className)}>
      {/* Full-area dismiss — card sits above; tap dimmed zone closes. */}
      <button
        type="button"
        tabIndex={-1}
        aria-label="Cerrar información"
        className="absolute inset-0 z-0 cursor-default bg-black/40"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Info · ${name}`}
        className={cn(
          "relative z-10 mx-0 flex max-h-[min(88%,36rem)] w-full flex-col",
          "rounded-b-[28px] border border-t-0 border-[var(--color-border-subtle)]",
          "bg-[var(--color-surface-elevated)]",
          "shadow-[0_18px_40px_-12px_rgba(0,0,0,0.28)]",
        )}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
        }}
      >
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-1 pt-5">
          <div className="flex flex-col items-center text-center">
            <Avatar src={avatarUrl} alt={name} size="xl" zoomable />
            <h3 className="mt-3 text-[18px] font-semibold tracking-tight text-[var(--color-text-primary)]">
              {name}
            </h3>
            {description ? (
              <p className="mt-1.5 max-w-sm text-[13px] leading-5 text-[var(--color-text-secondary)]">
                {description}
              </p>
            ) : null}
          </div>

          {members.length > 0 ? (
            <section className="mt-6">
              <h4 className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
                Miembros · {members.length}
              </h4>
              <ul className="mt-2.5 space-y-1">
                {members.map((m) => (
                  <li
                    key={m.id}
                    className="flex items-center gap-3 rounded-[14px] px-1 py-1.5"
                  >
                    <Avatar
                      src={m.avatarUrl}
                      alt={m.name}
                      size="sm"
                      zoomable
                    />
                    <span className="min-w-0 flex-1 text-left">
                      <span className="block truncate text-[14px] font-medium text-[var(--color-text-primary)]">
                        {m.name}
                      </span>
                      {m.roleLabel ? (
                        <span className="text-[12px] text-[var(--color-text-tertiary)]">
                          {m.roleLabel}
                        </span>
                      ) : null}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="mt-5 divide-y divide-[var(--color-border-subtle)] overflow-hidden rounded-[16px] bg-[var(--color-surface-muted)]/70">
            {(
              [
                ["Fotos y vídeos", "Media compartida"],
                ["Archivos", "Documentos compartidos"],
                ["Enlaces", "Links de la conversación"],
                ["Ajustes", "Notificaciones y permisos"],
              ] as const
            ).map(([label, hint]) => (
              <button
                key={label}
                type="button"
                disabled
                className="flex w-full items-center justify-between px-3.5 py-3.5 text-left opacity-80"
              >
                <span>
                  <span className="block text-[14px] font-semibold text-[var(--color-text-primary)]">
                    {label}
                  </span>
                  <span className="text-[12px] text-[var(--color-text-tertiary)]">
                    {hint}
                  </span>
                </span>
                <span
                  className="text-[15px] text-[var(--color-text-tertiary)]"
                  aria-hidden
                >
                  ›
                </span>
              </button>
            ))}
          </section>

          {children}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="flex w-full shrink-0 flex-col items-center gap-1.5 pb-3.5 pt-2.5 text-[var(--color-text-tertiary)] active:bg-black/[0.03]"
          aria-label="Recoger"
        >
          <span
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)] shadow-sm"
            aria-hidden
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M6 14.5L12 8.5l6 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </button>
      </div>
    </div>
  );
}
