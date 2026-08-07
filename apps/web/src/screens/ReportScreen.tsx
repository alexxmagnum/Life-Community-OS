"use client";

import { MediaCapturePlaceholder, Button, MobileScreen, ScreenBack, ScreenHeader } from "@life-community-os/ui";
import { useRouter } from "next/navigation";
import { useTenant } from "@/providers/TenantProvider";

/** Incident report foundation — camera pattern prepared (ADR-020), no storage. */
export function ReportScreen() {
  const router = useRouter();
  const { theme } = useTenant();

  return (
    <MobileScreen>
      <ScreenBack onClick={() => router.back()} />
      <ScreenHeader
        eyebrow={theme.logoText}
        title="Avisar de un problema"
        subtitle="Haz una foto y cuéntanos qué ocurre. Te mantendremos al tanto."
      />
      <MediaCapturePlaceholder />
      <label className="block">
        <span className="mb-2 block text-[14px] font-semibold">Dónde</span>
        <select className="min-h-[48px] w-full rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] px-3 text-[16px]">
          <option>Zona norte</option>
          <option>Centro</option>
          <option>Los pinos</option>
        </select>
      </label>
      <label className="block">
        <span className="mb-2 block text-[14px] font-semibold">Qué ha pasado</span>
        <textarea
          rows={4}
          placeholder="Descripción breve…"
          className="w-full rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] p-3 text-[16px] leading-6 outline-none focus:ring-2 focus:ring-[var(--color-action-primary)]"
        />
      </label>
      <Button fullWidth type="button" onClick={() => router.push("/")}>
        Enviar
      </Button>
    </MobileScreen>
  );
}
