import type { ReactNode } from "react";

import { cn } from "../lib/cn";

/**
 * Global mobile experience primitives for Life Community OS tenants.
 * Designed for ~390px first — native app feel, not a compressed website.
 */

export type MobileScreenProps = {
  children: ReactNode;
  /** Full-bleed (e.g. Home hero). Removes horizontal padding on the root. */
  bleed?: boolean;
  className?: string;
};

export function MobileScreen({
  children,
  bleed = false,
  className,
}: MobileScreenProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-[390px] md:max-w-none",
        bleed ? "-mx-4 md:-mx-8" : "",
        className,
      )}
    >
      <div
        className={cn(
          "flex flex-col gap-8 pb-2",
          bleed ? "px-0" : "",
        )}
      >
        {children}
      </div>
    </div>
  );
}

export type ScreenHeaderProps = {
  /** Soft context line (e.g. Life Panoramica) */
  eyebrow?: string;
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
  className?: string;
};

/** Context header — introduction, not a website H1 banner. */
export function ScreenHeader({
  eyebrow,
  title,
  subtitle,
  trailing,
  className,
}: ScreenHeaderProps) {
  return (
    <header className={cn("space-y-2", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {eyebrow ? (
            <p className="text-[13px] font-semibold tracking-wide text-[var(--color-text-tertiary)]">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="font-[family-name:var(--font-display)] text-[26px] font-semibold leading-8 text-[var(--color-text-primary)]">
            {title}
          </h1>
        </div>
        {trailing ? <div className="shrink-0 pt-0.5">{trailing}</div> : null}
      </div>
      {subtitle ? (
        <p className="text-[16px] leading-6 text-[var(--color-text-secondary)]">
          {subtitle}
        </p>
      ) : null}
    </header>
  );
}

export type ScreenBackProps = {
  label?: string;
  onClick: () => void;
  className?: string;
};

export function ScreenBack({
  label = "Volver",
  onClick,
  className,
}: ScreenBackProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex min-h-[44px] items-center text-[15px] font-semibold text-[var(--color-action-primary)]",
        className,
      )}
    >
      ← {label}
    </button>
  );
}

export type FilterChip = {
  id: string;
  label: string;
};

export type FilterChipRowProps = {
  items: FilterChip[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
};

export function FilterChipRow({
  items,
  activeId,
  onChange,
  className,
}: FilterChipRowProps) {
  return (
    <div
      className={cn(
        "-mx-1 flex gap-2 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className,
      )}
    >
      {items.map((item) => {
        const active = item.id === activeId;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className={cn(
              "min-h-[44px] shrink-0 rounded-full px-4 text-[14px] font-semibold transition-colors",
              active
                ? "bg-[var(--color-action-primary-subtle)] text-[var(--color-action-primary)]"
                : "bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)]",
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

export type ScreenSearchProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label?: string;
  className?: string;
};

export function ScreenSearch({
  value,
  onChange,
  placeholder,
  label = "Buscar",
  className,
}: ScreenSearchProps) {
  return (
    <label className={cn("block", className)}>
      <span className="sr-only">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-h-[52px] w-full rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] px-4 text-[16px] text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-tertiary)] focus:ring-2 focus:ring-[var(--color-action-primary)]"
      />
    </label>
  );
}

export type ScreenPrimaryActionProps = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
};

export function ScreenPrimaryAction({
  label,
  onClick,
  disabled,
  className,
}: ScreenPrimaryActionProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex min-h-[56px] w-full items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-action-primary)] text-[16px] font-semibold text-[var(--color-text-inverse)] transition-transform active:scale-[0.99] disabled:opacity-50",
        className,
      )}
    >
      {label}
    </button>
  );
}

export type ExploreLinkProps = {
  label: string;
  hint?: string;
  onClick: () => void;
  className?: string;
};

/** Soft navigation row — progressive disclosure, not a module tile. */
export function ExploreLink({
  label,
  hint,
  onClick,
  className,
}: ExploreLinkProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-h-[56px] w-full items-center justify-between rounded-[var(--radius-lg)] bg-[var(--color-surface-elevated)] px-4 text-left shadow-[var(--shadow-elev-1)] transition-transform active:scale-[0.99]",
        className,
      )}
    >
      <span>
        <span className="block text-[17px] font-semibold text-[var(--color-text-primary)]">
          {label}
        </span>
        {hint ? (
          <span className="mt-0.5 block text-[13px] text-[var(--color-text-secondary)]">
            {hint}
          </span>
        ) : null}
      </span>
      <span className="text-[var(--color-text-tertiary)]" aria-hidden>
        →
      </span>
    </button>
  );
}

export type ContentBlockProps = {
  children: ReactNode;
  className?: string;
};

/** Padded content block inside a bleed screen (e.g. under a hero). */
export function ContentBlock({ children, className }: ContentBlockProps) {
  return (
    <div className={cn("space-y-8 px-4", className)}>{children}</div>
  );
}
