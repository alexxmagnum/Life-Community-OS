"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FlowScreenHeader, MobileScreen } from "@life-community-os/ui";

export function LoginScreen() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") || "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(
          data.error === "auth_not_configured"
            ? "Auth aún no está configurado en este entorno."
            : "No pudimos iniciar sesión. Revisa email y contraseña.",
        );
        return;
      }
      router.replace(next);
      router.refresh();
    } catch {
      setError("Error de red. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const fieldClass =
    "min-h-[48px] w-full rounded-[14px] border border-[var(--color-border-glass)] bg-[var(--color-surface-glass)] px-3.5 text-[15px] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-action-primary)]";

  return (
    <MobileScreen>
      <FlowScreenHeader
        title="Entrar"
        subtitle="Tu comunidad"
        onBack={() => router.push("/")}
        onExit={() => router.push("/")}
      />
      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <label className="block space-y-1.5">
          <span className="text-[13px] font-medium text-[var(--color-text-secondary)]">
            Email
          </span>
          <input
            className={fieldClass}
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-[13px] font-medium text-[var(--color-text-secondary)]">
            Contraseña
          </span>
          <input
            className={fieldClass}
            type="password"
            autoComplete="current-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error ? (
          <p className="text-[14px] text-[var(--color-danger,#b42318)]">{error}</p>
        ) : null}
        <button
          type="submit"
          disabled={loading}
          className="flex min-h-[48px] w-full items-center justify-center rounded-[14px] bg-[var(--color-action-primary)] px-4 text-[15px] font-semibold text-[var(--color-text-on-action,#fff)] disabled:opacity-60"
        >
          {loading ? "Entrando…" : "Entrar"}
        </button>
        <button
          type="button"
          className="w-full text-center text-[14px] text-[var(--color-text-secondary)]"
          onClick={() => router.push("/register")}
        >
          Crear cuenta
        </button>
      </form>
    </MobileScreen>
  );
}
