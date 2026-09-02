"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { FlowScreenHeader, MobileScreen } from "@life-community-os/ui";
import { RequiredFieldLabel } from "@/components/auth/RequiredFieldLabel";
import {
  AUTH_EMAIL_INVALID,
  AUTH_NETWORK,
  AUTH_PASSWORD_MISMATCH,
  AUTH_PASSWORD_WEAK,
  isStrongEnoughPassword,
  isValidAuthEmail,
  mapRegisterError,
  passwordsMatch,
} from "@/lib/auth/auth-form-messages";

/**
 * Account creation only — Membership join happens later on /me.
 * Account ≠ Membership. Authentication ≠ Community.
 */
export function RegisterScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
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
    if (!isStrongEnoughPassword(password)) {
      setError(AUTH_PASSWORD_WEAK);
      return;
    }
    if (!passwordsMatch(password, passwordConfirm)) {
      setError(AUTH_PASSWORD_MISMATCH);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json()) as {
        error?: string;
        needsEmailConfirmation?: boolean;
      };
      if (!res.ok) {
        setError(mapRegisterError(data.error));
        return;
      }
      if (data.needsEmailConfirmation) {
        setInfo("Revisa tu email para confirmar la cuenta.");
        return;
      }
      // Session cookies set by API → automatic login → membership join on /me
      router.replace("/me");
      router.refresh();
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
        title="Crear cuenta"
        subtitle="Únete a LIFE y descubre tu comunidad"
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
        <label className="block space-y-1.5">
          <RequiredFieldLabel>Contraseña</RequiredFieldLabel>
          <input
            className={fieldClass}
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <label className="block space-y-1.5">
          <RequiredFieldLabel>Confirmar contraseña</RequiredFieldLabel>
          <input
            className={fieldClass}
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
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
          {loading ? "Creando…" : "Crear cuenta"}
        </button>
      </form>
      <p className="pb-2 text-center text-[14px] leading-5 text-[var(--color-text-tertiary)]">
        ¿Ya tienes cuenta?{" "}
        <button
          type="button"
          className="font-semibold text-[var(--color-action-primary)]"
          onClick={() => router.push("/login")}
        >
          Iniciar sesión
        </button>
      </p>
    </MobileScreen>
  );
}
