import type { DomainId } from "./ids";

/**
 * Contribution & recognition projection (Phase C.4 foundation).
 *
 * Facts about value created — not points, badges, leaderboards, or AuthZ.
 * Identity and Permissions remain separate; recognition never gates create/join.
 */

/** Human recognition labels — projection only, not game levels. */
export type RecognitionState =
  | "new_neighbour"
  | "active_participant"
  | "community_contributor"
  | "community_reference";

/**
 * Aggregated contribution facts for one Person in one Territory.
 * Counts are derived from catalogs / session overlays — not competitive scores.
 */
export type ContributionSignals = {
  personId: DomainId;
  territoryId: DomainId;
  /** Experiences organized / created by this person. */
  experiencesOrganized: number;
  /** Sum of participantCount on organized experiences (impact). */
  neighboursParticipated: number;
  /** Experiences this person joined (catalog or session). */
  experiencesJoined: number;
  /** Groups owned by this person. */
  groupsOwned: number;
  /** Sum of memberCount on owned groups. */
  groupMembersReached: number;
  /** Community proposals authored. */
  proposalsAuthored: number;
  /** Support reactions received on authored proposals. */
  proposalSupportReceived: number;
  /** Local recommendations authored. */
  recommendationsAuthored: number;
  /** Neighbour-help marketplace listings (give / request). */
  neighbourHelpListings: number;
  /** Community job board posts authored (looking_for_work / offering_work). Recognition only. */
  workPostsPublished: number;
};

export type ContributionSignalsIssue = {
  code:
    | "missing_person_id"
    | "missing_territory_id"
    | "negative_count"
    | "neighbours_without_organized"
    | "support_without_proposals"
    | "members_without_groups";
  message: string;
  field?: keyof ContributionSignals;
};

const NON_NEGATIVE_FIELDS: ReadonlyArray<
  Exclude<keyof ContributionSignals, "personId" | "territoryId">
> = [
  "experiencesOrganized",
  "neighboursParticipated",
  "experiencesJoined",
  "groupsOwned",
  "groupMembersReached",
  "proposalsAuthored",
  "proposalSupportReceived",
  "recommendationsAuthored",
  "neighbourHelpListings",
  "workPostsPublished",
];

/** Empty signals for a person — recognition defaults to new_neighbour. */
export function emptyContributionSignals(
  personId: DomainId,
  territoryId: DomainId,
): ContributionSignals {
  return {
    personId,
    territoryId,
    experiencesOrganized: 0,
    neighboursParticipated: 0,
    experiencesJoined: 0,
    groupsOwned: 0,
    groupMembersReached: 0,
    proposalsAuthored: 0,
    proposalSupportReceived: 0,
    recommendationsAuthored: 0,
    neighbourHelpListings: 0,
    workPostsPublished: 0,
  };
}

/**
 * Structural validation of aggregated signals (not AuthZ, not scoring).
 * Returns issues; empty array means valid for recognition projection.
 */
export function validateContributionSignals(
  signals: ContributionSignals,
): ContributionSignalsIssue[] {
  const issues: ContributionSignalsIssue[] = [];
  if (!signals.personId?.trim()) {
    issues.push({
      code: "missing_person_id",
      message: "personId is required",
      field: "personId",
    });
  }
  if (!signals.territoryId?.trim()) {
    issues.push({
      code: "missing_territory_id",
      message: "territoryId is required",
      field: "territoryId",
    });
  }
  for (const field of NON_NEGATIVE_FIELDS) {
    if (signals[field] < 0) {
      issues.push({
        code: "negative_count",
        message: `${field} must be >= 0`,
        field,
      });
    }
  }
  if (signals.neighboursParticipated > 0 && signals.experiencesOrganized === 0) {
    issues.push({
      code: "neighbours_without_organized",
      message:
        "neighboursParticipated requires at least one organized experience",
      field: "neighboursParticipated",
    });
  }
  if (signals.proposalSupportReceived > 0 && signals.proposalsAuthored === 0) {
    issues.push({
      code: "support_without_proposals",
      message: "proposalSupportReceived requires at least one authored proposal",
      field: "proposalSupportReceived",
    });
  }
  if (signals.groupMembersReached > 0 && signals.groupsOwned === 0) {
    issues.push({
      code: "members_without_groups",
      message: "groupMembersReached requires at least one owned group",
      field: "groupMembersReached",
    });
  }
  return issues;
}

/**
 * Derive recognition state from contribution facts.
 * Pure function — thresholds recognize impact, never unlock Permissions.
 *
 * Order of evaluation: community_reference → community_contributor →
 * active_participant → new_neighbour.
 */
export function deriveRecognitionState(
  signals: ContributionSignals,
): RecognitionState {
  const {
    experiencesOrganized,
    neighboursParticipated,
    experiencesJoined,
    groupsOwned,
    groupMembersReached,
    proposalsAuthored,
    recommendationsAuthored,
    neighbourHelpListings,
    workPostsPublished,
  } = signals;

  const sustainedImpact =
    neighboursParticipated >= 40 ||
    (experiencesOrganized >= 2 && neighboursParticipated >= 15) ||
    (groupsOwned >= 1 &&
      groupMembersReached >= 40 &&
      experiencesOrganized >= 1);

  if (sustainedImpact) return "community_reference";

  if (
    experiencesOrganized >= 1 ||
    proposalsAuthored >= 1 ||
    groupsOwned >= 1
  ) {
    return "community_contributor";
  }

  if (
    experiencesJoined >= 1 ||
    recommendationsAuthored >= 1 ||
    neighbourHelpListings >= 1 ||
    workPostsPublished >= 1
  ) {
    return "active_participant";
  }

  return "new_neighbour";
}
