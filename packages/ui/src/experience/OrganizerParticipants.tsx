import { Avatar } from "../people/Avatar";
import { cn } from "../lib/cn";

export type OrganizerCardProps = {
  name: string;
  roleLabel?: string;
  avatarUrl?: string;
  className?: string;
};

export function OrganizerCard({
  name,
  roleLabel = "Organizador",
  avatarUrl,
  className,
}: OrganizerCardProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-[var(--radius-lg)] bg-[var(--color-surface-elevated)] p-4 shadow-[var(--shadow-elev-1)]",
        className,
      )}
    >
      <Avatar src={avatarUrl} alt={name} size="lg" />
      <div>
        <p className="text-[14px] font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
          {roleLabel}
        </p>
        <p className="text-[17px] font-semibold text-[var(--color-text-primary)]">
          {name}
        </p>
      </div>
    </div>
  );
}

export type ParticipantListProps = {
  participants: { id: string; name: string; avatarUrl?: string }[];
  totalCount: number;
  className?: string;
};

export function ParticipantList({
  participants,
  totalCount,
  className,
}: ParticipantListProps) {
  const shown = participants.slice(0, 5);
  const extra = Math.max(0, totalCount - shown.length);

  return (
    <div
      className={cn(
        "rounded-[var(--radius-lg)] bg-[var(--color-surface-elevated)] p-4 shadow-[var(--shadow-elev-1)]",
        className,
      )}
    >
      <p className="text-[14px] font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
        Van a ir
      </p>
      <p className="mt-1 text-[17px] font-semibold text-[var(--color-text-primary)]">
        {totalCount} {totalCount === 1 ? "persona" : "personas"}
      </p>
      {shown.length > 0 ? (
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
          <div className="flex items-center">
            {shown.map((p, i) => (
              <span
                key={p.id}
                className="relative"
                style={{ marginLeft: i === 0 ? 0 : -10, zIndex: shown.length - i }}
              >
                <Avatar src={p.avatarUrl} alt={p.name} size="sm" />
              </span>
            ))}
            {extra > 0 ? (
              <span className="ml-2 text-[15px] font-semibold text-[var(--color-text-secondary)]">
                +{extra}
              </span>
            ) : null}
          </div>
          <p className="text-[15px] text-[var(--color-text-secondary)]">
            {shown.map((p) => p.name).join(", ")}
            {extra > 0 ? ` y ${extra} más` : ""}
          </p>
        </div>
      ) : (
        <p className="mt-2 text-[15px] text-[var(--color-text-secondary)]">
          Sé la primera persona en participar
        </p>
      )}
    </div>
  );
}
