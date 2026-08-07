import { Button } from "../actions/Button";
import { cn } from "../lib/cn";

export type ResourceHeroProps = {
  imageUrl: string;
  name: string;
  overline?: string;
  className?: string;
};

export function ResourceHero({
  imageUrl,
  name,
  overline,
  className,
}: ResourceHeroProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-[var(--radius-xl)] shadow-[var(--shadow-elev-1)]",
        className,
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt=""
        className="aspect-[5/4] w-full object-cover md:aspect-[21/9]"
      />
      <div
        className="absolute inset-0 flex flex-col justify-end p-5 md:p-8"
        style={{
          background: "linear-gradient(transparent 35%, var(--color-hero-scrim))",
        }}
      >
        {overline ? (
          <p className="text-[13px] font-semibold tracking-wide text-[var(--color-text-inverse)]/90">
            {overline}
          </p>
        ) : null}
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-[28px] font-semibold leading-8 text-[var(--color-text-inverse)] md:text-[34px]">
          {name}
        </h1>
      </div>
    </section>
  );
}

export type AvailabilityPickerProps = {
  dates: { value: string; label: string }[];
  selected: string;
  onSelect: (date: string) => void;
  className?: string;
};

export function AvailabilityPicker({
  dates,
  selected,
  onSelect,
  className,
}: AvailabilityPickerProps) {
  return (
    <div className={cn("-mx-1 flex gap-2 overflow-x-auto px-1 pb-1", className)}>
      {dates.map((d) => {
        const active = d.value === selected;
        return (
          <button
            key={d.value}
            type="button"
            onClick={() => onSelect(d.value)}
            className={cn(
              "min-h-[52px] min-w-[108px] shrink-0 rounded-[var(--radius-lg)] px-3 py-2 text-left text-[13px] font-semibold",
              active
                ? "bg-[var(--color-action-primary)] text-[var(--color-text-inverse)]"
                : "bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] shadow-[var(--shadow-elev-1)]",
            )}
          >
            {d.label}
          </button>
        );
      })}
    </div>
  );
}

export type TimeSlotSelectorProps = {
  slots: {
    id: string;
    start: string;
    end: string;
    status: "available" | "occupied";
  }[];
  selectedId?: string | null;
  onSelect: (slotId: string) => void;
  className?: string;
};

export function TimeSlotSelector({
  slots,
  selectedId,
  onSelect,
  className,
}: TimeSlotSelectorProps) {
  if (slots.length === 0) {
    return (
      <p className="text-[15px] text-[var(--color-text-secondary)]">
        No hay huecos este día.
      </p>
    );
  }

  return (
    <div className={cn("grid grid-cols-2 gap-2 sm:grid-cols-3", className)}>
      {slots.map((slot) => {
        const occupied = slot.status === "occupied";
        const selected = selectedId === slot.id;
        return (
          <button
            key={slot.id}
            type="button"
            disabled={occupied}
            onClick={() => onSelect(slot.id)}
            className={cn(
              "min-h-[52px] rounded-[var(--radius-md)] px-3 text-[14px] font-semibold transition-transform active:scale-[0.98]",
              occupied &&
                "cursor-not-allowed bg-[var(--color-surface-muted)] text-[var(--color-text-tertiary)] line-through",
              !occupied &&
                !selected &&
                "bg-[var(--color-surface-elevated)] text-[var(--color-text-primary)] shadow-[var(--shadow-elev-1)]",
              selected &&
                "bg-[var(--color-action-primary-subtle)] text-[var(--color-action-primary)] ring-2 ring-[var(--color-action-primary)]",
            )}
          >
            {slot.start}–{slot.end}
            {occupied ? (
              <span className="mt-0.5 block text-[11px] font-medium no-underline">
                Ocupado
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export type ReservationStatusVariant =
  | "available"
  | "reserved"
  | "pending"
  | "cancelled"
  | "expired";

const statusStyles: Record<
  ReservationStatusVariant,
  { label: string; className: string }
> = {
  available: {
    label: "Disponible",
    className:
      "bg-[var(--color-action-primary-subtle)] text-[var(--color-action-primary)]",
  },
  reserved: {
    label: "Reservado",
    className:
      "bg-[var(--color-feedback-success-subtle)] text-[var(--color-feedback-success)]",
  },
  pending: {
    label: "Pendiente",
    className:
      "bg-[var(--color-feedback-warning-subtle)] text-[var(--color-feedback-warning)]",
  },
  cancelled: {
    label: "Cancelado",
    className:
      "bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]",
  },
  expired: {
    label: "Pasado",
    className:
      "bg-[var(--color-surface-muted)] text-[var(--color-text-tertiary)]",
  },
};

export function ReservationStatusBadge({
  status,
  className,
}: {
  status: ReservationStatusVariant;
  className?: string;
}) {
  const s = statusStyles[status];
  return (
    <span
      className={cn(
        "inline-flex min-h-[32px] items-center rounded-full px-3 text-[13px] font-semibold",
        s.className,
        className,
      )}
    >
      {s.label}
    </span>
  );
}

export type ReservationSummaryProps = {
  resourceName: string;
  imageUrl?: string;
  dateLabel: string;
  timeLabel: string;
  location: string;
  status?: ReservationStatusVariant;
  className?: string;
};

export function ReservationSummary({
  resourceName,
  imageUrl,
  dateLabel,
  timeLabel,
  location,
  status,
  className,
}: ReservationSummaryProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-[var(--radius-xl)] bg-[var(--color-surface-elevated)] shadow-[var(--shadow-elev-1)]",
        className,
      )}
    >
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt=""
          className="aspect-[16/9] w-full object-cover"
        />
      ) : null}
      <div className="space-y-3 p-5">
        {status ? <ReservationStatusBadge status={status} /> : null}
        <h2 className="font-[family-name:var(--font-display)] text-[24px] font-semibold leading-7">
          {resourceName}
        </h2>
        <dl className="grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-[12px] font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
              When
            </dt>
            <dd className="mt-1 text-[16px] font-semibold">
              {dateLabel}
              <span className="block text-[15px] font-medium text-[var(--color-text-secondary)]">
                {timeLabel}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-[12px] font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
              Where
            </dt>
            <dd className="mt-1 text-[16px] font-semibold">{location}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

export type CalendarReservationCardProps = {
  time: string;
  title: string;
  place: string;
  statusLabel: string;
  imageUrl?: string;
  onClick?: () => void;
  className?: string;
};

export function CalendarReservationCard({
  time,
  title,
  place,
  statusLabel,
  imageUrl,
  onClick,
  className,
}: CalendarReservationCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-h-[56px] w-full items-center gap-3 rounded-[var(--radius-lg)] bg-[var(--color-surface-elevated)] p-4 text-left shadow-[var(--shadow-elev-1)]",
        className,
      )}
    >
      <span
        className="h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--color-sea)]"
        aria-hidden
      />
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt=""
          className="h-10 w-10 rounded-[var(--radius-sm)] object-cover"
        />
      ) : null}
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-semibold text-[var(--color-text-secondary)]">
          {time}
        </span>
        <span className="block truncate text-[16px] font-semibold">
          {title}
        </span>
        <span className="block text-[13px] text-[var(--color-text-tertiary)]">
          {place} · {statusLabel}
        </span>
      </span>
    </button>
  );
}

/** Enhanced discovery card with optional description line. */
export type ResourceDiscoveryCardProps = {
  name: string;
  availability: string;
  area?: string;
  description?: string;
  imageUrl: string;
  onReserve?: () => void;
  onClick?: () => void;
  className?: string;
};

export function ResourceDiscoveryCard({
  name,
  availability,
  area,
  description,
  imageUrl,
  onReserve,
  onClick,
  className,
}: ResourceDiscoveryCardProps) {
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
          {description ? (
            <p className="mt-1 line-clamp-2 text-[14px] leading-5 text-[var(--color-text-secondary)]">
              {description}
            </p>
          ) : null}
          <p className="mt-2 text-[15px] font-medium text-[var(--color-action-primary)]">
            Próximo: {availability}
            {area ? (
              <span className="font-normal text-[var(--color-text-tertiary)]">
                {" "}
                · {area}
              </span>
            ) : null}
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
