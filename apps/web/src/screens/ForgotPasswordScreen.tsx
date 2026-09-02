"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { FlowScreenHeader, MobileScreen } from "@life-community-os/ui";
import { RequiredFieldLabel } from "@/components/auth/RequiredFieldLabel";
import {
  AUTH_EMAIL_INVALID,
  AUTH_NETWORK,
  isValidAuthEmail,
} from "@/lib/auth/auth-form-messages";

/** Thin recovery entry — uses existing auth provider, no parallel auth system. */
export function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setInfo(null);
    if (!isValidAuthEmail(email)) {
      setError(AUTH_EMAIL_INVALID);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(
          data.error === "auth_not_configured"
            ? "La recuperación aún no está disponible."
            : "No pudimos enviar el enlace. Inténtalo de nuevo.",
        );
        return;
      }
      setInfo("Si la cuenta existe, recibirás un email para restablecer la contraseña.");
    } catch {
      setError(AUTH_NETWORK);
    } finally {
      setLoading(false);
    }
  };

  const fieldClass =
    "min-h-[48px] w-full rounded-[14px] border border-[var(--color-border-glass)] bg-[var(--color-surface-glass)] px-3.5 text-[16px] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-action-primary)]";

  return (
    <MobileScreen dense className="gap-5 pb-4">
      <FlowScreenHeader
        title="Recuperar contraseña"
        subtitle="Te enviaremos un enlace a tu email"
        onBack={() => router.push("/login")}
        onExit={() => router.push("/")}
      />
      <form className="space-y-3" onSubmit={onSubmit} noValidate>
        <label className="block space-y-1.5">
          <RequiredFieldLabel>Email</RequiredFieldLabel>
          <input
            className={fieldClass}
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            autoFocus
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        {error ? (
          <p className="text-[14px] text-[var(--color-danger,#b42318)]">{error}</p>
        ) : null}
        {info ? (
          <p className="text-[14px] text-[var(--color-text-secondary)]">{info}</p>
        ) : null}
        <button
          type="submit"
          disabled={loading}
          className="flex min-h-[48px] w-full items-center justify-center rounded-[14px] bg-[var(--color-action-primary)] px-4 text-[15px] font-semibold text-[var(--color-text-on-action,#fff)] disabled:opacity-60"
        >
          {loading ? "Enviando…" : "Enviar enlace"}
        </button>
      </form>
    </MobileScreen>
  );
}
