"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

import { Button } from "../actions/Button";
import { cn } from "../lib/cn";
import { ZoomableImage } from "../media/MediaLightbox";

export type ParticipationStatusVariant =
  | "available"
  | "joined"
  | "waitlisted"
  | "full"
  | "cancelled"
  | "expired";

const statusCopy: Record<
  ParticipationStatusVariant,
  { label: string; tone: string }
> = {
  available: {
    label: "Abierto a participar",
    tone: "bg-[var(--color-action-primary-subtle)] text-[var(--color-action-primary)]",
  },
  joined: {
    label: "Vas a ir",
    tone: "bg-[var(--color-feedback-success-subtle)] text-[var(--color-feedback-success)]",
  },
  waitlisted: {
    label: "En lista de espera",
    tone: "bg-[var(--color-feedback-warning-subtle)] text-[var(--color-feedback-warning)]",
  },
  full: {
    label: "Completo",
    tone: "bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]",
  },
  cancelled: {
    label: "Cancelado",
    tone: "bg-[var(--color-feedback-danger-subtle)] text-[var(--color-feedback-danger)]",
  },
  expired: {
    label: "Finalizado",
    tone: "bg-[var(--color-surface-muted)] text-[var(--color-text-tertiary)]",
  },
};

export function ParticipationStatus({
  status,
  className,
}: {
  status: ParticipationStatusVariant;
  className?: string;
}) {
  const copy = statusCopy[status];
  return (
    <span
      className={cn(
        "inline-flex min-h-[32px] items-center rounded-full px-3 text-[15px] font-semibold",
        copy.tone,
        className,
      )}
    >
      {copy.label}
    </span>
  );
}

export type JoinButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  status: ParticipationStatusVariant;
  canJoin: boolean;
};

export function JoinButton({
  status,
  canJoin,
  className,
  ...props
}: JoinButtonProps) {
  if (status === "joined") {
    return (
      <Button variant="secondary" fullWidth className={className} disabled {...props}>
        Vas a ir
      </Button>
    );
  }
  if (status === "waitlisted") {
    return (
      <Button variant="secondary" fullWidth className={className} disabled {...props}>
        En lista de espera
      </Button>
    );
  }
  if (status === "full") {
    return (
      <Button
        variant="secondary"
        fullWidth
        className={className}
        disabled={!canJoin}
        {...props}
      >
        {canJoin ? "Apuntarme a la espera" : "Completo"}
      </Button>
    );
  }
  if (status === "cancelled" || status === "expired") {
    return (
      <Button variant="secondary" fullWidth className={className} disabled>
        {status === "cancelled" ? "Cancelado" : "Ya no disponible"}
      </Button>
    );
  }
  return (
    <Button
      fullWidth
      className={className}
      disabled={!canJoin}
      {...props}
    >
      Participar
    </Button>
  );
}

export type CalendarEventCardProps = {
  time: string;
  title: string;
  place: string;
  statusLabel: string;
  imageUrl?: string;
  kind?: "experience" | "reservation" | "other";
  onClick?: () => void;
  className?: string;
  trailing?: ReactNode;
};

export function CalendarEventCard({
  time,
  title,
  place,
  statusLabel,
  imageUrl,
  kind = "experience",
  onClick,
  className,
  trailing,
}: CalendarEventCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-h-[56px] w-full items-center gap-3 rounded-[var(--radius-lg)] bg-[var(--color-surface-elevated)] p-4 text-left shadow-[var(--shadow-elev-1)] transition-transform active:scale-[0.99]",
        className,
      )}
    >
      <span
        className={cn(
          "h-2.5 w-2.5 shrink-0 rounded-full",
          kind === "reservation"
            ? "bg-[var(--color-sea)]"
            : "bg-[var(--color-action-primary)]",
        )}
        aria-hidden
      />
      {imageUrl ? (
        <ZoomableImage
          src={imageUrl}
          alt=""
          className="rounded-[var(--radius-sm)]"
          wrapperClassName="h-10 w-10 shrink-0"
        />
      ) : null}
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-semibold text-[var(--color-text-secondary)]">
          {time}
        </span>
        <span className="block truncate text-[16px] font-semibold text-[var(--color-text-primary)]">
          {title}
        </span>
        <span className="block text-[15px] text-[var(--color-text-tertiary)]">
          {place} · {statusLabel}
        </span>
      </span>
      {trailing}
    </button>
  );
}
