/**
 * Community Home Alerts (D.0.7.2.3 Personalized Home).
 *
 * Exceptional situations only — visible ≤24h.
 * NOT for pool schedules, maintenance, or routine notices.
 *
 * Home shows compact previews only (title + short context).
 * Full body belongs on detail — never dump on Home.
 */

export type CommunityAlertKind =
  | "weather"
  | "flood"
  | "fire"
  | "security"
  | "emergency";

export type CommunityAlert = {
  id: string;
  title: string;
  /** Full copy for detail surfaces — do not render on Home. */
  body: string;
  kind: CommunityAlertKind;
  /** ISO publish time — alert expires 24h after this. */
  publishedAt: string;
  /** Compact Home line: time window · area */
  contextLabel: string;
  href?: string;
};

const ALERT_TTL_MS = 24 * 60 * 60 * 1000;
const HOME_ALERT_CAP = 2;

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
 * Includes one demo severe-weather alert anchored to `nowMs` so SSR/client match
 * when callers pass a stable clock during first paint.
 * Caps at 2 — exceptional density only.
 */
export function listActiveCommunityAlerts(
  nowMs: number = Date.now(),
): CommunityAlert[] {
  const demoWeather: CommunityAlert = {
    id: "alert-storm-demo",
    title: "Aviso meteorológico severo",
    body: "Se esperan rachas fuertes y posibles inundaciones en zonas bajas esta tarde. Evita desplazamientos no esenciales.",
    kind: "weather",
    publishedAt: new Date(nowMs - 2 * 60 * 60 * 1000).toISOString(),
    contextLabel: "Hasta 20:00 · Zona Norte",
    href: "/community?tab=actualidad",
  };

  return [demoWeather, ...communityAlertCatalog]
    .filter((alert) => isCommunityAlertActive(alert, nowMs))
    .slice(0, HOME_ALERT_CAP);
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
    default:
      return "Alerta";
  }
}

/** Instant category signal for Home previews. */
export function communityAlertIcon(kind: CommunityAlertKind): string {
  switch (kind) {
    case "weather":
      return "🌧";
    case "flood":
      return "⚠️";
    case "fire":
      return "🚨";
    case "security":
      return "⚠️";
    case "emergency":
      return "🚨";
    default:
      return "🚨";
  }
}
