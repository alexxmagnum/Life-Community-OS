"use client";

import type { TerritoryLocalLifeContext } from "@life-community-os/tenant-life-panoramica";
import { useRouter } from "next/navigation";

/**
 * Territory-connected local life rails (D.0.7.2.3).
 * "What can help me here?" — not a directory or marketplace.
 */
export function TerritoryLocalLifeSection({
  localLife,
}: {
  localLife: TerritoryLocalLifeContext;
}) {
  const router = useRouter();

  if (localLife.groups.length === 0 && localLife.highlights.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4" aria-label="Vida local del territorio">
      <div>
        <h2 className="font-[family-name:var(--font-display)] text-[20px] font-semibold text-[var(--color-text-primary)]">
          Qué puede ayudarte aquí
        </h2>
        <p className="mt-1 text-[13px] leading-5 text-[var(--color-text-tertiary)]">
          {localLife.belongingLine}
        </p>
      </div>

      {localLife.highlights.length > 0 ? (
        <div className="space-y-2">
          {localLife.highlights.map((item) => (
            <button
              key={item.entity.id}
              type="button"
              onClick={() => router.push(item.href)}
              className="flex w-full items-start gap-3 rounded-[var(--radius-lg)] bg-[var(--color-surface-elevated)] px-4 py-3.5 text-left shadow-[var(--shadow-elev-1)]"
            >
              <span
                className="mt-0.5 h-12 w-12 shrink-0 overflow-hidden rounded-[12px] bg-[var(--color-surface-muted)] bg-cover bg-center"
                style={{ backgroundImage: `url(${item.entity.imageUrl})` }}
                aria-hidden
              />
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-[15px] font-semibold text-[var(--color-text-primary)]">
                    {item.entity.name}
                  </span>
                  {item.inYourArea ? (
                    <span className="rounded-full bg-[var(--color-action-primary-subtle)] px-2 py-0.5 text-[11px] font-semibold text-[var(--color-action-primary)]">
                      Tu zona
                    </span>
                  ) : null}
                </span>
                <span className="mt-0.5 block text-[13px] text-[var(--color-text-secondary)]">
                  {item.entity.categoryLabel} · {item.entity.areaLabel}
                </span>
              </span>
            </button>
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {localLife.groups.map((group) => (
          <button
            key={group.id}
            type="button"
            onClick={() => router.push(group.href)}
            className="min-h-[44px] rounded-full bg-[var(--color-surface-muted)] px-4 text-[13px] font-semibold text-[var(--color-text-secondary)]"
          >
            {group.title}
          </button>
        ))}
      </div>
    </section>
  );
}
