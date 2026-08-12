/**
 * Feature availability for this tenant (ADR-023 readiness).
 * UI hides entry points when false — not a permission system.
 *
 * Phase 1 Community Communication flags align with ADR-035–038.
 * Legacy keys kept for existing screens; new keys are additive aliases.
 */
export type TenantFeatureFlags = {
  experiences: boolean;
  /** Alias semantic for experiences (Activity product language). */
  activities: boolean;
  services: boolean;
  /**
   * Community job board inside Servicios (Busco / Ofrezco trabajo).
   * Not professionals, not neighbour-help, not marketplace goods.
   */
  work: boolean;
  resources: boolean;
  recommendations: boolean;
  /** Local Entity / Local Discovery ecosystem (ADR-017 / ADR-032). */
  localLife: boolean;
  /** Alias for localLife. */
  localEntities: boolean;
  /** Community Life Pulse aggregation on Home (TECH-011). */
  communityPulse: boolean;
  groups: boolean;
  decide: boolean;
  interactions: boolean;
  incidents: boolean;
  feed: boolean;
  calendar: boolean;
  marketplace: boolean;
  /** Channel organization layer (ADR-035). */
  communityChannels: boolean;
  officialChannels: boolean;
  /**
   * Municipality / Ayuntamiento module.
   * Reference demo: ON (full product showcase). Production tenants may disable.
   */
  municipalServices: boolean;
  /**
   * Official Security module (entity, gates, patrol, notices, incidents).
   * Reference demo: ON (full product showcase). Production tenants may disable.
   */
  securityModule: boolean;
  mobility: boolean;
  /** Residency verification workflows (ADR-038). */
  residencyVerification: boolean;
  /** Soft trust projection — foundation only. */
  participationTrust: boolean;
  /** Diffusion policy data — engine off. */
  intelligentDiffusion: boolean;
  /**
   * Housing / Living module (rent, sale, land, commercial).
   * Reference demo: ON — tenant activation config in `./housing`.
   */
  housing: boolean;
};

/**
 * Life Panoramica reference demo — FULL PRODUCT MODE.
 * Build everything → verify experience → configure visibility later.
 * Flags remain the customization/rollout mechanism for other tenants.
 */
export const lifePanoramicaFeatures: TenantFeatureFlags = {
  experiences: true,
  activities: true,
  services: true,
  work: true,
  resources: true,
  recommendations: true,
  localLife: true,
  localEntities: true,
  communityPulse: true,
  groups: true,
  decide: true,
  interactions: true,
  incidents: true,
  feed: true,
  calendar: true,
  marketplace: true,
  communityChannels: true,
  officialChannels: true,
  municipalServices: true,
  securityModule: true,
  mobility: true,
  residencyVerification: true,
  participationTrust: true,
  intelligentDiffusion: true,
  housing: true,
};

/** Minimal community showcase — core living modules only (future tenants). */
export const lifePanoramicaFeaturesMinimal: TenantFeatureFlags = {
  ...lifePanoramicaFeatures,
  municipalServices: false,
  securityModule: false,
  marketplace: false,
  mobility: false,
  recommendations: false,
  work: false,
  housing: false,
};
