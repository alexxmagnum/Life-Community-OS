"use client";

/**
 * Post-register welcome — guides into JoinCommunityExperience.
 * Account ready → find community (not an empty profile).
 */

import {
  WELCOME_AFTER_REGISTER_BODY,
  WELCOME_AFTER_REGISTER_CTA,
  WELCOME_AFTER_REGISTER_TITLE,
} from "@/lib/membership/first-user-clarity";

export type PostRegisterWelcomeProps = {
  onContinue: () => void;
};

export function PostRegisterWelcome({ onContinue }: PostRegisterWelcomeProps) {
  return (
    <section className="rounded-[18px] border border-[var(--color-border-glass)] bg-[var(--color-surface-elevated)] px-4 py-5 shadow-[var(--shadow-elev-1)]">
      <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
        Registro completado
      </p>
      <h2 className="mt-2 font-[family-name:var(--font-display)] text-[22px] font-semibold text-[var(--color-text-primary)]">
        {WELCOME_AFTER_REGISTER_TITLE}
      </h2>
      <p className="mt-2 text-[14px] leading-snug text-[var(--color-text-secondary)]">
        {WELCOME_AFTER_REGISTER_BODY}
      </p>
      <button
        type="button"
        onClick={onContinue}
        className="ui-press mt-4 min-h-[48px] w-full rounded-full bg-[var(--color-action-primary)] px-4 text-[15px] font-semibold text-white"
      >
        {WELCOME_AFTER_REGISTER_CTA}
      </button>
    </section>
  );
}
