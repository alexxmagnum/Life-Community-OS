/**
 * Personal Context — private projection for one Person in one Tenant.
 * Not a social profile. Not a recommendation domain.
 * Do not create RecommendationEntity, InterestPost, AIActivityEntity,
 * UserScoreEntity or EngagementEntity.
 */

export const PERSONAL_INTEREST_IDS = [
  "golf",
  "pool",
  "family",
  "restaurants",
  "sports",
  "help",
] as const;

export type PersonalInterestId = (typeof PERSONAL_INTEREST_IDS)[number];

export type PersonalInterestOption = {
  id: PersonalInterestId;
  label: string;
  emoji: string;
};

export const PERSONAL_INTEREST_OPTIONS: readonly PersonalInterestOption[] = [
  { id: "golf", label: "Golf", emoji: "⛳" },
  { id: "pool", label: "Piscina", emoji: "🏊" },
  { id: "family", label: "Familia", emoji: "👨‍👩‍👧" },
  { id: "restaurants", label: "Restaurantes", emoji: "🍽" },
  { id: "sports", label: "Deportes", emoji: "🎾" },
  { id: "help", label: "Ayudar", emoji: "🤝" },
];

export const PERSONAL_FAVORITE_KINDS = [
  "location",
  "experience",
  "business",
  "resource",
] as const;

export type PersonalFavoriteKind = (typeof PERSONAL_FAVORITE_KINDS)[number];

export type PersonalFavorite = {
  id: string;
  tenantId: string;
  personId: string;
  kind: PersonalFavoriteKind;
  targetId: string;
};

export type PersonalParticipationHistoryItem = {
  type: string;
  count: number;
};

export type PersonalPrivacy = {
  shareActivity: boolean;
  receiveRecommendations: boolean;
};

export type PersonalPreferences = {
  categories: string[];
  interests: string[];
};

export type PersonalContext = {
  personId: string;
  tenantId: string;
  territoryId: string;
  preferences: PersonalPreferences;
  favoriteLocations: string[];
  participationHistory: PersonalParticipationHistoryItem[];
  privacy: PersonalPrivacy;
};

export const DEFAULT_PERSONAL_PRIVACY: PersonalPrivacy = {
  shareActivity: true,
  receiveRecommendations: true,
};

export const EMPTY_PERSONAL_PREFERENCES: PersonalPreferences = {
  categories: [],
  interests: [],
};

export function isPersonalInterestId(
  value: string,
): value is PersonalInterestId {
  return (PERSONAL_INTEREST_IDS as readonly string[]).includes(value);
}

export function isPersonalFavoriteKind(
  value: string,
): value is PersonalFavoriteKind {
  return (PERSONAL_FAVORITE_KINDS as readonly string[]).includes(value);
}

export function personalInterestLabel(id: string): string {
  return (
    PERSONAL_INTEREST_OPTIONS.find((item) => item.id === id)?.label ?? id
  );
}

export function sanitizeInterestIds(
  values: readonly string[] | null | undefined,
): PersonalInterestId[] {
  const seen = new Set<PersonalInterestId>();
  for (const value of values ?? []) {
    const id = value.trim();
    if (isPersonalInterestId(id)) seen.add(id);
  }
  return PERSONAL_INTEREST_IDS.filter((id) => seen.has(id));
}

export function emptyPersonalContext(input: {
  personId: string;
  tenantId: string;
  territoryId: string;
}): PersonalContext {
  return {
    personId: input.personId.trim(),
    tenantId: input.tenantId.trim(),
    territoryId: input.territoryId.trim(),
    preferences: { categories: [], interests: [] },
    favoriteLocations: [],
    participationHistory: [],
    privacy: { ...DEFAULT_PERSONAL_PRIVACY },
  };
}

export function mergePersonalPrivacy(
  value?: Partial<PersonalPrivacy> | null,
): PersonalPrivacy {
  return {
    shareActivity:
      value?.shareActivity ?? DEFAULT_PERSONAL_PRIVACY.shareActivity,
    receiveRecommendations:
      value?.receiveRecommendations ??
      DEFAULT_PERSONAL_PRIVACY.receiveRecommendations,
  };
}

export function favoriteLocationsFrom(
  favorites: readonly PersonalFavorite[],
): string[] {
  return favorites
    .filter((item) => item.kind === "location")
    .map((item) => item.targetId);
}

export function personalFavoriteId(
  personId: string,
  kind: PersonalFavoriteKind,
  targetId: string,
): string {
  return `fav:${personId}:${kind}:${targetId}`;
}
