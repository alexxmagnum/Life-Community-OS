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
  title = "Share an update",
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
        aria-label="Close"
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
          Useful, local, neighbourly — not a social network post.
        </p>
        <label className="mt-4 block">
          <span className="mb-1 block text-[13px] font-semibold">Title</span>
          <input
            value={postTitle}
            onChange={(e) => setPostTitle(e.target.value)}
            placeholder="What’s this about?"
            className="min-h-[48px] w-full rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] px-3 text-[16px] outline-none focus:ring-2 focus:ring-[var(--color-action-primary)]"
          />
        </label>
        <label className="mt-3 block">
          <span className="mb-1 block text-[13px] font-semibold">Details</span>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            placeholder="Share something useful for neighbours…"
            className="w-full rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] p-3 text-[16px] leading-6 outline-none focus:ring-2 focus:ring-[var(--color-action-primary)]"
          />
        </label>
        <p className="mt-2 text-[12px] text-[var(--color-text-tertiary)]">
          Tip: mention someone with @Name (UI only for now).
        </p>
        <div className="mt-5 flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button className="flex-1" disabled={!canSubmit} onClick={submit}>
            Publish
          </Button>
        </div>
      </div>
    </div>
  );
}
