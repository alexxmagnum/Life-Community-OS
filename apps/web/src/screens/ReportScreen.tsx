"use client";

import { useEffect, useState } from "react";
import {
  Button,
  MobileScreen,
  FlowScreenHeader,
} from "@life-community-os/ui";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { LoadingState } from "@life-community-os/ui";
import { useTenant } from "@/providers/TenantProvider";

const REPORT_STORAGE_KEY = "lcos:last-incident-report";
const REPORTS_STORAGE_KEY = "lcos:incident-reports";

type StoredReport = {
  where: string;
  description: string;
  submittedAt: string;
  trackingCode: string;
  photoName?: string;
  status?: "received" | "in_progress" | "closed";
};

function readStoredReport(): StoredReport | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(REPORT_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredReport;
  } catch {
    return null;
  }
}

function readStoredReports(): StoredReport[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(REPORTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as StoredReport[];
      if (Array.isArray(parsed)) return parsed;
    }
    const last = readStoredReport();
    return last ? [last] : [];
  } catch {
    const last = readStoredReport();
    return last ? [last] : [];
  }
}

function persistReport(report: StoredReport) {
  try {
    const existing = readStoredReports().filter(
      (item) => item.trackingCode !== report.trackingCode,
    );
    sessionStorage.setItem(
      REPORTS_STORAGE_KEY,
      JSON.stringify([report, ...existing]),
    );
    sessionStorage.setItem(REPORT_STORAGE_KEY, JSON.stringify(report));
  } catch {
    /* session may be unavailable — still confirm */
  }
}

function statusLabel(status: StoredReport["status"]): string {
  switch (status) {
    case "in_progress":
      return "En revisión";
    case "closed":
      return "Cerrado";
    default:
      return "Recibido";
  }
}

function reportTitle(report: StoredReport): string {
  const trimmed = report.description.trim();
  if (trimmed.length > 0) {
    return trimmed.length > 72 ? `${trimmed.slice(0, 72)}…` : trimmed;
  }
  return report.where || "Aviso";
}

function ReportConfirmation({
  report,
  onBack,
  onExit,
  onCommunity,
  onNew,
}: {
  report: StoredReport;
  onBack: () => void;
  onExit: () => void;
  onCommunity: () => void;
  onNew: () => void;
}) {
  return (
    <MobileScreen>
      <FlowScreenHeader
        title="Tu aviso"
        subtitle="Qué enviaste y cómo seguirlo."
        onBack={onBack}
        onExit={onExit}
      />
      <div className="space-y-3 rounded-[16px] bg-[var(--color-surface-elevated)] p-4 shadow-[var(--shadow-elev-1)]">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
            Código de seguimiento
          </p>
          <p className="mt-1 font-mono text-[18px] font-semibold text-[var(--color-action-primary)]">
            {report.trackingCode}
          </p>
          <p className="mt-1 text-[13px] text-[var(--color-text-secondary)]">
            Estado · {statusLabel(report.status ?? "received")}
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
            {report.where}
          </p>
          <p className="mt-2 text-[15px] leading-6 text-[var(--color-text-secondary)]">
            {report.description}
          </p>
          {report.photoName ? (
            <p className="mt-2 text-[13px] text-[var(--color-text-tertiary)]">
              Foto adjunta · {report.photoName}
            </p>
          ) : null}
        </div>
      </div>
      <Button fullWidth type="button" onClick={onExit}>
        Volver al inicio
      </Button>
      <Button fullWidth variant="ghost" type="button" onClick={onCommunity}>
        Ir a Comunidad
      </Button>
      <Button fullWidth variant="secondary" type="button" onClick={onNew}>
        Enviar otro aviso
      </Button>
    </MobileScreen>
  );
}

function MyReportsView({
  reports,
  onBack,
  onExit,
  onCreate,
  onOpen,
}: {
  reports: StoredReport[];
  onBack: () => void;
  onExit: () => void;
  onCreate: () => void;
  onOpen: (report: StoredReport) => void;
}) {
  if (reports.length === 0) {
    return (
      <MobileScreen>
        <FlowScreenHeader
          title="Mis avisos"
          subtitle="Seguimiento de lo que has enviado."
          onBack={onBack}
          onExit={onExit}
        />
        <div className="rounded-[16px] bg-[var(--color-surface-elevated)] p-5 shadow-[var(--shadow-elev-1)]">
          <p className="text-[17px] font-semibold text-[var(--color-text-primary)]">
            No tienes avisos todavía
          </p>
          <p className="mt-2 text-[15px] leading-6 text-[var(--color-text-secondary)]">
            Aquí verás el título, el estado y el código de seguimiento de cada
            aviso que envíes sobre un problema en la comunidad.
          </p>
          <Button fullWidth className="mt-4" type="button" onClick={onCreate}>
            Crear aviso
          </Button>
        </div>
      </MobileScreen>
    );
  }

  return (
    <MobileScreen>
      <FlowScreenHeader
        title="Mis avisos"
        subtitle="Seguimiento de lo que has enviado."
        onBack={onBack}
        onExit={onExit}
      />
      <ul className="space-y-2.5">
        {reports.map((report) => (
          <li key={report.trackingCode}>
            <button
              type="button"
              onClick={() => onOpen(report)}
              className="flex w-full flex-col rounded-[14px] bg-[var(--color-surface-elevated)] px-4 py-3.5 text-left shadow-[var(--shadow-elev-1)] transition-transform active:scale-[0.99]"
            >
              <span className="text-[15px] font-semibold text-[var(--color-text-primary)]">
                {reportTitle(report)}
              </span>
              <span className="mt-1 text-[13px] text-[var(--color-text-secondary)]">
                {statusLabel(report.status ?? "received")} ·{" "}
                <span className="font-mono text-[var(--color-action-primary)]">
                  {report.trackingCode}
                </span>
              </span>
              <span className="mt-0.5 text-[12px] text-[var(--color-text-tertiary)]">
                {report.where}
              </span>
            </button>
          </li>
        ))}
      </ul>
      <Button fullWidth variant="secondary" type="button" onClick={onCreate}>
        Crear aviso
      </Button>
    </MobileScreen>
  );
}

/**
 * Incident report — create → submit → confirmation → tracking.
 */
function ReportScreenBody() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { demoMember } = useTenant();
  const viewMine =
    searchParams.get("view") === "mine" ||
    searchParams.get("view") === "last";

  const [where, setWhere] = useState(
    demoMember.areaLabel || "Zona norte",
  );
  const [description, setDescription] = useState("");
  const [photoName, setPhotoName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<StoredReport | null>(null);
  const [reports, setReports] = useState<StoredReport[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = readStoredReports();
    setReports(stored);
    setHydrated(true);
  }, []);

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
      status: "received",
    };
    persistReport(payload);
    setReports((prev) => [
      payload,
      ...prev.filter((item) => item.trackingCode !== payload.trackingCode),
    ]);
    setError(null);
    setSubmitted(payload);
  };

  if (!hydrated) {
    return <LoadingState label="Cargando…" />;
  }

  if (submitted) {
    return (
      <ReportConfirmation
        report={submitted}
        onBack={() => {
          setSubmitted(null);
          router.replace("/report?view=mine");
        }}
        onExit={exitFlow}
        onCommunity={() => router.push("/community")}
        onNew={() => {
          setSubmitted(null);
          setDescription("");
          setPhotoName(null);
          router.replace("/report");
        }}
      />
    );
  }

  if (viewMine) {
    return (
      <MyReportsView
        reports={reports}
        onBack={() => router.push("/me")}
        onExit={exitFlow}
        onCreate={() => router.replace("/report")}
        onOpen={(report) => setSubmitted(report)}
      />
    );
  }

  const zones = Array.from(
    new Set(
      [demoMember.areaLabel, "Zona norte", "Centro", "Los pinos"].filter(
        Boolean,
      ) as string[],
    ),
  );

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
          {photoName ? photoName : "Elige una imagen de tu dispositivo"}
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
          {zones.map((zone) => (
            <option key={zone}>{zone}</option>
          ))}
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

export function ReportScreen() {
  return (
    <Suspense fallback={<LoadingState label="Cargando…" />}>
      <ReportScreenBody />
    </Suspense>
  );
}
