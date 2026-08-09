"use client";

import type { ReactNode, RefObject } from "react";
import { Children } from "react";

import { Avatar } from "../people/Avatar";
import { cn } from "../lib/cn";
import { ZoomableImage } from "../media/MediaLightbox";

export type AuthorCardProps = {
  name: string;
  meta?: string;
  avatarUrl?: string;
  official?: boolean;
  className?: string;
};

export function AuthorCard({
  name,
  meta,
  avatarUrl,
  official,
  className,
}: AuthorCardProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      {official ? (
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-action-primary-subtle)] text-[var(--color-action-primary)] text-sm font-semibold">
          {name.slice(0, 1).toUpperCase()}
        </span>
      ) : (
        <Avatar src={avatarUrl} alt={name} size="md" />
      )}
      <div className="min-w-0">
        <p className="truncate text-[15px] font-semibold text-[var(--color-text-primary)]">
          {name}
          {official ? (
            <span className="ml-2 text-[14px] font-semibold uppercase tracking-wide text-[var(--color-accent-official)]">
              Oficial
            </span>
          ) : null}
        </p>
        {meta ? (
          <p className="text-[15px] text-[var(--color-text-tertiary)]">{meta}</p>
        ) : null}
      </div>
    </div>
  );
}

export type ReactionBarProps = {
  acknowledgeCount: number;
  supportCount: number;
  myReaction?: "acknowledge" | "support" | null;
  commentCount: number;
  saved?: boolean;
  canReact?: boolean;
  canComment?: boolean;
  canSave?: boolean;
  onAcknowledge?: () => void;
  onSupport?: () => void;
  onComment?: () => void;
  onSave?: () => void;
  onReport?: () => void;
  reported?: boolean;
  /**
   * Prefer action language (“Comentar”) over badge counts.
   * Count still shown when > 0 for social proof.
   */
  commentActionLabel?: string;
  className?: string;
};

export function ReactionBar({
  acknowledgeCount,
  supportCount,
  myReaction,
  commentCount,
  saved,
  canReact = true,
  canComment = true,
  canSave = true,
  onAcknowledge,
  onSupport,
  onComment,
  onSave,
  onReport,
  reported,
  commentActionLabel,
  className,
}: ReactionBarProps) {
  const commentLabel =
    commentActionLabel ??
    (commentCount > 0 ? `Comentar · ${commentCount}` : "Comentar");

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 border-t border-[var(--color-border-subtle)] pt-3",
        className,
      )}
    >
      <button
        type="button"
        disabled={!canReact}
        onClick={onAcknowledge}
        className={cn(
          "min-h-[40px] rounded-full px-3 text-[15px] font-semibold",
          myReaction === "acknowledge"
            ? "bg-[var(--color-action-primary-subtle)] text-[var(--color-action-primary)]"
            : "bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]",
        )}
        aria-pressed={myReaction === "acknowledge"}
      >
        Entendido · {acknowledgeCount}
      </button>
      <button
        type="button"
        disabled={!canReact}
        onClick={onSupport}
        className={cn(
          "min-h-[40px] rounded-full px-3 text-[15px] font-semibold",
          myReaction === "support"
            ? "bg-[var(--color-action-accent-subtle)] text-[var(--color-action-accent)]"
            : "bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]",
        )}
        aria-pressed={myReaction === "support"}
      >
        Apoyo · {supportCount}
      </button>
      <button
        type="button"
        disabled={!canComment}
        onClick={onComment}
        className="min-h-[40px] rounded-full bg-[var(--color-surface-muted)] px-3 text-[15px] font-semibold text-[var(--color-text-secondary)]"
      >
        {commentLabel}
      </button>
      {canSave ? (
        <button
          type="button"
          onClick={onSave}
          className={cn(
            "min-h-[40px] rounded-full px-3 text-[15px] font-semibold",
            saved
              ? "bg-[var(--color-action-primary-subtle)] text-[var(--color-action-primary)]"
              : "bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]",
          )}
          aria-pressed={Boolean(saved)}
        >
          {saved ? "Guardado" : "Guardar"}
        </button>
      ) : null}
      {onReport ? (
        <button
          type="button"
          onClick={onReport}
          disabled={reported}
          className="min-h-[40px] rounded-full px-3 text-[15px] font-semibold text-[var(--color-text-tertiary)]"
        >
          {reported ? "Avisado" : "Avisar"}
        </button>
      ) : null}
    </div>
  );
}

export type CommentPreviewProps = {
  authorName: string;
  body: string;
  meta?: string;
  avatarUrl?: string;
  className?: string;
};

export function CommentPreview({
  authorName,
  body,
  meta,
  avatarUrl,
  className,
}: CommentPreviewProps) {
  return (
    <div className={cn("flex gap-3", className)}>
      <Avatar src={avatarUrl} alt={authorName} size="sm" />
      <div className="min-w-0 flex-1 rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] px-3 py-2">
        <p className="text-[15px] font-semibold text-[var(--color-text-primary)]">
          {authorName}
          {meta ? (
            <span className="ml-2 font-medium text-[var(--color-text-tertiary)]">
              {meta}
            </span>
          ) : null}
        </p>
        <p className="mt-0.5 text-[15px] leading-5 text-[var(--color-text-secondary)]">
          {body}
        </p>
      </div>
    </div>
  );
}

export type CommunityPostTone =
  | "official"
  | "neighbour"
  | "proposal"
  | "discussion"
  | "alert";

export type CommunityPostCardProps = {
  title: string;
  body: string;
  typeLabel: string;
  official?: boolean;
  /** Visual hierarchy for the town square — not identical cards. */
  tone?: CommunityPostTone;
  authorName: string;
  authorAvatarUrl?: string;
  meta: string;
  areaLabel?: string;
  imageUrl?: string;
  decisionStatus?: string;
  experienceLinkLabel?: string;
  onOpen?: () => void;
  reactionBar?: ReactNode;
  commentPreview?: ReactNode;
  /** Visible comment composer — do not hide behind badges. */
  commentComposer?: ReactNode;
  className?: string;
};

const TONE_SHELL: Record<CommunityPostTone, string> = {
  official: "border-l-4 border-[var(--color-accent-official)]",
  neighbour: "border-l-4 border-[var(--color-action-accent)]",
  proposal:
    "border-l-4 border-[var(--color-feedback-warning)] bg-[var(--color-feedback-warning-subtle)]/40",
  discussion: "border-l-4 border-[var(--color-sea)]",
  alert:
    "border-l-4 border-[var(--color-feedback-danger)] bg-[var(--color-feedback-danger-subtle)]/50",
};

export function CommunityPostCard({
  title,
  body,
  typeLabel,
  official,
  tone,
  authorName,
  authorAvatarUrl,
  meta,
  areaLabel,
  imageUrl,
  decisionStatus,
  experienceLinkLabel,
  onOpen,
  reactionBar,
  commentPreview,
  commentComposer,
  className,
}: CommunityPostCardProps) {
  const resolvedTone: CommunityPostTone | undefined =
    tone ?? (official ? "official" : undefined);

  return (
    <article
      className={cn(
        "overflow-hidden rounded-[var(--radius-lg)] bg-[var(--color-surface-elevated)] shadow-[var(--shadow-elev-1)]",
        resolvedTone ? TONE_SHELL[resolvedTone] : undefined,
        className,
      )}
    >
      <div className="p-4">
        {/* Author row stays outside the open button — Avatar is interactive. */}
        <AuthorCard
          name={authorName}
          avatarUrl={authorAvatarUrl}
          official={official}
          meta={[typeLabel, meta, areaLabel].filter(Boolean).join(" · ")}
        />
        <button
          type="button"
          onClick={onOpen}
          className="mt-3 block w-full text-left"
        >
          {decisionStatus ? (
            <span className="inline-flex rounded-full bg-[var(--color-feedback-warning-subtle)] px-3 py-1 text-[14px] font-semibold text-[var(--color-feedback-warning)]">
              {decisionStatus}
            </span>
          ) : null}
          <h3
            className={cn(
              "text-[18px] font-semibold leading-6 text-[var(--color-text-primary)]",
              decisionStatus ? "mt-3" : undefined,
            )}
          >
            {title}
          </h3>
          <p className="mt-2 line-clamp-3 text-[16px] leading-6 text-[var(--color-text-secondary)]">
            {body}
          </p>
          {experienceLinkLabel ? (
            <p className="mt-2 text-[14px] font-semibold text-[var(--color-action-primary)]">
              Actividad · {experienceLinkLabel}
            </p>
          ) : null}
        </button>
      </div>
      {imageUrl ? (
        <ZoomableImage
          src={imageUrl}
          alt=""
          zoomable
          fill={false}
          className="aspect-[16/9] w-full"
          wrapperClassName="h-auto w-full"
        />
      ) : null}
      {commentPreview ? (
        <div className="space-y-2 px-4 pb-2">{commentPreview}</div>
      ) : null}
      {reactionBar ? (
        <div className={cn("px-4", commentComposer ? "pb-2" : "pb-4")}>
          {reactionBar}
        </div>
      ) : null}
      {commentComposer ? (
        <div className="border-t border-[var(--color-border-subtle)] px-4 py-3">
          {commentComposer}
        </div>
      ) : null}
    </article>
  );
}

export type InlineCommentComposerProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  submitLabel?: string;
  disabled?: boolean;
  inputRef?: RefObject<HTMLTextAreaElement | null>;
  className?: string;
};

/** Obvious comment action — input + send, not a count badge. */
export function InlineCommentComposer({
  value,
  onChange,
  onSubmit,
  placeholder = "Escribe un comentario…",
  submitLabel = "Enviar",
  disabled,
  inputRef,
  className,
}: InlineCommentComposerProps) {
  const canSend = value.trim().length >= 2 && !disabled;
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <textarea
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        placeholder={placeholder}
        aria-label="Escribir comentario"
        className="min-h-[72px] w-full resize-none rounded-[14px] border border-[var(--color-border-subtle)] bg-white px-3.5 py-2.5 text-[15px] text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-tertiary)] focus:border-[var(--color-action-primary)] focus:ring-2 focus:ring-[var(--color-action-primary-subtle)]"
      />
      <button
        type="button"
        disabled={!canSend}
        onClick={onSubmit}
        className="flex min-h-[44px] w-full items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-action-primary)] text-[15px] font-semibold text-[var(--color-text-inverse)] disabled:opacity-45"
      >
        {submitLabel}
      </button>
    </div>
  );
}

export type CommunityFeedProps = {
  children: ReactNode;
  empty?: ReactNode;
  className?: string;
};

export function CommunityFeed({
  children,
  empty,
  className,
}: CommunityFeedProps) {
  const count = Children.count(children);
  return (
    <div className={cn("space-y-4", className)}>
      {count > 0 ? children : empty}
    </div>
  );
}

export type CommunityConversationRowProps = {
  title: string;
  body: string;
  meta?: string;
  official?: boolean;
  typeLabel?: string;
  open: boolean;
  onToggle: () => void;
  onOpen?: () => void;
  reactionBar?: ReactNode;
  className?: string;
};

/**
 * Compact accordion row — title only when collapsed.
 * Prefer for conversation lists over full CommunityPostCard density.
 */
export function CommunityConversationRow({
  title,
  body,
  meta,
  official,
  typeLabel,
  open,
  onToggle,
  onOpen,
  reactionBar,
  className,
}: CommunityConversationRowProps) {
  return (
    <div
      className={cn(
        "border-b border-[var(--color-border-subtle)] last:border-b-0",
        official && "border-l-[3px] border-l-[var(--color-accent-official)]",
        className,
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left active:bg-black/[0.02]"
      >
        <span className="min-w-0 flex-1">
          {typeLabel || official ? (
            <span className="mb-0.5 block text-[15px] font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
              {(() => {
                const bits = [official ? "Oficial" : null, typeLabel].filter(
                  Boolean,
                ) as string[];
                // Avoid "Oficial · Oficial" when typeLabel already says Oficial.
                const unique = bits.filter(
                  (bit, index) =>
                    bits.findIndex(
                      (b) => b.toLowerCase() === bit.toLowerCase(),
                    ) === index,
                );
                return unique.join(" · ");
              })()}
            </span>
          ) : null}
          <span className="block text-[15px] font-semibold leading-5 text-[var(--color-text-primary)]">
            {title}
          </span>
        </span>
        <span
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[var(--color-text-tertiary)] transition-transform duration-200",
            open && "rotate-180 text-[var(--color-action-primary)]",
          )}
          aria-hidden
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M6 9l6 6 6-6"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>

      {open ? (
        <div className="space-y-3 px-4 pb-3.5 pt-0">
          {meta ? (
            <p className="text-[14px] text-[var(--color-text-tertiary)]">
              {meta}
            </p>
          ) : null}
          <p className="text-[14px] leading-6 text-[var(--color-text-secondary)]">
            {body}
          </p>
          {onOpen ? (
            <button
              type="button"
              onClick={onOpen}
              className="text-[15px] font-semibold text-[var(--color-action-primary)]"
            >
              Abrir conversación ›
            </button>
          ) : null}
          {reactionBar ? <div>{reactionBar}</div> : null}
        </div>
      ) : null}
    </div>
  );
}

export type CommunityConversationListProps = {
  children: ReactNode;
  empty?: ReactNode;
  className?: string;
};

/** Single elevated list shell for accordion conversation rows. */
export function CommunityConversationList({
  children,
  empty,
  className,
}: CommunityConversationListProps) {
  const count = Children.count(children);
  if (count === 0) return <>{empty}</>;
  return (
    <div
      className={cn(
        "overflow-hidden rounded-[18px] bg-[var(--color-surface-elevated)] shadow-[var(--shadow-elev-1)]",
        className,
      )}
    >
      {children}
    </div>
  );
}
