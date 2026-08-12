/**
 * Professional trades catalog for the Professionals hub.
 *
 * Source of truth: families already present under the platform
 * `professionals.*` asset domain (scene inventory). This is NOT a new
 * invented taxonomy — it enumerates existing art families so the hub can
 * show pads (CARD when produced; placeholder until then).
 *
 * Tenant-owned: another tenant may ship a shorter/longer list.
 * Shared UI never hardcodes these ids.
 */

export type ProfessionalTrade = {
  readonly id: string;
  readonly label: string;
  /** Short secondary line for AssetPad meta. */
  readonly description: string;
  /**
   * Suggested registry CARD key (`professionals.<id>.card`).
   * Null means no card slot expected yet.
   * Scenes must never be referenced here.
   */
  readonly cardAssetKey: string | null;
};

/**
 * Ordered trades derived from `professionals.*.scene` families in the
 * global asset registry (excluding the hub-level `professionals.professionals`).
 */
export const PROFESSIONAL_TRADES: readonly ProfessionalTrade[] = [
  {
    id: "gardening",
    label: "Jardinería",
    description: "Cuidado de jardines y plantas.",
    cardAssetKey: "professionals.gardening.card",
  },
  {
    id: "cleaning",
    label: "Limpieza",
    description: "Limpieza del hogar y comunidades.",
    cardAssetKey: "professionals.cleaning.card",
  },
  {
    id: "repairs",
    label: "Reparaciones",
    description: "Arreglos y mantenimiento general.",
    cardAssetKey: "professionals.repairs.card",
  },
  {
    id: "electrician",
    label: "Electricista",
    description: "Instalaciones y averías eléctricas.",
    cardAssetKey: "professionals.electrician.card",
  },
  {
    id: "plumber",
    label: "Fontanero",
    description: "Fontanería y desagües.",
    cardAssetKey: "professionals.plumber.card",
  },
  {
    id: "carpenter",
    label: "Carpintero",
    description: "Madera, muebles y carpintería.",
    cardAssetKey: "professionals.carpenter.card",
  },
  {
    id: "painter",
    label: "Pintor",
    description: "Pintura interior y exterior.",
    cardAssetKey: "professionals.painter.card",
  },
  {
    id: "locksmith-service",
    label: "Cerrajero",
    description: "Cerrajería y aperturas.",
    cardAssetKey: "professionals.locksmith-service.card",
  },
  {
    id: "air-conditioning",
    label: "Aire acondicionado",
    description: "Climatización e instalación.",
    cardAssetKey: "professionals.air-conditioning.card",
  },
  {
    id: "veterinary-doctor",
    label: "Veterinario",
    description: "Cuidado de mascotas.",
    cardAssetKey: "professionals.veterinary-doctor.card",
  },
  {
    id: "waiter",
    label: "Camarero",
    description: "Servicio de sala y eventos.",
    cardAssetKey: "professionals.waiter.card",
  },
] as const;

export function getProfessionalTradeById(
  id: string,
): ProfessionalTrade | undefined {
  return PROFESSIONAL_TRADES.find((trade) => trade.id === id);
}
