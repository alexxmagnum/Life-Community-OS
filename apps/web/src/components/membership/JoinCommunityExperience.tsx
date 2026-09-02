"use client";

/**
 * JoinCommunityExperience — single visual entry for community belonging.
 * Account ≠ Membership. Code and invitation share one experience.
 */

import { useState, type FormEvent } from "react";
import { RequiredFieldLabel } from "@/components/auth/RequiredFieldLabel";
import {
  JOIN_CODE_CTA,
  JOIN_CODE_HINT,
  JOIN_CODE_LABEL,
  JOIN_EXPERIENCE_BODY,
  JOIN_EXPERIENCE_TITLE,
  JOIN_INVITE_CTA,
  JOIN_INVITE_LABEL,
} from "@/lib/membership/first-user-clarity";
import {
  acceptInvitationCode,
  joinErrorMessage,
  joinWithCommunityCode,
} from "@/lib/membership/join-community-experience";
import { useCurrentUser } from "@/providers/CurrentUserProvider";
import { useTenant } from "@/providers/TenantProvider";

export type JoinCommunityExperienceProps = {
  onJoined?: () => void;
  /** When true, show the full join entry even if still useful under pending. */
  forceShow?: boolean;
};

export function JoinCommunityExperience({
  onJoined,
  forceShow = false,
}: JoinCommunityExperienceProps) {
  const { currentUser, refreshSession } = useCurrentUser();
  const { configuration } = useTenant();
  const [mode, setMode] = useState<"code" | "invite">("code");
  const [communityCode, setCommunityCode] = useState("");
  const [invitationCode, setInvitationCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (
    !forceShow &&
    (!currentUser.authenticated || currentUser.hasMembership)
  ) {
    return null;
  }

  const fieldClass =
    "min-h-[48px] w-full rounded-[12px] border border-[var(--color-border-glass)] bg-[var(--color-surface-glass)] px-3 text-[16px] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-action-primary)]";

  const onSubmitCode = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    const result = await joinWithCommunityCode({
      code: communityCode,
      tenantId: configuration.tenantId,
    });
    setLoading(false);
    if (!result.ok) {
      setError(joinErrorMessage(result.error));
      return;
    }
    await refreshSession();
    setSuccess(
      result.status === "pending"
        ? "Solicitud enviada. Estamos esperando la activación de tu acceso."
        : "¡Bienvenido! Ya formas parte de la comunidad.",
    );
    onJoined?.();
  };

  const onSubmitInvitation = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    const result = await acceptInvitationCode({
      invitationId: invitationCode,
      email: currentUser.email ?? "",
      tenantId: configuration.tenantId,
    });
    setLoading(false);
    if (!result.ok) {
      setError(joinErrorMessage(result.error));
      return;
    }
    await refreshSession();
    setSuccess("Invitación aceptada. Ya puedes participar en la comunidad.");
    onJoined?.();
  };

  return (
    <section
      id="join"
      className="rounded-[16px] border border-[var(--color-border-glass)] bg-[var(--color-surface-elevated)] p-4"
    >
      <h2 className="font-[family-name:var(--font-display)] text-[20px] font-semibold text-[var(--color-text-primary)]">
        {JOIN_EXPERIENCE_TITLE}
      </h2>
      <p className="mt-1 text-[14px] leading-snug text-[var(--color-text-secondary)]">
        {JOIN_EXPERIENCE_BODY}
      </p>

      <div className="mt-4 flex gap-2 rounded-full bg-[var(--color-surface-muted)] p-1">
        <button
          type="button"
          onClick={() => setMode("code")}
          className={
            mode === "code"
              ? "min-h-[40px] flex-1 rounded-full bg-[var(--color-action-primary)] px-3 text-[13px] font-semibold text-white"
              : "min-h-[40px] flex-1 rounded-full px-3 text-[13px] font-semibold text-[var(--color-text-secondary)]"
          }
        >
          {JOIN_CODE_LABEL}
        </button>
        <button
          type="button"
          onClick={() => setMode("invite")}
          className={
            mode === "invite"
              ? "min-h-[40px] flex-1 rounded-full bg-[var(--color-action-primary)] px-3 text-[13px] font-semibold text-white"
              : "min-h-[40px] flex-1 rounded-full px-3 text-[13px] font-semibold text-[var(--color-text-secondary)]"
          }
        >
          {JOIN_INVITE_LABEL}
        </button>
      </div>

      {mode === "code" ? (
        <form className="mt-4 space-y-3" onSubmit={onSubmitCode}>
          <label className="block space-y-1">
            <RequiredFieldLabel>{JOIN_CODE_LABEL}</RequiredFieldLabel>
            <input
              className={fieldClass}
              value={communityCode}
              onChange={(e) => setCommunityCode(e.target.value)}
              placeholder="Ej. PANORAMICA"
              autoComplete="off"
              required
            />
          </label>
          <p className="text-[12px] leading-4 text-[var(--color-text-tertiary)]">
            {JOIN_CODE_HINT}
          </p>
          <button
            type="submit"
            disabled={loading || !communityCode.trim()}
            className="min-h-[48px] w-full rounded-full bg-[var(--color-action-primary)] px-4 text-[14px] font-semibold text-white disabled:opacity-50"
          >
            {loading ? "Enviando…" : JOIN_CODE_CTA}
          </button>
        </form>
      ) : (
        <form className="mt-4 space-y-3" onSubmit={onSubmitInvitation}>
          <label className="block space-y-1">
            <RequiredFieldLabel>{JOIN_INVITE_LABEL}</RequiredFieldLabel>
            <input
              className={fieldClass}
              value={invitationCode}
              onChange={(e) => setInvitationCode(e.target.value)}
              placeholder="Código de invitación"
              autoComplete="off"
              required
            />
          </label>
          <button
            type="submit"
            disabled={loading || !invitationCode.trim() || !currentUser.email}
            className="min-h-[48px] w-full rounded-full border border-[var(--color-border-subtle)] bg-[var(--color-surface-muted)] px-4 text-[14px] font-semibold text-[var(--color-text-primary)] disabled:opacity-50"
          >
            {loading ? "Enviando…" : JOIN_INVITE_CTA}
          </button>
        </form>
      )}

      {error ? (
        <p className="mt-3 text-[13px] text-[var(--color-danger)]">{error}</p>
      ) : null}
      {success ? (
        <p className="mt-3 text-[13px] text-[var(--color-success)]">{success}</p>
      ) : null}
    </section>
  );
}
