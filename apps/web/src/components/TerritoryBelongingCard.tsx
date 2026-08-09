"use client";

import type { TerritoryAccessContext } from "@life-community-os/tenant-life-panoramica";
import { useRouter } from "next/navigation";

/**
 * Soft belonging strip — residency-aware territory context (D.0.7.2.2).
 * Not a property browser and not an admin panel.
 */
export function TerritoryBelongingCard({
  access,
  compact = false,
}: {
  access: TerritoryAccessContext;
  compact?: boolean;
}) {
  const router = useRouter();
  const toneClass = access.hasVerifiedResidency
    ? "text-[var(--color-success)]"
    : access.home.primary?.statusKind === "pending"
      ? "text-[var(--color-warning)]"
      : "text-[var(--color-action-primary)]";

  return (
    <section
      className="rounded-[var(--radius-lg)] bg-[var(--color-surface-elevated)] p-4 shadow-[var(--shadow-elev-1)]"
      aria-label="Tu lugar en la comunidad"
    >
      <p className="text-[14px] font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
        Tu lugar
      </p>
      <p className={`mt-1 text-[16px] font-semibold ${toneClass}`}>
        {access.belongingHeadline}
      </p>
      {!compact ? (
        <p className="mt-1 text-[15px] leading-5 text-[var(--color-text-secondary)]">
          {access.belongingSummary}
        </p>
      ) : null}

      {!compact && access.insights.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {access.insights.slice(0, 3).map((insight) => {
            const insightTone =
              insight.tone === "ok"
                ? "text-[var(--color-success)]"
                : insight.tone === "pending"
                  ? "text-[var(--color-warning)]"
                  : "text-[var(--color-text-secondary)]";
            return (
              <li key={insight.id}>
                {insight.href ? (
                  <button
                    type="button"
                    onClick={() => router.push(insight.href!)}
                    className="w-full rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] px-3 py-2.5 text-left"
                  >
                    <p className={`text-[15px] font-semibold ${insightTone}`}>
                      {insight.title}
                    </p>
                    <p className="mt-0.5 text-[14px] leading-4 text-[var(--color-text-tertiary)]">
                      {insight.body}
                    </p>
                  </button>
                ) : (
                  <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] px-3 py-2.5">
                    <p className={`text-[15px] font-semibold ${insightTone}`}>
                      {insight.title}
                    </p>
                    <p className="mt-0.5 text-[14px] leading-4 text-[var(--color-text-tertiary)]">
                      {insight.body}
                    </p>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      ) : null}

      {compact ? (
        <button
          type="button"
          className="mt-2 min-h-[40px] text-[15px] font-semibold text-[var(--color-action-primary)]"
          onClick={() => router.push("/me")}
        >
          Ver mi hogar →
        </button>
      ) : null}
    </section>
  );
}
