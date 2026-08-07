import { Button } from "../actions/Button";
import { cn } from "../lib/cn";

export type ExperienceCardProps = {
  title: string;
  when: string;
  where: string;
  meta?: string;
  imageUrl: string;
  organizerName?: string;
  statusLabel?: string;
  ctaLabel?: string;
  onCta?: () => void;
  onClick?: () => void;
  className?: string;
};

export function ExperienceCard({
  title,
  when,
  where,
  meta,
  imageUrl,
  organizerName,
  statusLabel,
  ctaLabel = "Ver",
  onCta,
  onClick,
  className,
}: ExperienceCardProps) {
  return (
    <article
      className={cn(
        "overflow-hidden rounded-[var(--radius-lg)] bg-[var(--color-surface-elevated)] shadow-[var(--shadow-elev-1)]",
        className,
      )}
    >
      <button
        type="button"
        className="block w-full text-left"
        onClick={onClick}
        aria-label={title}
      >
        <div className="relative aspect-[16/10] overflow-hidden bg-[var(--color-surface-muted)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt=""
            className="h-full w-full object-cover"
          />
          {statusLabel ? (
            <span className="absolute left-3 top-3 rounded-full bg-[var(--color-surface-elevated)]/95 px-3 py-1 text-[12px] font-semibold text-[var(--color-action-primary)]">
              {statusLabel}
            </span>
          ) : null}
        </div>
        <div className="p-4">
          <h3 className="text-[18px] font-semibold leading-6 text-[var(--color-text-primary)]">
            {title}
          </h3>
          <p className="mt-1 text-[15px] text-[var(--color-text-secondary)]">
            {when} · {where}
          </p>
          {(meta || organizerName) && (
            <p className="mt-1 text-[13px] text-[var(--color-text-tertiary)]">
              {[organizerName ? `Organizado por ${organizerName}` : null, meta]
                .filter(Boolean)
                .join(" · ")}
            </p>
          )}
        </div>
      </button>
      {onCta ? (
        <div className="border-t border-[var(--color-border-subtle)] px-4 py-3">
          <Button fullWidth onClick={onCta}>
            {ctaLabel}
          </Button>
        </div>
      ) : null}
    </article>
  );
}

/** Community feed card (neighbour or general post). */
export type CommunityCardProps = {
  author?: string;
  title: string;
  body: string;
  meta: string;
  reactions?: number;
  comments?: number;
  onClick?: () => void;
  className?: string;
};

export function CommunityCard({
  author,
  title,
  body,
  meta,
  reactions,
  comments,
  onClick,
  className,
}: CommunityCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-[var(--radius-lg)] bg-[var(--color-surface-elevated)] p-4 text-left shadow-[var(--shadow-elev-1)] transition-transform active:scale-[0.99]",
        className,
      )}
    >
      {author ? (
        <p className="text-[13px] font-semibold text-[var(--color-accent-community)]">
          {author} · Neighbours
        </p>
      ) : null}
      <h3 className="mt-1 text-[18px] font-semibold text-[var(--color-text-primary)]">
        {title}
      </h3>
      <p className="mt-1 text-[16px] leading-6 text-[var(--color-text-secondary)]">
        {body}
      </p>
      <div className="mt-3 flex items-center gap-4 text-[13px] text-[var(--color-text-tertiary)]">
        <span>{meta}</span>
        {typeof reactions === "number" ? <span>{reactions} reactions</span> : null}
        {typeof comments === "number" ? <span>{comments} comments</span> : null}
      </div>
    </button>
  );
}

export type AnnouncementCardProps = {
  title: string;
  preview: string;
  area?: string;
  imageUrl?: string;
  onClick?: () => void;
  className?: string;
};

export function AnnouncementCard({
  title,
  preview,
  area,
  imageUrl,
  onClick,
  className,
}: AnnouncementCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full overflow-hidden rounded-[var(--radius-lg)] bg-[var(--color-surface-elevated)] text-left shadow-[var(--shadow-elev-1)]",
        className,
      )}
    >
      {imageUrl ? (
        <div className="aspect-[16/9] bg-[var(--color-surface-muted)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt="" className="h-full w-full object-cover" />
        </div>
      ) : null}
      <div className="border-l-4 border-[var(--color-accent-official)] p-4">
        <p className="text-[13px] font-semibold uppercase tracking-wide text-[var(--color-accent-official)]">
          Official
        </p>
        <h3 className="mt-1 text-[18px] font-semibold text-[var(--color-text-primary)]">
          {title}
        </h3>
        <p className="mt-1 line-clamp-2 text-[16px] leading-6 text-[var(--color-text-secondary)]">
          {preview}
        </p>
        {area ? (
          <p className="mt-2 text-[13px] text-[var(--color-text-tertiary)]">
            {area}
          </p>
        ) : null}
      </div>
    </button>
  );
}

export type DiscoveryCardProps = {
  title: string;
  subtitle: string;
  imageUrl: string;
  badge?: string;
  onClick?: () => void;
  className?: string;
};

/** Generic photo-led discovery tile (services, tips, etc.). */
export function DiscoveryCard({
  title,
  subtitle,
  imageUrl,
  badge,
  onClick,
  className,
}: DiscoveryCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "overflow-hidden rounded-[var(--radius-lg)] bg-[var(--color-surface-elevated)] text-left shadow-[var(--shadow-elev-1)]",
        className,
      )}
    >
      <div className="aspect-[4/3] bg-[var(--color-surface-muted)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt="" className="h-full w-full object-cover" />
      </div>
      <div className="p-3">
        {badge ? (
          <p className="mb-1 text-[12px] font-semibold text-[var(--color-sea)]">
            {badge}
          </p>
        ) : null}
        <h3 className="text-[16px] font-semibold text-[var(--color-text-primary)]">
          {title}
        </h3>
        <p className="mt-0.5 text-[13px] text-[var(--color-text-secondary)]">
          {subtitle}
        </p>
      </div>
    </button>
  );
}

export type ResourceCardProps = {
  name: string;
  availability: string;
  area?: string;
  imageUrl: string;
  onReserve?: () => void;
  onClick?: () => void;
  className?: string;
};

export function ResourceCard({
  name,
  availability,
  area,
  imageUrl,
  onReserve,
  onClick,
  className,
}: ResourceCardProps) {
  return (
    <article
      className={cn(
        "overflow-hidden rounded-[var(--radius-lg)] bg-[var(--color-surface-elevated)] shadow-[var(--shadow-elev-1)]",
        className,
      )}
    >
      <button type="button" className="block w-full text-left" onClick={onClick}>
        <div className="aspect-[16/10] bg-[var(--color-surface-muted)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt="" className="h-full w-full object-cover" />
        </div>
        <div className="p-4">
          <h3 className="text-[18px] font-semibold text-[var(--color-text-primary)]">
            {name}
          </h3>
          <p className="mt-1 text-[15px] text-[var(--color-text-secondary)]">
            Próximo: {availability}
            {area ? ` · ${area}` : ""}
          </p>
        </div>
      </button>
      {onReserve ? (
        <div className="border-t border-[var(--color-border-subtle)] px-4 py-3">
          <Button fullWidth onClick={onReserve}>
            Reservar
          </Button>
        </div>
      ) : null}
    </article>
  );
}

export type RecommendationCardProps = {
  quote: string;
  author: string;
  imageUrl?: string;
  onClick?: () => void;
  className?: string;
};

export function RecommendationCard({
  quote,
  author,
  imageUrl,
  onClick,
  className,
}: RecommendationCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-w-[260px] gap-3 rounded-[var(--radius-lg)] bg-[var(--color-action-accent-subtle)] p-4 text-left",
        className,
      )}
    >
      {imageUrl ? (
        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-[var(--radius-md)] bg-[var(--color-surface-muted)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt="" className="h-full w-full object-cover" />
        </div>
      ) : null}
      <div>
        <p className="text-[12px] font-semibold uppercase tracking-wide text-[var(--color-accent-community)]">
          Consejo de vecinos
        </p>
        <p className="mt-1 text-[15px] leading-5 text-[var(--color-text-primary)]">
          “{quote}”
        </p>
        <p className="mt-2 text-[13px] text-[var(--color-text-secondary)]">
          {author}
        </p>
      </div>
    </button>
  );
}

export type GroupCardProps = {
  name: string;
  members: number;
  imageUrl: string;
  onOpen?: () => void;
  className?: string;
};

export function GroupCard({
  name,
  members,
  imageUrl,
  onOpen,
  className,
}: GroupCardProps) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "overflow-hidden rounded-[var(--radius-lg)] bg-[var(--color-surface-elevated)] text-left shadow-[var(--shadow-elev-1)]",
        className,
      )}
    >
      <div className="aspect-[4/3] bg-[var(--color-surface-muted)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt="" className="h-full w-full object-cover" />
      </div>
      <div className="p-3">
        <h3 className="text-[16px] font-semibold text-[var(--color-text-primary)]">
          {name}
        </h3>
        <p className="text-[13px] text-[var(--color-text-secondary)]">
          {members} miembros
        </p>
      </div>
    </button>
  );
}
