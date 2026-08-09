/**
 * ADR-020 media UI preparation — capture / preview / gallery patterns.
 * Prefer real file input in product flows (see ReportScreen) over disabled CTAs.
 */

import { cn } from "../lib/cn";

export function MediaCapturePlaceholder({
  label = "Añadir foto (opcional)",
  hint = "La captura en vivo se conectará aquí; mientras tanto usa el selector de archivos en el flujo de aviso.",
  className,
}: {
  label?: string;
  hint?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex aspect-[4/3] flex-col items-center justify-center rounded-[var(--radius-xl)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface-muted)] px-6 text-center",
        className,
      )}
    >
      <p className="text-[17px] font-semibold text-[var(--color-text-primary)]">
        {label}
      </p>
      <p className="mt-2 text-[14px] text-[var(--color-text-secondary)]">
        {hint}
      </p>
    </div>
  );
}

export function MediaPreviewPlaceholder({
  className,
}: {
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex aspect-video items-center justify-center rounded-[var(--radius-lg)] bg-[var(--color-surface-muted)] text-[15px] text-[var(--color-text-secondary)]",
        className,
      )}
    >
      Vista previa · Repetir / Usar
    </div>
  );
}
