import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "../lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "accent" | "destructive";

const variants: Record<Variant, string> = {
  primary:
    "bg-[var(--color-action-primary)] text-[var(--color-text-inverse)] hover:bg-[var(--color-action-primary-hover)]",
  secondary:
    "bg-[var(--color-action-primary-subtle)] text-[var(--color-action-primary)]",
  ghost: "bg-transparent text-[var(--color-text-primary)]",
  accent:
    "bg-[var(--color-action-accent)] text-[var(--color-text-inverse)]",
  destructive:
    "bg-[var(--color-action-destructive)] text-[var(--color-text-inverse)]",
};

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  fullWidth?: boolean;
  children: ReactNode;
};

export function Button({
  variant = "primary",
  fullWidth,
  className,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex min-h-[48px] items-center justify-center rounded-[var(--radius-md)] px-5 text-[16px] font-semibold leading-5 transition-transform duration-[var(--motion-fast)] active:scale-[0.98] disabled:opacity-50",
        variants[variant],
        fullWidth && "w-full",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
