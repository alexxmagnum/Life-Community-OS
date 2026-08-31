/**
 * Trust Context — projection of real community actions.
 * Not a reputation domain. Do not create TrustEntity, ReputationEntity,
 * UserScoreEntity or CommunityPointsEntity.
 */

export type TrustSignals = {
  experienceHosted: number;
  experienceJoined: number;
  helpProvided: number;
  communityContributions: number;
  verifiedBusinesses: number;
};

export type TrustPrivacy = {
  visible: boolean;
  showSignals: boolean;
};

export type TrustContext = {
  personId: string;
  tenantId: string;
  territoryId: string;
  signals: TrustSignals;
  privacy: TrustPrivacy;
};

export type TrustContributionLine = {
  title: string;
  detail: string;
};

export type BusinessTrustInput = {
  registered: boolean;
  locationConfirmed: boolean;
  published: boolean;
};

export const EMPTY_TRUST_SIGNALS: TrustSignals = {
  experienceHosted: 0,
  experienceJoined: 0,
  helpProvided: 0,
  communityContributions: 0,
  verifiedBusinesses: 0,
};

export const DEFAULT_TRUST_PRIVACY: TrustPrivacy = {
  visible: false,
  showSignals: false,
};

export function emptyTrustContext(input: {
  personId: string;
  tenantId: string;
  territoryId: string;
}): TrustContext {
  return {
    personId: input.personId.trim(),
    tenantId: input.tenantId.trim(),
    territoryId: input.territoryId.trim(),
    signals: { ...EMPTY_TRUST_SIGNALS },
    privacy: { ...DEFAULT_TRUST_PRIVACY },
  };
}

export function mergeTrustPrivacy(
  value?: Partial<TrustPrivacy> | null,
): TrustPrivacy {
  return {
    visible: value?.visible ?? DEFAULT_TRUST_PRIVACY.visible,
    showSignals: value?.showSignals ?? DEFAULT_TRUST_PRIVACY.showSignals,
  };
}

export function countTrustSignals(input: {
  experienceHosted?: number;
  experienceJoined?: number;
  helpProvided?: number;
  communityContributions?: number;
  verifiedBusinesses?: number;
}): TrustSignals {
  const clamp = (value: number | undefined) =>
    typeof value === "number" && value > 0 ? Math.floor(value) : 0;
  return {
    experienceHosted: clamp(input.experienceHosted),
    experienceJoined: clamp(input.experienceJoined),
    helpProvided: clamp(input.helpProvided),
    communityContributions: clamp(input.communityContributions),
    verifiedBusinesses: clamp(input.verifiedBusinesses),
  };
}

export function projectTrustContext(input: {
  personId: string;
  tenantId: string;
  territoryId: string;
  signals: TrustSignals;
  privacy?: Partial<TrustPrivacy> | null;
}): TrustContext {
  return {
    personId: input.personId.trim(),
    tenantId: input.tenantId.trim(),
    territoryId: input.territoryId.trim(),
    signals: countTrustSignals(input.signals),
    privacy: mergeTrustPrivacy(input.privacy),
  };
}

export function personTrustLabels(signals: TrustSignals): string[] {
  const labels: string[] = [];
  if (signals.experienceHosted >= 3) {
    labels.push("Ha creado varias experiencias");
  } else if (signals.experienceHosted >= 1) {
    labels.push("Organiza actividades");
  }
  if (signals.experienceJoined >= 3) {
    labels.push("Participante habitual");
  }
  if (signals.helpProvided >= 1) {
    labels.push("Vecino colaborador");
  }
  return labels;
}

export function publicPersonTrustLabels(context: TrustContext): string[] {
  if (!context.privacy.visible || !context.privacy.showSignals) return [];
  return personTrustLabels(context.signals);
}

export function ownTrustContribution(signals: TrustSignals): TrustContributionLine[] {
  const lines: TrustContributionLine[] = [];
  if (signals.experienceHosted > 0) {
    lines.push({
      title: "He organizado",
      detail:
        signals.experienceHosted === 1
          ? "1 experiencia"
          : `${signals.experienceHosted} experiencias`,
    });
  }
  if (signals.experienceJoined > 0) {
    lines.push({
      title: "He participado",
      detail:
        signals.experienceJoined === 1
          ? "1 actividad"
          : `${signals.experienceJoined} actividades`,
    });
  }
  if (signals.helpProvided > 0) {
    lines.push({
      title: "He ayudado",
      detail:
        signals.helpProvided === 1
          ? "1 vecino"
          : `${signals.helpProvided} vecinos`,
    });
  }
  if (signals.communityContributions > 0) {
    lines.push({
      title: "He aportado",
      detail:
        signals.communityContributions === 1
          ? "1 contribución"
          : `${signals.communityContributions} contribuciones`,
    });
  }
  if (signals.verifiedBusinesses > 0) {
    lines.push({
      title: "Negocio en la comunidad",
      detail:
        signals.verifiedBusinesses === 1
          ? "1 negocio registrado"
          : `${signals.verifiedBusinesses} negocios`,
    });
  }
  return lines;
}

export function businessTrustLabels(input: BusinessTrustInput): string[] {
  const labels: string[] = [];
  if (input.registered) labels.push("Negocio registrado");
  if (input.locationConfirmed) labels.push("Ubicación confirmada");
  if (input.published) labels.push("Activo en la comunidad");
  return labels;
}

export function placeTrustLabel(input: {
  participantCount: number;
  activityCount: number;
}): string | undefined {
  const active = input.activityCount > 0;
  const people = input.participantCount > 0;
  if (active && people) return "Comunidad activa · Vecinos participan";
  if (active) return "Comunidad activa";
  if (people) return "Vecinos participan";
  return undefined;
}

export function hasPositiveTrustHistory(signals: TrustSignals): boolean {
  return (
    signals.experienceHosted > 0 ||
    signals.helpProvided > 0 ||
    signals.communityContributions > 0 ||
    signals.verifiedBusinesses > 0
  );
}

export function isOpaqueTrustEntity(name: string): boolean {
  return (
    name === "TrustEntity" ||
    name === "ReputationEntity" ||
    name === "UserScoreEntity" ||
    name === "CommunityPointsEntity"
  );
}

export function hasPublicTrustScoring(value: string): boolean {
  return /⭐|puntos|nivel\s*\d|ranking|trustScore/i.test(value);
}
