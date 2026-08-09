/**
 * Community Home Alerts (D.0.7.2.3 Personalized Home).
 *
 * Exceptional situations only — visible ≤24h.
 * NOT for pool schedules, maintenance, or routine notices.
 *
 * Home shows compact previews only (title + short context).
 * Full body belongs on detail — never dump on Home.
 *
 * Colour hierarchy (product):
 * - alert      → red
 * - important  → yellow / amber
 * - info       → celeste (useful information)
 */

export type CommunityAlertKind =
  | "weather"
  | "flood"
  | "fire"
  | "security"
  | "emergency"
  | "notice";

/** Visual severity — drives Home colour, not the domain kind. */
export type CommunityAlertLevel = "alert" | "important" | "info";

export type CommunityAlert = {
  id: string;
  title: string;
  /** Full copy for detail surfaces — do not render on Home. */
  body: string;
  kind: CommunityAlertKind;
  level: CommunityAlertLevel;
  /** ISO publish time — alert expires 24h after this. */
  publishedAt: string;
  /** Compact Home line: time window · area */
  contextLabel: string;
  /** Affected area — prefer over parsing contextLabel. */
  areaLabel?: string;
  /** Active window (e.g. Hasta 20:00). */
  timeWindowLabel?: string;
  /** Next-step label when href is set. */
  actionLabel?: string;
  href?: string;
};

const ALERT_TTL_MS = 24 * 60 * 60 * 1000;
const HOME_ALERT_CAP = 3;

/**
 * Static exceptional demos (optional). Prefer listActiveCommunityAlerts()
 * which can anchor a product demo alert to `nowMs` for stable hydration.
 */
export const communityAlertCatalog: CommunityAlert[] = [];

export function isCommunityAlertActive(
  alert: CommunityAlert,
  nowMs: number = Date.now(),
): boolean {
  const published = Date.parse(alert.publishedAt);
  if (Number.isNaN(published)) return false;
  return nowMs - published <= ALERT_TTL_MS && nowMs >= published;
}

/**
 * Active alerts for Home.
 * Demo set anchored to `nowMs` so SSR/client match on first paint.
 * Caps at 3 — one per colour tier for product clarity.
 */
export function listActiveCommunityAlerts(
  nowMs: number = Date.now(),
): CommunityAlert[] {
  const demoAlert: CommunityAlert = {
    id: "alert-emergency-demo",
    title: "Aviso meteorológico severo",
    body: "Se esperan rachas fuertes y posibles inundaciones en zonas bajas esta tarde. Evita desplazamientos no esenciales.",
    kind: "weather",
    level: "alert",
    publishedAt: new Date(nowMs - 2 * 60 * 60 * 1000).toISOString(),
    contextLabel: "Hasta 20:00 · Zona Norte",
    areaLabel: "Zona Norte",
    timeWindowLabel: "Hasta 20:00",
    actionLabel: "Ver avisos oficiales",
    href: "/community#plaza-avisos",
  };

  return [demoAlert, ...communityAlertCatalog]
    .filter((alert) => isCommunityAlertActive(alert, nowMs))
    .slice(0, HOME_ALERT_CAP);
}

export function communityAlertLevelLabel(level: CommunityAlertLevel): string {
  switch (level) {
    case "alert":
      return "Alerta";
    case "important":
      return "Importante";
    case "info":
      return "Información";
    default:
      return "Aviso";
  }
}

export function communityAlertKindLabel(kind: CommunityAlertKind): string {
  switch (kind) {
    case "weather":
      return "Alerta meteorológica";
    case "flood":
      return "Riesgo de inundación";
    case "fire":
      return "Riesgo de incendio";
    case "security":
      return "Alerta de seguridad";
    case "emergency":
      return "Emergencia";
    case "notice":
      return "Información útil";
    default:
      return "Alerta";
  }
}

/** Instant category signal for Home previews — curated emoji. */
export function communityAlertIcon(
  kind: CommunityAlertKind,
  level?: CommunityAlertLevel,
): string {
  // Kind wins when it carries a clear signal (e.g. weather storm).
  switch (kind) {
    case "weather":
      return "⛈️";
    case "flood":
      return "🌊";
    case "fire":
      return "🔥";
    case "security":
      return "🚨";
    case "emergency":
      return "🚨";
    case "notice":
      return "ℹ️";
    default:
      break;
  }
  if (level === "alert") return "🚨";
  if (level === "important") return "⚠️";
  if (level === "info") return "ℹ️";
  return "🚨";
}

/** Surface tone — red / yellow / celeste. */
export function communityAlertTone(
  level: CommunityAlertLevel,
): "alert" | "important" | "info" {
  return level;
}
