"use client";

import { useId } from "react";

import { cn } from "../lib/cn";

export type LifeLogoProps = {
  /** Primary wordmark line — rendered as LIFE. */
  primary: string;
  /** Secondary wordmark line — rendered as PANORÁMICA. */
  secondary?: string;
  /** Optional click target wrapping the whole mark. */
  onClick?: () => void;
  /** Accessible name when interactive. */
  label?: string;
  /**
   * Header density — fits logo + weather + actions on ~360–430px
   * without truncating LIFE / PANORÁMICA.
   */
  compact?: boolean;
  className?: string;
};

/**
 * Life Panorámica brand mark — Motans geometric symbol + spaced wordmark.
 */
export function LifeLogo({
  primary,
  secondary,
  onClick,
  label,
  compact = false,
  className,
}: LifeLogoProps) {
  const content = (
    <>
      <LifeLogoSymbol
        className={cn(
          "life-logo__symbol shrink-0",
          compact ? "h-9 w-9" : "h-12 w-12",
        )}
      />
      <span className="min-w-0 shrink">
        <span
          className={cn(
            "life-logo__name block font-[family-name:var(--font-brand),Montserrat,Inter,sans-serif] font-normal uppercase leading-none text-[#F7FAFA]",
            compact
              ? "text-[20px] tracking-[0.22em]"
              : "text-[28px] tracking-[0.25em]",
          )}
        >
          {primary}
        </span>
        {secondary ? (
          <span
            className={cn(
              "life-logo__location block font-[family-name:var(--font-brand),Montserrat,Inter,sans-serif] font-semibold uppercase leading-none text-[#F7FAFA]",
              compact
                ? "mt-1.5 text-[9px] tracking-[0.16em]"
                : "mt-[7px] text-[11px] tracking-[0.18em]",
            )}
          >
            {secondary}
          </span>
        ) : null}
      </span>
    </>
  );

  const shellClass = cn(
    "life-logo flex shrink-0 items-center",
    compact ? "h-[48px] gap-2.5" : "h-[60px] gap-[14px]",
    className,
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(shellClass, "text-left active:opacity-80")}
        aria-label={label ?? [primary, secondary].filter(Boolean).join(" ")}
      >
        {content}
      </button>
    );
  }

  return <p className={shellClass}>{content}</p>;
}

export type LifeLogoSymbolProps = {
  className?: string;
  title?: string;
};

/** Open geometric circle — thin Motans stroke, no fill. */
export function LifeLogoSymbol({ className, title }: LifeLogoSymbolProps) {
  const uid = useId().replace(/:/g, "");
  const gradId = `life-motans-${uid}`;

  return (
    <svg
      className={cn(className)}
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
    >
      {title ? <title>{title}</title> : null}
      <defs>
        <linearGradient
          id={gradId}
          x1="6"
          y1="6"
          x2="42"
          y2="42"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#00D8E8" />
          <stop offset="52%" stopColor="#00C8B4" />
          <stop offset="100%" stopColor="#B7F22A" />
        </linearGradient>
      </defs>
      <path
        d="M34.8 9.6A17.2 17.2 0 1 0 40.4 28.4"
        stroke={`url(#${gradId})`}
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M14.2 20.4c3.4-4.2 7.1-6.3 11.6-6.3 2.8 0 5.3 0.8 7.6 2.4"
        stroke={`url(#${gradId})`}
        strokeWidth="1.35"
        strokeLinecap="round"
      />
      <path
        d="M16.4 26.6c2.7-3.2 5.7-4.8 9.4-4.8 2.2 0 4.2 0.6 6 1.8"
        stroke={`url(#${gradId})`}
        strokeWidth="1.25"
        strokeLinecap="round"
        opacity="0.92"
      />
      <path
        d="M19.2 32.2c1.9-2.1 4-3.1 6.6-3.1 1.5 0 2.9 0.35 4.1 1.05"
        stroke={`url(#${gradId})`}
        strokeWidth="1.15"
        strokeLinecap="round"
        opacity="0.82"
      />
    </svg>
  );
}
