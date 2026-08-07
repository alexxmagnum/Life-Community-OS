import { cn } from "../lib/cn";

export type ExperienceHeroProps = {
  imageUrl: string;
  title: string;
  brandOverline?: string;
  className?: string;
};

export function ExperienceHero({
  imageUrl,
  title,
  brandOverline,
  className,
}: ExperienceHeroProps) {
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
        {brandOverline ? (
          <p className="text-[13px] font-semibold tracking-wide text-[var(--color-text-inverse)]/90">
            {brandOverline}
          </p>
        ) : null}
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-[28px] font-semibold leading-8 text-[var(--color-text-inverse)] md:text-[34px] md:leading-10">
          {title}
        </h1>
      </div>
    </section>
  );
}

export type ExperienceMetaProps = {
  when: string;
  location: string;
  areaLabel?: string;
  capacityLabel?: string;
  className?: string;
};

export function ExperienceMeta({
  when,
  location,
  areaLabel,
  capacityLabel,
  className,
}: ExperienceMetaProps) {
  return (
    <dl
      className={cn(
        "grid gap-3 rounded-[var(--radius-lg)] bg-[var(--color-surface-elevated)] p-4 shadow-[var(--shadow-elev-1)] sm:grid-cols-2",
        className,
      )}
    >
      <div>
        <dt className="text-[12px] font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
          When
        </dt>
        <dd className="mt-1 text-[16px] font-semibold text-[var(--color-text-primary)]">
          {when}
        </dd>
      </div>
      <div>
        <dt className="text-[12px] font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
          Where
        </dt>
        <dd className="mt-1 text-[16px] font-semibold text-[var(--color-text-primary)]">
          {location}
          {areaLabel ? (
            <span className="block text-[14px] font-medium text-[var(--color-text-secondary)]">
              {areaLabel}
            </span>
          ) : null}
        </dd>
      </div>
      {capacityLabel ? (
        <div className="sm:col-span-2">
          <dt className="text-[12px] font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
            Spots
          </dt>
          <dd className="mt-1 text-[16px] font-semibold text-[var(--color-text-primary)]">
            {capacityLabel}
          </dd>
        </div>
      ) : null}
    </dl>
  );
}
