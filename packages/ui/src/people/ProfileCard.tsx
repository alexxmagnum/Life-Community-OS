import type { ReactNode } from "react";

import { Avatar } from "./Avatar";
import { Button } from "../actions/Button";
import { cn } from "../lib/cn";

export type ProfileCardProps = {
  name: string;
  membershipLabel: string;
  areaLabel?: string;
  interests?: string[];
  avatarUrl?: string;
  onEdit?: () => void;
  className?: string;
  children?: ReactNode;
};

export function ProfileCard({
  name,
  membershipLabel,
  areaLabel,
  interests = [],
  avatarUrl,
  onEdit,
  className,
  children,
}: ProfileCardProps) {
  return (
    <section
      className={cn(
        "flex flex-col items-center rounded-[var(--radius-xl)] bg-[var(--color-surface-elevated)] px-6 py-8 text-center shadow-[var(--shadow-elev-1)]",
        className,
      )}
    >
      <Avatar src={avatarUrl} alt={name} size="xl" />
      <h1 className="mt-4 font-[family-name:var(--font-display)] text-[22px] font-semibold leading-7 text-[var(--color-text-primary)]">
        {name}
      </h1>
      <p className="mt-1 text-[15px] font-medium text-[var(--color-text-secondary)]">
        {membershipLabel}
      </p>
      {(areaLabel || interests.length > 0) && (
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {areaLabel ? (
            <span className="rounded-[var(--radius-sm)] bg-[var(--color-action-primary-subtle)] px-3 py-1 text-[15px] font-semibold text-[var(--color-action-primary)]">
              {areaLabel}
            </span>
          ) : null}
          {interests.map((interest) => (
            <span
              key={interest}
              className="rounded-[var(--radius-sm)] bg-[var(--color-surface-muted)] px-3 py-1 text-[15px] font-medium text-[var(--color-text-secondary)]"
            >
              {interest}
            </span>
          ))}
        </div>
      )}
      {onEdit ? (
        <Button variant="secondary" className="mt-5" onClick={onEdit}>
          Editar perfil
        </Button>
      ) : null}
      {children}
    </section>
  );
}
