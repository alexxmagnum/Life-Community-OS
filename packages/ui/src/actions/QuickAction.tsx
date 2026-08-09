import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "../lib/cn";

export type QuickActionProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: ReactNode;
  label: string;
};

export function QuickAction({
  icon,
  label,
  className,
  ...props
}: QuickActionProps) {
  return (
    <button
      type="button"
      className={cn(
        "flex min-h-[52px] flex-1 flex-col items-center justify-center gap-1 rounded-[var(--radius-lg)] bg-[var(--color-action-primary-subtle)] px-2 py-3 text-[var(--color-action-primary)] transition-transform duration-[var(--motion-fast)] active:scale-[0.98]",
        className,
      )}
      {...props}
    >
      <span className="text-xl" aria-hidden>
        {icon}
      </span>
      <span className="text-[15px] font-semibold leading-4">{label}</span>
    </button>
  );
}
