/**
 * Community Home Alerts (D.0.7.2.3 Personalized Home).
 *
 * Exceptional situations only — visible ≤24h.
 * NOT for pool schedules, maintenance, or routine notices.
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
  body: string;
  kind: CommunityAlertKind;
  /** ISO publish time — alert expires 24h after this. */
  publishedAt: string;
  href?: string;
};

const ALERT_TTL_MS = 24 * 60 * 60 * 1000;

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
    href: "/community?tab=actualidad",
  };

  return [demoWeather, ...communityAlertCatalog].filter((alert) =>
    isCommunityAlertActive(alert, nowMs),
  );
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
