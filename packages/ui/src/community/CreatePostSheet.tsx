"use client";

import { useState } from "react";

import { Button } from "../actions/Button";
import { cn } from "../lib/cn";

export type CreatePostSheetProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: { title: string; body: string }) => void;
  title?: string;
};

export function CreatePostSheet({
  open,
  onClose,
  onSubmit,
  title = "Comparte una actualización",
}: CreatePostSheetProps) {
  const [postTitle, setPostTitle] = useState("");
  const [body, setBody] = useState("");

  if (!open) return null;

  const canSubmit = postTitle.trim().length > 2 && body.trim().length > 2;

  const submit = () => {
    if (!canSubmit) return;
    onSubmit({ title: postTitle.trim(), body: body.trim() });
    setPostTitle("");
    setBody("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Cerrar"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "relative z-10 w-full max-w-md rounded-t-[var(--radius-xl)] bg-[var(--color-surface-elevated)] px-4 pb-8 pt-3 shadow-[var(--shadow-elev-2)] md:rounded-[var(--radius-xl)]",
        )}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[var(--color-border-strong)] md:hidden" />
        <h2 className="text-[22px] font-semibold text-[var(--color-text-primary)]">
          {title}
        </h2>
        <p className="mt-1 text-[14px] text-[var(--color-text-secondary)]">
          Útil, local y de vecinos — no es una red social.
        </p>
        <label className="mt-4 block">
          <span className="mb-1 block text-[15px] font-semibold">Título</span>
          <input
            value={postTitle}
            onChange={(e) => setPostTitle(e.target.value)}
            placeholder="¿De qué se trata?"
            className="min-h-[48px] w-full rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] px-3 text-[16px] outline-none focus:ring-2 focus:ring-[var(--color-action-primary)]"
          />
        </label>
        <label className="mt-3 block">
          <span className="mb-1 block text-[15px] font-semibold">Detalle</span>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            placeholder="Comparte algo útil para tus vecinos…"
            className="w-full rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] p-3 text-[16px] leading-6 outline-none focus:ring-2 focus:ring-[var(--color-action-primary)]"
          />
        </label>
        <div className="mt-5 flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button className="flex-1" disabled={!canSubmit} onClick={submit}>
            Publicar
          </Button>
        </div>
      </div>
    </div>
  );
}
