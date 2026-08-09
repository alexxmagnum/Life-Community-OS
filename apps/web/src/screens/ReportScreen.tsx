"use client";

import { useState } from "react";
import {
  Button,
  MobileScreen,
  FlowScreenHeader,
} from "@life-community-os/ui";
import { useRouter } from "next/navigation";

const REPORT_STORAGE_KEY = "lcos:last-incident-report";

type StoredReport = {
  where: string;
  description: string;
  submittedAt: string;
  trackingCode: string;
  photoName?: string;
};

/**
 * Incident report — create → submit → confirmation → tracking.
 * Demo persistence in sessionStorage until backend incidents exist.
 */
export function ReportScreen() {
  const router = useRouter();
  const [where, setWhere] = useState("Zona norte");
  const [description, setDescription] = useState("");
  const [photoName, setPhotoName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<StoredReport | null>(null);

  const goBack = () => router.back();
  const exitFlow = () => router.push("/");

  const onSubmit = () => {
    const trimmed = description.trim();
    if (trimmed.length < 4) {
      setError("Cuéntanos qué ha pasado con un poco más de detalle.");
      return;
    }
    const trackingCode = `AV-${Date.now().toString(36).toUpperCase().slice(-6)}`;
    const payload: StoredReport = {
      where,
      description: trimmed,
      submittedAt: new Date().toISOString(),
      trackingCode,
      photoName: photoName ?? undefined,
    };
    try {
      sessionStorage.setItem(REPORT_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      /* session may be unavailable — still confirm to the user */
    }
    setError(null);
    setSubmitted(payload);
  };

  if (submitted) {
    return (
      <MobileScreen>
        <FlowScreenHeader
          title="Aviso enviado"
          subtitle="Queda registrado. Puedes seguir el código de seguimiento."
          onBack={exitFlow}
          onExit={exitFlow}
        />
        <div className="space-y-3 rounded-[16px] bg-[var(--color-surface-elevated)] p-4 shadow-[var(--shadow-elev-1)]">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
              Seguimiento
            </p>
            <p className="mt-1 font-mono text-[18px] font-semibold text-[var(--color-action-primary)]">
              {submitted.trackingCode}
            </p>
            <p className="mt-1 text-[13px] text-[var(--color-text-secondary)]">
              Estado · Recibido
            </p>
          </div>
          <div className="border-t border-[var(--color-border-subtle)] pt-3">
            <p className="text-[15px] font-semibold text-[var(--color-text-primary)]">
              Resumen
            </p>
            <p className="mt-2 text-[15px] text-[var(--color-text-secondary)]">
              <span className="font-semibold text-[var(--color-text-primary)]">
                Dónde ·{" "}
              </span>
              {submitted.where}
            </p>
            <p className="mt-2 text-[15px] leading-6 text-[var(--color-text-secondary)]">
              {submitted.description}
            </p>
            {submitted.photoName ? (
              <p className="mt-2 text-[13px] text-[var(--color-text-tertiary)]">
                Foto adjunta · {submitted.photoName}
              </p>
            ) : null}
          </div>
        </div>
        <Button fullWidth type="button" onClick={exitFlow}>
          Volver al inicio
        </Button>
        <Button
          fullWidth
          variant="ghost"
          type="button"
          onClick={() => router.push("/community")}
        >
          Ir a Comunidad
        </Button>
      </MobileScreen>
    );
  }

  return (
    <MobileScreen>
      <FlowScreenHeader
        title="Avisar de un problema"
        subtitle="Cuéntanos qué ocurre. Te confirmaremos cuando quede registrado."
        onBack={goBack}
        onExit={exitFlow}
      />

      <label className="flex aspect-[4/3] cursor-pointer flex-col items-center justify-center rounded-[var(--radius-xl)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface-muted)] px-6 text-center">
        <span className="text-[17px] font-semibold text-[var(--color-text-primary)]">
          {photoName ? "Foto lista" : "Añadir foto (opcional)"}
        </span>
        <span className="mt-2 text-[14px] text-[var(--color-text-secondary)]">
          {photoName
            ? photoName
            : "Elige una imagen de tu dispositivo"}
        </span>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            setPhotoName(file ? file.name : null);
          }}
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-[14px] font-semibold">Dónde</span>
        <select
          value={where}
          onChange={(e) => setWhere(e.target.value)}
          className="min-h-[48px] w-full rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] px-3 text-[16px]"
        >
          <option>Zona norte</option>
          <option>Centro</option>
          <option>Los pinos</option>
        </select>
      </label>
      <label className="block">
        <span className="mb-2 block text-[14px] font-semibold">Qué ha pasado</span>
        <textarea
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descripción breve…"
          className="w-full rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] p-3 text-[16px] leading-6 outline-none focus:ring-2 focus:ring-[var(--color-action-primary)]"
        />
      </label>
      {error ? (
        <p
          className="text-[14px] font-medium text-[var(--color-feedback-danger)]"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      <Button fullWidth type="button" onClick={onSubmit}>
        Enviar aviso
      </Button>
    </MobileScreen>
  );
}
