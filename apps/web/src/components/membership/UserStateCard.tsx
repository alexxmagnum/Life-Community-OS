"use client";

/**
 * Canonical user-state card — progressive Account vs Membership clarity.
 */

import { useRouter } from "next/navigation";
import type { CanonicalUserStateView } from "@/lib/membership/first-user-clarity";

export type UserStateCardProps = {
  view: CanonicalUserStateView;
  /** Hide next-action button when join UI is already on the same screen. */
  showAction?: boolean;
};

export function UserStateCard({ view, showAction = true }: UserStateCardProps) {
  const router = useRouter();
  if (view.state === "active_member") {
    return null;
  }

  return (
    <section className="rounded-[16px] border border-[var(--color-border-glass)] bg-[var(--color-surface-elevated)] px-4 py-4 shadow-[var(--shadow-elev-1)]">
      <p className="font-[family-name:var(--font-display)] text-[18px] font-semibold text-[var(--color-text-primary)]">
        {view.title}
      </p>
      <p className="mt-1 text-[14px] leading-snug text-[var(--color-text-secondary)]">
        {view.explanation}
      </p>
      {showAction ? (
        <button
          type="button"
          onClick={() => {
            const href = view.nextActionHref.split("#")[0] || view.nextActionHref;
            router.push(href);
            if (view.nextActionHref.includes("#join")) {
              requestAnimationFrame(() => {
                document.getElementById("join")?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });
              });
            }
          }}
          className="ui-press mt-3 min-h-[44px] w-full rounded-full bg-[var(--color-action-primary)] px-4 text-[14px] font-semibold text-white"
        >
          {view.nextActionLabel}
        </button>
      ) : null}
    </section>
  );
}
