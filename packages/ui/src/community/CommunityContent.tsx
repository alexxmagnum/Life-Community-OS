import type { ReactNode } from "react";
import { Children } from "react";

import { Avatar } from "../people/Avatar";
import { cn } from "../lib/cn";

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
            <span className="ml-2 text-[12px] font-semibold uppercase tracking-wide text-[var(--color-accent-official)]">
              Oficial
            </span>
          ) : null}
        </p>
        {meta ? (
          <p className="text-[13px] text-[var(--color-text-tertiary)]">{meta}</p>
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
  className,
}: ReactionBarProps) {
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
          "min-h-[40px] rounded-full px-3 text-[13px] font-semibold",
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
          "min-h-[40px] rounded-full px-3 text-[13px] font-semibold",
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
        className="min-h-[40px] rounded-full bg-[var(--color-surface-muted)] px-3 text-[13px] font-semibold text-[var(--color-text-secondary)]"
      >
        Comentarios · {commentCount}
      </button>
      {canSave ? (
        <button
          type="button"
          onClick={onSave}
          className={cn(
            "min-h-[40px] rounded-full px-3 text-[13px] font-semibold",
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
          className="min-h-[40px] rounded-full px-3 text-[13px] font-semibold text-[var(--color-text-tertiary)]"
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
        <p className="text-[13px] font-semibold text-[var(--color-text-primary)]">
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

export type CommunityPostCardProps = {
  title: string;
  body: string;
  typeLabel: string;
  official?: boolean;
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
  className?: string;
};

export function CommunityPostCard({
  title,
  body,
  typeLabel,
  official,
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
  className,
}: CommunityPostCardProps) {
  return (
    <article
      className={cn(
        "overflow-hidden rounded-[var(--radius-lg)] bg-[var(--color-surface-elevated)] shadow-[var(--shadow-elev-1)]",
        official && "border-l-4 border-[var(--color-accent-official)]",
        className,
      )}
    >
      <button
        type="button"
        onClick={onOpen}
        className="block w-full p-4 text-left"
      >
        <AuthorCard
          name={authorName}
          avatarUrl={authorAvatarUrl}
          official={official}
          meta={[typeLabel, meta, areaLabel].filter(Boolean).join(" · ")}
        />
        {decisionStatus ? (
          <span className="mt-3 inline-flex rounded-full bg-[var(--color-feedback-warning-subtle)] px-3 py-1 text-[12px] font-semibold text-[var(--color-feedback-warning)]">
            {decisionStatus}
          </span>
        ) : null}
        <h3 className="mt-3 text-[18px] font-semibold leading-6 text-[var(--color-text-primary)]">
          {title}
        </h3>
        <p className="mt-2 line-clamp-3 text-[16px] leading-6 text-[var(--color-text-secondary)]">
          {body}
        </p>
        {experienceLinkLabel ? (
          <p className="mt-2 text-[14px] font-semibold text-[var(--color-action-primary)]">
            Related experience · {experienceLinkLabel}
          </p>
        ) : null}
      </button>
      {imageUrl ? (
        <button type="button" onClick={onOpen} className="block w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt=""
            className="aspect-[16/9] w-full object-cover"
          />
        </button>
      ) : null}
      {commentPreview ? (
        <div className="space-y-2 px-4 pb-2">{commentPreview}</div>
      ) : null}
      {reactionBar ? <div className="px-4 pb-4">{reactionBar}</div> : null}
    </article>
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
