import type { ReactNode } from "react";

import { cn } from "../lib/cn";

/** Edge-to-edge territory opening — brand identity lives on photography. */
export type TerritoryHeroProps = {
  territoryName: string;
  greeting: string;
  /** One living line under the greeting (e.g. “Esta tarde hay actividad”). */
  callout?: string;
  areaLabel: string;
  weatherLabel?: string;
  imageUrl: string;
  onNotifications?: () => void;
  notificationCount?: number;
  className?: string;
};

export function TerritoryHero({
  territoryName,
  greeting,
  callout,
  areaLabel,
  weatherLabel,
  imageUrl,
  onNotifications,
  notificationCount = 0,
  className,
}: TerritoryHeroProps) {
  return (
    <section className={cn("relative", className)}>
      <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-4 pt-3 md:px-8 md:pt-5">
        <div className="inline-flex max-w-[70%] items-center gap-2 rounded-full bg-[var(--color-surface-elevated)]/92 px-3.5 py-2 shadow-[var(--shadow-elev-1)] backdrop-blur-sm">
          <span
            className="h-2 w-2 shrink-0 rounded-full bg-[var(--color-action-accent)]"
            aria-hidden
          />
          <span className="truncate text-[13px] font-semibold text-[var(--color-text-primary)]">
            {areaLabel}
          </span>
          {weatherLabel ? (
            <span className="hidden truncate text-[13px] text-[var(--color-text-secondary)] sm:inline">
              · {weatherLabel}
            </span>
          ) : null}
        </div>
        {onNotifications ? (
          <button
            type="button"
            onClick={onNotifications}
            className="relative flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-surface-elevated)]/92 text-[var(--color-text-primary)] shadow-[var(--shadow-elev-1)] backdrop-blur-sm"
            aria-label="Notificaciones"
          >
            <span className="text-lg leading-none" aria-hidden>
              ◌
            </span>
            {notificationCount > 0 ? (
              <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-[var(--color-action-accent)]" />
            ) : null}
          </button>
        ) : null}
      </div>

      <div className="relative min-h-[min(58vh,520px)] overflow-hidden md:min-h-[min(48vh,480px)] md:rounded-b-[var(--radius-xl)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(20,28,24,0.12) 0%, transparent 32%, var(--color-hero-scrim) 100%)",
          }}
        />
        <div className="absolute inset-x-0 bottom-0 px-5 pb-8 pt-24 md:px-10 md:pb-10">
          <p className="text-[13px] font-semibold tracking-[0.08em] text-[var(--color-text-inverse)]/90">
            {territoryName}
          </p>
          <h1 className="mt-2 max-w-[18ch] font-[family-name:var(--font-display)] text-[36px] font-semibold leading-[1.1] text-[var(--color-text-inverse)] md:text-[44px]">
            {greeting}
          </h1>
          {callout ? (
            <p className="mt-3 max-w-[28ch] text-[16px] font-medium leading-6 text-[var(--color-text-inverse)]/88">
              {callout}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export type QuickActionBarItem = {
  id: string;
  label: string;
  icon: ReactNode;
  onClick: () => void;
};

export type QuickActionBarProps = {
  items: QuickActionBarItem[];
  className?: string;
};

/** Three equal invitations to act — not a module launcher. */
export function QuickActionBar({ items, className }: QuickActionBarProps) {
  if (items.length === 0) return null;
  return (
    <div className={cn("grid grid-cols-3 gap-2.5", className)}>
      {items.slice(0, 3).map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={item.onClick}
          className="flex min-h-[56px] flex-col items-center justify-center gap-1.5 rounded-[var(--radius-lg)] bg-[var(--color-action-primary-subtle)] px-2 py-3.5 text-[var(--color-action-primary)] transition-transform active:scale-[0.98]"
        >
          <span className="text-[20px] leading-none" aria-hidden>
            {item.icon}
          </span>
          <span className="text-[13px] font-semibold leading-4">{item.label}</span>
        </button>
      ))}
    </div>
  );
}

export type CommunityPulseMomentProps = {
  title: string;
  livingLine: string;
  children?: ReactNode;
  emptyLabel?: string;
  onEmptyAction?: () => void;
  emptyActionLabel?: string;
  className?: string;
};

/** Living community moment — narrative first, then soft agenda pills. */
export function CommunityPulseMoment({
  title,
  livingLine,
  children,
  emptyLabel,
  onEmptyAction,
  emptyActionLabel = "Descubrir",
  className,
}: CommunityPulseMomentProps) {
  const hasChildren = Boolean(children);
  return (
    <section className={cn("space-y-5", className)}>
      <div>
        <h2 className="font-[family-name:var(--font-display)] text-[28px] font-semibold leading-8 text-[var(--color-text-primary)]">
          {title}
        </h2>
        <p className="mt-2 text-[17px] leading-6 text-[var(--color-text-secondary)]">
          {livingLine}
        </p>
      </div>
      {hasChildren ? (
        <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {children}
        </div>
      ) : (
        <div className="rounded-[var(--radius-xl)] bg-[var(--color-surface-muted)]/70 px-5 py-8 text-center">
          <p className="text-[16px] leading-6 text-[var(--color-text-secondary)]">
            {emptyLabel}
          </p>
          {onEmptyAction ? (
            <button
              type="button"
              onClick={onEmptyAction}
              className="mt-4 text-[16px] font-semibold text-[var(--color-action-primary)]"
            >
              {emptyActionLabel}
            </button>
          ) : null}
        </div>
      )}
    </section>
  );
}

export type CommunityPulseCardProps = {
  time: string;
  title: string;
  meta: string;
  live?: boolean;
  onClick?: () => void;
  className?: string;
  /** @deprecated unused — kept for type compatibility during redesign */
  eyebrow?: string;
  imageUrl?: string;
  tone?: "experience" | "official" | "neighbour" | "place" | "activity";
};

/** Soft agenda pill — time-led, not a mini card grid. */
export function CommunityPulseCard({
  time,
  title,
  meta,
  live,
  onClick,
  className,
}: CommunityPulseCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-w-[168px] max-w-[200px] shrink-0 flex-col rounded-[var(--radius-lg)] bg-[var(--color-surface-elevated)] px-4 py-3.5 text-left shadow-[var(--shadow-elev-1)] transition-transform active:scale-[0.98]",
        className,
      )}
    >
      <span className="flex items-center gap-2">
        <span className="text-[13px] font-semibold text-[var(--color-action-primary)]">
          {time}
        </span>
        {live ? (
          <span
            className="h-1.5 w-1.5 rounded-full bg-[var(--color-action-accent)]"
            aria-label="En breve"
          />
        ) : null}
      </span>
      <span className="mt-1.5 line-clamp-2 text-[16px] font-semibold leading-5 text-[var(--color-text-primary)]">
        {title}
      </span>
      <span className="mt-1.5 line-clamp-1 text-[13px] text-[var(--color-text-tertiary)]">
        {meta}
      </span>
    </button>
  );
}

/** @deprecated Prefer QuickActionBar — kept for export stability. */
export type ParticipationInvitationCardProps = {
  title: string;
  description: string;
  ctaLabel: string;
  onClick?: () => void;
  className?: string;
};

export function ParticipationInvitationCard({
  title,
  description,
  ctaLabel,
  onClick,
  className,
}: ParticipationInvitationCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-[var(--radius-xl)] bg-[var(--color-action-primary-subtle)] px-5 py-5 text-left",
        className,
      )}
    >
      <span className="block font-[family-name:var(--font-display)] text-[22px] font-semibold text-[var(--color-action-primary)]">
        {title}
      </span>
      <span className="mt-2 block text-[15px] leading-6 text-[var(--color-text-secondary)]">
        {description}
      </span>
      <span className="mt-4 inline-block text-[15px] font-semibold text-[var(--color-action-primary)]">
        {ctaLabel}
      </span>
    </button>
  );
}

export type OfficialNoticeCardProps = {
  title: string;
  preview: string;
  areaLabel?: string;
  imageUrl?: string;
  badgeLabel?: string;
  onClick?: () => void;
  className?: string;
};

/** Editorial official voice — one calm story, not a feed item. */
export function OfficialNoticeCard({
  title,
  preview,
  areaLabel,
  imageUrl,
  badgeLabel = "Oficial",
  onClick,
  className,
}: OfficialNoticeCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("group w-full text-left", className)}
    >
      {imageUrl ? (
        <div className="aspect-[16/10] overflow-hidden rounded-[var(--radius-xl)] bg-[var(--color-surface-muted)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt=""
            className="h-full w-full object-cover transition-transform duration-500 group-active:scale-[1.02]"
          />
        </div>
      ) : null}
      <div className={cn(imageUrl ? "mt-4" : "", "pl-4 border-l-[3px] border-[var(--color-accent-official)]")}>
        <p className="text-[13px] font-semibold tracking-wide text-[var(--color-accent-official)]">
          {badgeLabel}
          {areaLabel ? ` · ${areaLabel}` : ""}
        </p>
        <h3 className="mt-2 font-[family-name:var(--font-display)] text-[24px] font-semibold leading-7 text-[var(--color-text-primary)]">
          {title}
        </h3>
        <p className="mt-2 line-clamp-2 text-[16px] leading-6 text-[var(--color-text-secondary)]">
          {preview}
        </p>
      </div>
    </button>
  );
}

export type CommunityStoryProps = {
  eyebrow: string;
  title: string;
  body: string;
  meta?: string;
  imageUrl?: string;
  authorName?: string;
  authorAvatarUrl?: string;
  onClick?: () => void;
  className?: string;
};

/** Human community story — people and place, not a social card. */
export function CommunityStory({
  eyebrow,
  title,
  body,
  meta,
  imageUrl,
  authorName,
  authorAvatarUrl,
  onClick,
  className,
}: CommunityStoryProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("w-full text-left", className)}
    >
      {imageUrl ? (
        <div className="aspect-[5/4] overflow-hidden rounded-[var(--radius-xl)] bg-[var(--color-surface-muted)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt="" className="h-full w-full object-cover" />
        </div>
      ) : null}
      <div className={imageUrl ? "mt-4" : ""}>
        <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--color-accent-community)]">
          {eyebrow}
        </p>
        <h3 className="mt-2 font-[family-name:var(--font-display)] text-[24px] font-semibold leading-7 text-[var(--color-text-primary)]">
          {title}
        </h3>
        <p className="mt-2 line-clamp-3 text-[16px] leading-6 text-[var(--color-text-secondary)]">
          {body}
        </p>
        {(authorName || meta) && (
          <div className="mt-4 flex items-center gap-3">
            {authorAvatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={authorAvatarUrl}
                alt=""
                className="h-9 w-9 rounded-full object-cover"
              />
            ) : null}
            <div>
              {authorName ? (
                <p className="text-[15px] font-semibold text-[var(--color-text-primary)]">
                  {authorName}
                </p>
              ) : null}
              {meta ? (
                <p className="text-[13px] text-[var(--color-text-tertiary)]">
                  {meta}
                </p>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </button>
  );
}

export type ExperiencePreviewCardProps = {
  title: string;
  when: string;
  where: string;
  imageUrl: string;
  peopleLabel?: string;
  ctaLabel?: string;
  onClick?: () => void;
  onCta?: () => void;
  className?: string;
};

/** Photo-led discovery moment — one primary CTA, no chrome stack. */
export function ExperiencePreviewCard({
  title,
  when,
  where,
  imageUrl,
  peopleLabel,
  ctaLabel = "Unirme",
  onClick,
  onCta,
  className,
}: ExperiencePreviewCardProps) {
  return (
    <article className={cn("relative", className)}>
      <button
        type="button"
        className="group relative block w-full overflow-hidden rounded-[var(--radius-xl)] text-left"
        onClick={onClick}
      >
        <div className="aspect-[4/5] bg-[var(--color-surface-muted)] sm:aspect-[16/10]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt=""
            className="h-full w-full object-cover transition-transform duration-700 group-active:scale-[1.02]"
          />
        </div>
        <div
          className="absolute inset-0 flex flex-col justify-end p-5"
          style={{
            background:
              "linear-gradient(transparent 40%, rgba(20,28,24,0.72))",
          }}
        >
          <h3 className="font-[family-name:var(--font-display)] text-[26px] font-semibold leading-8 text-[var(--color-text-inverse)]">
            {title}
          </h3>
          <p className="mt-2 text-[15px] text-[var(--color-text-inverse)]/90">
            {when} · {where}
          </p>
          {peopleLabel ? (
            <p className="mt-1 text-[13px] text-[var(--color-text-inverse)]/75">
              {peopleLabel}
            </p>
          ) : null}
        </div>
      </button>
      {onCta ? (
        <button
          type="button"
          onClick={onCta}
          className="mt-4 flex min-h-[52px] w-full items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-action-primary)] text-[16px] font-semibold text-[var(--color-text-inverse)] transition-transform active:scale-[0.99]"
        >
          {ctaLabel}
        </button>
      ) : null}
    </article>
  );
}

export type PlacePreviewCardProps = {
  name: string;
  availability: string;
  areaLabel?: string;
  imageUrl: string;
  onClick?: () => void;
  className?: string;
};

/** Visual place tease — curiosity over catalog. */
export function PlacePreviewCard({
  name,
  availability,
  areaLabel,
  imageUrl,
  onClick,
  className,
}: PlacePreviewCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative min-w-[72vw] max-w-[280px] shrink-0 overflow-hidden rounded-[var(--radius-xl)] text-left sm:min-w-[240px]",
        className,
      )}
    >
      <div className="aspect-[3/4] bg-[var(--color-surface-muted)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt="" className="h-full w-full object-cover" />
      </div>
      <div
        className="absolute inset-0 flex flex-col justify-end p-4"
        style={{
          background:
            "linear-gradient(transparent 45%, rgba(20,28,24,0.7))",
        }}
      >
        <span className="font-[family-name:var(--font-display)] text-[22px] font-semibold leading-6 text-[var(--color-text-inverse)]">
          {name}
        </span>
        <span className="mt-1.5 text-[13px] text-[var(--color-text-inverse)]/85">
          Libre · {availability}
          {areaLabel ? ` · ${areaLabel}` : ""}
        </span>
      </div>
    </button>
  );
}

export type HomeSectionProps = {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  children: ReactNode;
  className?: string;
};

export function HomeSection({
  title,
  subtitle,
  actionLabel,
  onAction,
  children,
  className,
}: HomeSectionProps) {
  return (
    <section className={cn("space-y-5", className)}>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-[28px] font-semibold leading-8 text-[var(--color-text-primary)]">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-2 text-[16px] leading-6 text-[var(--color-text-secondary)]">
              {subtitle}
            </p>
          ) : null}
        </div>
        {actionLabel && onAction ? (
          <button
            type="button"
            onClick={onAction}
            className="shrink-0 pb-1 text-[15px] font-semibold text-[var(--color-action-primary)]"
          >
            {actionLabel}
          </button>
        ) : null}
      </div>
      {children}
    </section>
  );
}
