"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { FlowScreenHeader, MobileScreen } from "@life-community-os/ui";

export function RegisterScreen() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [communityCode, setCommunityCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, displayName }),
      });
      const data = (await res.json()) as {
        error?: string;
        needsEmailConfirmation?: boolean;
      };
      if (!res.ok) {
        setError(
          data.error === "auth_not_configured"
            ? "El registro aún no está disponible. Prueba unirte desde Perfil."
            : "No pudimos crear la cuenta. Revisa los datos e inténtalo de nuevo.",
        );
        return;
      }
      if (data.needsEmailConfirmation) {
        setInfo("Revisa tu email para confirmar la cuenta.");
        return;
      }
      if (communityCode.trim()) {
        await fetch("/api/auth/community-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: communityCode.trim() }),
        });
      }
      router.replace("/");
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
        title="Crear cuenta"
        subtitle="Únete a tu comunidad"
        onBack={() => router.push("/login")}
        onExit={() => router.push("/")}
      />
      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <label className="block space-y-1.5">
          <span className="text-[13px] font-medium text-[var(--color-text-secondary)]">
            Nombre
          </span>
          <input
            className={fieldClass}
            type="text"
            autoComplete="name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </label>
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
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-[13px] font-medium text-[var(--color-text-secondary)]">
            Código de comunidad (opcional)
          </span>
          <input
            className={fieldClass}
            type="text"
            placeholder="Ej. PANORAMICA"
            value={communityCode}
            onChange={(e) => setCommunityCode(e.target.value)}
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
      <p className="mt-4 text-[13px] text-[var(--color-text-tertiary)]">
        ¿Ya tienes cuenta? Inicia sesión y únete desde tu perfil.
      </p>
    </MobileScreen>
  );
}
