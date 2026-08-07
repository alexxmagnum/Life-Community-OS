import type { ReactNode } from "react";

import { cn } from "../lib/cn";

export type TerritoryHeroProps = {
  territoryName: string;
  greeting: string;
  contextLabel: string;
  weatherLabel?: string;
  imageUrl: string;
  onNotifications?: () => void;
  notificationCount?: number;
  className?: string;
};

export function TerritoryHero({
  territoryName,
  greeting,
  contextLabel,
  weatherLabel,
  imageUrl,
  onNotifications,
  notificationCount = 0,
  className,
}: TerritoryHeroProps) {
  return (
    <section className={cn("space-y-4", className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-[family-name:var(--font-display)] text-[20px] font-semibold leading-6 text-[var(--color-action-primary)]">
            {territoryName}
          </p>
          <p className="mt-1 text-[14px] text-[var(--color-text-secondary)]">
            {contextLabel}
            {weatherLabel ? ` · ${weatherLabel}` : null}
          </p>
        </div>
        {onNotifications ? (
          <button
            type="button"
            onClick={onNotifications}
            className="relative flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-surface-elevated)] text-lg shadow-[var(--shadow-elev-1)]"
            aria-label="Notificaciones"
          >
            🔔
            {notificationCount > 0 ? (
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[var(--color-action-accent)]" />
            ) : null}
          </button>
        ) : null}
      </div>

      <div className="relative overflow-hidden rounded-[var(--radius-xl)] shadow-[var(--shadow-elev-1)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt=""
          className="aspect-[5/4] w-full object-cover md:aspect-[21/9]"
        />
        <div
          className="absolute inset-0 flex flex-col justify-end p-5 md:p-8"
          style={{
            background:
              "linear-gradient(transparent 28%, var(--color-hero-scrim))",
          }}
        >
          <p className="text-[13px] font-semibold tracking-wide text-[var(--color-text-inverse)]/85">
            {territoryName}
          </p>
          <h1 className="mt-1 max-w-xl font-[family-name:var(--font-display)] text-[34px] font-semibold leading-10 text-[var(--color-text-inverse)] md:text-[40px]">
            {greeting}
          </h1>
        </div>
      </div>
    </section>
  );
}

export type CommunityPulseCardProps = {
  eyebrow: string;
  title: string;
  meta: string;
  imageUrl?: string;
  tone?: "experience" | "official" | "neighbour" | "place" | "activity";
  onClick?: () => void;
  className?: string;
};

const toneAccent: Record<
  NonNullable<CommunityPulseCardProps["tone"]>,
  string
> = {
  experience: "bg-[var(--color-action-primary)]",
  official: "bg-[var(--color-accent-official)]",
  neighbour: "bg-[var(--color-accent-community)]",
  place: "bg-[var(--color-sea)]",
  activity: "bg-[var(--color-action-accent)]",
};

export function CommunityPulseCard({
  eyebrow,
  title,
  meta,
  imageUrl,
  tone = "activity",
  onClick,
  className,
}: CommunityPulseCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-w-[260px] max-w-[300px] shrink-0 overflow-hidden rounded-[var(--radius-xl)] bg-[var(--color-surface-elevated)] text-left shadow-[var(--shadow-elev-1)] transition-transform active:scale-[0.99]",
        className,
      )}
    >
      {imageUrl ? (
        <div className="relative w-[96px] shrink-0 self-stretch bg-[var(--color-surface-muted)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt="" className="h-full w-full object-cover" />
          <span
            className={cn(
              "absolute left-2 top-2 h-2 w-2 rounded-full",
              toneAccent[tone],
            )}
            aria-hidden
          />
        </div>
      ) : (
        <span
          className={cn("w-1.5 shrink-0 self-stretch", toneAccent[tone])}
          aria-hidden
        />
      )}
      <span className="flex min-w-0 flex-1 flex-col justify-center p-4">
        <span className="text-[12px] font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
          {eyebrow}
        </span>
        <span className="mt-1 line-clamp-2 text-[16px] font-semibold leading-5 text-[var(--color-text-primary)]">
          {title}
        </span>
        <span className="mt-2 text-[13px] text-[var(--color-text-secondary)]">
          {meta}
        </span>
      </span>
    </button>
  );
}

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
        "flex min-w-[220px] max-w-[240px] shrink-0 flex-col justify-between rounded-[var(--radius-xl)] bg-[var(--color-action-primary-subtle)] p-4 text-left transition-transform active:scale-[0.99]",
        className,
      )}
    >
      <span>
        <span className="block text-[17px] font-semibold leading-6 text-[var(--color-action-primary)]">
          {title}
        </span>
        <span className="mt-2 block text-[14px] leading-5 text-[var(--color-text-secondary)]">
          {description}
        </span>
      </span>
      <span className="mt-4 text-[14px] font-semibold text-[var(--color-action-primary)]">
        {ctaLabel} →
      </span>
    </button>
  );
}

export type OfficialNoticeCardProps = {
  title: string;
  preview: string;
  areaLabel?: string;
  imageUrl?: string;
  onClick?: () => void;
  className?: string;
};

export function OfficialNoticeCard({
  title,
  preview,
  areaLabel,
  imageUrl,
  onClick,
  className,
}: OfficialNoticeCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full overflow-hidden rounded-[var(--radius-xl)] bg-[var(--color-surface-elevated)] text-left shadow-[var(--shadow-elev-1)]",
        className,
      )}
    >
      {imageUrl ? (
        <div className="aspect-[21/9] bg-[var(--color-surface-muted)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt="" className="h-full w-full object-cover" />
        </div>
      ) : null}
      <div className="border-l-4 border-[var(--color-accent-official)] p-5">
        <p className="text-[12px] font-semibold uppercase tracking-wide text-[var(--color-accent-official)]">
          Aviso oficial
        </p>
        <h3 className="mt-2 text-[20px] font-semibold leading-6 text-[var(--color-text-primary)]">
          {title}
        </h3>
        <p className="mt-2 line-clamp-3 text-[16px] leading-6 text-[var(--color-text-secondary)]">
          {preview}
        </p>
        {areaLabel ? (
          <p className="mt-3 text-[13px] text-[var(--color-text-tertiary)]">
            {areaLabel}
          </p>
        ) : null}
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
    <article
      className={cn(
        "overflow-hidden rounded-[var(--radius-xl)] bg-[var(--color-surface-elevated)] shadow-[var(--shadow-elev-1)]",
        className,
      )}
    >
      <button type="button" className="block w-full text-left" onClick={onClick}>
        <div className="aspect-[16/10] overflow-hidden bg-[var(--color-surface-muted)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt="" className="h-full w-full object-cover" />
        </div>
        <div className="p-4">
          <h3 className="text-[18px] font-semibold leading-6 text-[var(--color-text-primary)]">
            {title}
          </h3>
          <p className="mt-1 text-[15px] text-[var(--color-text-secondary)]">
            {when} · {where}
          </p>
          {peopleLabel ? (
            <p className="mt-1 text-[13px] text-[var(--color-text-tertiary)]">
              {peopleLabel}
            </p>
          ) : null}
        </div>
      </button>
      {onCta ? (
        <div className="border-t border-[var(--color-border-subtle)] px-4 py-3">
          <button
            type="button"
            onClick={onCta}
            className="flex min-h-[48px] w-full items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-action-primary)] text-[16px] font-semibold text-[var(--color-text-inverse)]"
          >
            {ctaLabel}
          </button>
        </div>
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
        "flex min-w-[220px] max-w-[240px] shrink-0 flex-col overflow-hidden rounded-[var(--radius-xl)] bg-[var(--color-surface-elevated)] text-left shadow-[var(--shadow-elev-1)]",
        className,
      )}
    >
      <div className="aspect-[4/3] bg-[var(--color-surface-muted)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt="" className="h-full w-full object-cover" />
      </div>
      <span className="p-3">
        <span className="block text-[16px] font-semibold text-[var(--color-text-primary)]">
          {name}
        </span>
        <span className="mt-1 block text-[13px] text-[var(--color-text-secondary)]">
          Libre · {availability}
          {areaLabel ? ` · ${areaLabel}` : ""}
        </span>
      </span>
    </button>
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

export function QuickActionBar({ items, className }: QuickActionBarProps) {
  if (items.length === 0) return null;
  return (
    <div className={cn("flex gap-3", className)}>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={item.onClick}
          className="flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 rounded-[var(--radius-lg)] bg-[var(--color-surface-elevated)] px-2 py-3 text-[var(--color-action-primary)] shadow-[var(--shadow-elev-1)] transition-transform active:scale-[0.98]"
        >
          <span className="text-xl" aria-hidden>
            {item.icon}
          </span>
          <span className="text-[12px] font-semibold leading-4">
            {item.label}
          </span>
        </button>
      ))}
    </div>
  );
}
