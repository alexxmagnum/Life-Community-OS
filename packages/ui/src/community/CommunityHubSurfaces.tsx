"use client";

import type { ReactNode } from "react";

import { cn } from "../lib/cn";

/**
 * Community Hub surfaces — one card language for the plaza.
 * Mirrors the Home premium language (warm elevated cards, soft layered
 * shadows, tinted circular icons) so Home and Comunidad read as siblings.
 *
 * Card levels:
 *   card  → primary content block (radius 18)
 *   row   → compact secondary item (radius 14)
 *   tile  → area door in a 3-up grid (radius 18)
 */

const CARD =
  "rounded-[18px] border border-[#E8E2D8] bg-[#FFFCFA] shadow-[0_6px_18px_rgba(26,31,28,0.08)]";
const ROW =
  "rounded-[14px] border border-[#E8E2D8] bg-white shadow-[0_4px_14px_rgba(26,31,28,0.08)]";
const PRESS = "transition-transform active:scale-[0.99]";

export type HubAttentionTone = "alert" | "important" | "info";

const ATTENTION_SHELL: Record<HubAttentionTone, string> = {
  alert:
    "border-[color-mix(in_srgb,#B42318_38%,transparent)] bg-[#FBEDEB] shadow-[0_6px_18px_rgba(180,35,24,0.10)]",
  important:
    "border-[color-mix(in_srgb,#B8860B_40%,transparent)] bg-[#FCF6E4] shadow-[0_6px_18px_rgba(184,134,11,0.10)]",
  info: "border-[color-mix(in_srgb,#3D6B7A_34%,transparent)] bg-[#EBF3F6] shadow-[0_6px_18px_rgba(61,107,122,0.10)]",
};

export type HubAttentionCardProps = {
  tone: HubAttentionTone;
  /** Emoji or glyph — matches Home alert language. */
  glyph: string;
  title: string;
  meta?: string;
  actionLabel?: string;
  onClick?: () => void;
  className?: string;
};

/** Something that needs the neighbour's attention today. */
export function HubAttentionCard({
  tone,
  glyph,
  title,
  meta,
  actionLabel,
  onClick,
  className,
}: HubAttentionCardProps) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      {...(onClick ? { type: "button" as const, onClick } : {})}
      className={cn(
        "flex w-full items-start gap-3.5 rounded-[18px] border px-3.5 py-3.5 text-left",
        ATTENTION_SHELL[tone],
        onClick ? PRESS : "",
        className,
      )}
    >
      <span
        className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/75 text-[24px] leading-none"
        aria-hidden
      >
        {glyph}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-semibold leading-5 text-[var(--color-text-primary)]">
          {title}
        </span>
        {meta ? (
          <span className="mt-1 block text-[13px] leading-5 text-[var(--color-text-secondary)]">
            {meta}
          </span>
        ) : null}
        {actionLabel ? (
          <span className="mt-2 inline-flex text-[14px] font-semibold text-[var(--color-action-primary)]">
            {actionLabel} →
          </span>
        ) : null}
      </span>
    </Tag>
  );
}

export type HubRowProps = {
  title: string;
  meta?: string;
  /** Square thumbnail. Falls back to the glyph tile. */
  imageUrl?: string;
  glyph?: string;
  /** Right-aligned quiet label (e.g. relative time). */
  trailingLabel?: string;
  onClick?: () => void;
  className?: string;
};

/** Compact secondary item — notices, spaces, channels, pets. */
export function HubRow({
  title,
  meta,
  imageUrl,
  glyph,
  trailingLabel,
  onClick,
  className,
}: HubRowProps) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      {...(onClick ? { type: "button" as const, onClick } : {})}
      className={cn(
        "flex w-full items-center gap-3 px-3 py-2.5 text-left",
        ROW,
        onClick ? PRESS : "",
        className,
      )}
    >
      {imageUrl ? (
        <span className="h-10 w-10 shrink-0 overflow-hidden rounded-[10px] bg-[var(--color-surface-muted)]">
          <img src={imageUrl} alt="" className="h-full w-full object-cover" />
        </span>
      ) : glyph ? (
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[var(--color-action-primary-subtle)] text-[20px] leading-none"
          aria-hidden
        >
          {glyph}
        </span>
      ) : null}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14px] font-semibold leading-5 text-[var(--color-text-primary)]">
          {title}
        </span>
        {meta ? (
          <span className="mt-0.5 block truncate text-[13px] leading-4 text-[var(--color-text-secondary)]">
            {meta}
          </span>
        ) : null}
      </span>
      {trailingLabel ? (
        <span className="shrink-0 text-[12px] text-[var(--color-text-tertiary)]">
          {trailingLabel}
        </span>
      ) : onClick ? (
        <span
          className="shrink-0 text-[17px] text-[var(--color-action-primary)]"
          aria-hidden
        >
          ›
        </span>
      ) : null}
    </Tag>
  );
}

export type HubRailProps = {
  children: ReactNode;
  label?: string;
  className?: string;
};

/** Horizontal collection rail — browsing without vertical scroll cost. */
export function HubRail({ children, label, className }: HubRailProps) {
  return (
    <div
      className={cn(
        "-mx-1 flex gap-3 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className,
      )}
      role={label ? "group" : undefined}
      aria-label={label}
    >
      {children}
    </div>
  );
}

export type HubRailCardProps = {
  title: string;
  meta?: string;
  imageUrl?: string;
  onClick: () => void;
  className?: string;
};

/** Rail item — photo-led collection entry (groups, experiences). */
export function HubRailCard({
  title,
  meta,
  imageUrl,
  onClick,
  className,
}: HubRailCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-[min(52vw,172px)] shrink-0 overflow-hidden text-left",
        CARD,
        PRESS,
        className,
      )}
    >
      <span className="block aspect-[16/10] w-full bg-[var(--color-surface-muted)]">
        {imageUrl ? (
          <img src={imageUrl} alt="" className="h-full w-full object-cover" />
        ) : null}
      </span>
      <span className="block px-3 py-2.5">
        <span className="block truncate text-[14px] font-semibold leading-5 text-[var(--color-text-primary)]">
          {title}
        </span>
        {meta ? (
          <span className="mt-0.5 block truncate text-[12px] leading-4 text-[var(--color-text-tertiary)]">
            {meta}
          </span>
        ) : null}
      </span>
    </button>
  );
}

export type HubDoorCardProps = {
  title: string;
  meta?: string;
  imageUrl?: string;
  /** Initial shown when there is no photo. */
  fallbackInitial?: string;
  /** Photo edge — `end` differentiates neighbour posts from groups. */
  imageSide?: "start" | "end";
  onClick: () => void;
  className?: string;
};

/** Full-width door into a conversation (group, neighbour). */
export function HubDoorCard({
  title,
  meta,
  imageUrl,
  fallbackInitial,
  imageSide = "start",
  onClick,
  className,
}: HubDoorCardProps) {
  const photo = (
    <span className="relative h-[72px] w-[88px] shrink-0 overflow-hidden bg-[var(--color-surface-muted)]">
      {imageUrl ? (
        <img src={imageUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-[18px] font-semibold text-[var(--color-text-secondary)]">
          {fallbackInitial ?? title.slice(0, 1).toUpperCase()}
        </span>
      )}
    </span>
  );

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 overflow-hidden text-left",
        CARD,
        PRESS,
        className,
      )}
    >
      {imageSide === "start" ? photo : null}
      <span
        className={cn(
          "min-w-0 flex-1 py-3",
          imageSide === "start" ? "pr-1" : "pl-3",
        )}
      >
        <span className="block truncate text-[15px] font-semibold leading-5 text-[var(--color-text-primary)]">
          {title}
        </span>
        {meta ? (
          <span className="mt-0.5 block truncate text-[13px] leading-4 text-[var(--color-text-tertiary)]">
            {meta}
          </span>
        ) : null}
      </span>
      <span
        className={cn(
          "shrink-0 text-[18px] text-[var(--color-action-primary)]",
          imageSide === "start" ? "pr-3" : "",
        )}
        aria-hidden
      >
        ›
      </span>
      {imageSide === "end" ? photo : null}
    </button>
  );
}

export type HubTileProps = {
  label: string;
  /** Emoji door glyph — same language as Home quick doors. */
  glyph: string;
  meta?: string;
  /** Tint classes for the glyph circle. */
  tint?: string;
  active?: boolean;
  onSelect: () => void;
  className?: string;
};

/** Area door — replaces long half-empty lists with a scannable grid. */
export function HubTile({
  label,
  glyph,
  meta,
  tint = "bg-[var(--color-action-primary-subtle)]",
  active = false,
  onSelect,
  className,
}: HubTileProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={cn(
        "flex flex-col items-center gap-2 rounded-[18px] border px-2 py-3.5 text-center",
        active
          ? "border-[var(--color-action-primary)] bg-[var(--color-action-primary-subtle)] shadow-[0_6px_18px_rgba(31,74,60,0.14)]"
          : "border-[#E8E2D8] bg-[#FFFCFA] shadow-[0_6px_18px_rgba(26,31,28,0.08)]",
        "transition-transform active:scale-[0.97]",
        className,
      )}
    >
      <span
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-full text-[26px] leading-none shadow-[0_2px_8px_rgba(26,31,28,0.08)]",
          active ? "bg-white" : tint,
        )}
        aria-hidden
      >
        {glyph}
      </span>
      <span className="block text-[13px] font-semibold leading-4 text-[var(--color-text-primary)]">
        {label}
      </span>
      {meta ? (
        <span className="block text-[11px] leading-3 text-[var(--color-text-tertiary)]">
          {meta}
        </span>
      ) : null}
    </button>
  );
}

export type HubTileGridProps = {
  children: ReactNode;
  className?: string;
};

export function HubTileGrid({ children, className }: HubTileGridProps) {
  return (
    <div className={cn("grid grid-cols-3 gap-2.5", className)}>{children}</div>
  );
}

export type HubPanelProps = {
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  /** Cap the body height so long areas don't stretch the hub. */
  scrollBody?: boolean;
};

/** In-place area detail opened from a HubTile — no extra route needed. */
export function HubPanel({
  title,
  description,
  onClose,
  children,
  className,
  scrollBody = true,
}: HubPanelProps) {
  return (
    <section className={cn("overflow-hidden", CARD, className)}>
      <div className="flex items-start justify-between gap-3 px-3.5 pt-3.5">
        <div className="min-w-0">
          <h3 className="text-[16px] font-semibold leading-5 text-[var(--color-text-primary)]">
            {title}
          </h3>
          {description ? (
            <p className="mt-1 text-[13px] leading-5 text-[var(--color-text-secondary)]">
              {description}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="-mr-1 -mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[16px] text-[var(--color-text-tertiary)]"
          aria-label="Cerrar"
        >
          ×
        </button>
      </div>
      <div
        className={cn(
          "space-y-2 px-3.5 pb-3.5 pt-3",
          scrollBody
            ? "max-h-[48vh] overflow-y-auto overscroll-contain"
            : undefined,
        )}
      >
        {children}
      </div>
    </section>
  );
}

export type HubProposalStatus = "open" | "closing_soon" | "closed";

const PROPOSAL_PILL: Record<HubProposalStatus, string> = {
  open: "bg-[var(--color-feedback-success-subtle)] text-[var(--color-feedback-success)]",
  closing_soon:
    "bg-[var(--color-action-accent-subtle)] text-[var(--color-action-accent)]",
  closed: "bg-[var(--color-surface-muted)] text-[var(--color-text-tertiary)]",
};

const PROPOSAL_PILL_LABEL: Record<HubProposalStatus, string> = {
  open: "Abierta",
  closing_soon: "Cierra pronto",
  closed: "Cerrada",
};

export type HubProposalCardProps = {
  title: string;
  body?: string;
  meta?: string;
  status?: HubProposalStatus;
  supportCount?: number;
  commentCount?: number;
  onOpen: () => void;
  className?: string;
};

/**
 * Proposal entry — leads to the content detail where public comments live.
 * The hub stays scannable; debate happens on the content page.
 */
export function HubProposalCard({
  title,
  body,
  meta,
  status = "open",
  supportCount = 0,
  commentCount = 0,
  onOpen,
  className,
}: HubProposalCardProps) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn("w-full px-3.5 py-3.5 text-left", CARD, PRESS, className)}
    >
      <span className="flex items-center gap-2">
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
            PROPOSAL_PILL[status],
          )}
        >
          {PROPOSAL_PILL_LABEL[status]}
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
          Propuesta
        </span>
      </span>
      <span className="mt-2 block text-[16px] font-semibold leading-5 text-[var(--color-text-primary)]">
        {title}
      </span>
      {body ? (
        <span className="mt-1 line-clamp-2 block text-[14px] leading-5 text-[var(--color-text-secondary)]">
          {body}
        </span>
      ) : null}
      <span className="mt-2.5 flex items-center gap-3 text-[12px] text-[var(--color-text-tertiary)]">
        {meta ? <span className="min-w-0 truncate">{meta}</span> : null}
        <span className="ml-auto shrink-0 whitespace-nowrap">
          {supportCount} apoyos · {commentCount} comentarios
        </span>
      </span>
    </button>
  );
}
