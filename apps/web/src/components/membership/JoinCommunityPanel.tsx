"use client";

import { useState, type FormEvent } from "react";
import { RequiredFieldLabel } from "@/components/auth/RequiredFieldLabel";
import {
  acceptInvitationCode,
  joinErrorMessage,
  joinWithCommunityCode,
} from "@/lib/membership/join-community-experience";
import { useCurrentUser } from "@/providers/CurrentUserProvider";
import { useTenant } from "@/providers/TenantProvider";

export type JoinCommunityPanelProps = {
  onJoined?: () => void;
};

export function JoinCommunityPanel({ onJoined }: JoinCommunityPanelProps) {
  const { currentUser, refreshSession } = useCurrentUser();
  const { configuration } = useTenant();
  const [communityCode, setCommunityCode] = useState("");
  const [invitationCode, setInvitationCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!currentUser.authenticated || currentUser.hasMembership) {
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
        ? "Solicitud enviada. Un administrador la revisará pronto."
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
    <section className="rounded-[16px] border border-[var(--color-border-glass)] bg-[var(--color-surface-elevated)] p-4">
      <h2 className="font-[family-name:var(--font-display)] text-[20px] font-semibold text-[var(--color-text-primary)]">
        Únete a tu comunidad
      </h2>
      <p className="mt-1 text-[14px] leading-snug text-[var(--color-text-secondary)]">
        Tu cuenta ya está lista. La pertenencia al territorio es un paso aparte:
        usa un código de comunidad o acepta una invitación cuando quieras.
      </p>

      <form className="mt-4 space-y-3" onSubmit={onSubmitCode}>
        <label className="block space-y-1">
          <RequiredFieldLabel>Código comunidad</RequiredFieldLabel>
          <input
            className={fieldClass}
            value={communityCode}
            onChange={(e) => setCommunityCode(e.target.value)}
            placeholder="Ej. PANORAMICA"
            autoComplete="off"
            required
          />
        </label>
        <button
          type="submit"
          disabled={loading || !communityCode.trim()}
          className="min-h-[48px] w-full rounded-full bg-[var(--color-action-primary)] px-4 text-[14px] font-semibold text-white disabled:opacity-50"
        >
          {loading ? "Enviando…" : "Código comunidad"}
        </button>
      </form>

      <form className="mt-5 space-y-3 border-t border-[var(--color-border-subtle)] pt-4" onSubmit={onSubmitInvitation}>
        <label className="block space-y-1">
          <RequiredFieldLabel>Aceptar invitación</RequiredFieldLabel>
          <input
            className={fieldClass}
            value={invitationCode}
            onChange={(e) => setInvitationCode(e.target.value)}
            placeholder="ID de invitación"
            autoComplete="off"
            required
          />
        </label>
        <button
          type="submit"
          disabled={loading || !invitationCode.trim() || !currentUser.email}
          className="min-h-[48px] w-full rounded-full border border-[var(--color-border-subtle)] bg-[var(--color-surface-muted)] px-4 text-[14px] font-semibold text-[var(--color-text-primary)] disabled:opacity-50"
        >
          Aceptar invitación
        </button>
      </form>

      {error ? (
        <p className="mt-3 text-[13px] text-[var(--color-danger)]">{error}</p>
      ) : null}
      {success ? (
        <p className="mt-3 text-[13px] text-[var(--color-success)]">{success}</p>
      ) : null}
    </section>
  );
}
