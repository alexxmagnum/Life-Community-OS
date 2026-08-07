import type { ReactNode } from "react";

import { Button } from "../actions/Button";
import { cn } from "../lib/cn";

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  className,
}: {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-[var(--radius-xl)] bg-[var(--color-surface-elevated)] px-6 py-12 text-center shadow-[var(--shadow-elev-1)]",
        className,
      )}
    >
      <p className="font-[family-name:var(--font-display)] text-[22px] font-semibold text-[var(--color-text-primary)]">
        {title}
      </p>
      {description ? (
        <p className="mt-2 max-w-sm text-[16px] leading-6 text-[var(--color-text-secondary)]">
          {description}
        </p>
      ) : null}
      {actionLabel && onAction ? (
        <Button className="mt-6" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}

export function LoadingState({
  label = "Cargando…",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={cn("flex flex-col gap-3 p-4", className)}
      role="status"
      aria-live="polite"
    >
      <span className="sr-only">{label}</span>
      <div className="h-40 animate-pulse rounded-[var(--radius-xl)] bg-[var(--color-surface-muted)]" />
      <div className="h-4 w-2/3 animate-pulse rounded bg-[var(--color-surface-muted)]" />
      <div className="h-4 w-1/2 animate-pulse rounded bg-[var(--color-surface-muted)]" />
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  description = "Please try again.",
  onRetry,
  className,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-feedback-danger-subtle)] px-4 py-4",
        className,
      )}
      role="alert"
    >
      <p className="text-[17px] font-semibold text-[var(--color-text-primary)]">
        {title}
      </p>
      <p className="mt-1 text-[15px] text-[var(--color-text-secondary)]">
        {description}
      </p>
      {onRetry ? (
        <Button variant="secondary" className="mt-3" onClick={onRetry}>
          Reintentar
        </Button>
      ) : null}
    </div>
  );
}

export function SectionHeader({
  title,
  action,
  className,
}: {
  title: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-3 flex items-end justify-between gap-3", className)}>
      <h2 className="text-[18px] font-semibold leading-6 text-[var(--color-text-primary)]">
        {title}
      </h2>
      {action}
    </div>
  );
}
