/**
 * Read-only contribution aggregator for Life Panoramica (Phase C.4 foundation).
 *
 * Derives ContributionSignals from demo catalogs (+ optional session overlays).
 * Recognition only — no points, badges, leaderboards, or AuthZ.
 */

import type {
  ContributionSignals,
  ContributionSignalsIssue,
  LocalRecommendation,
  RecognitionState,
} from "@life-community-os/types";
import {
  deriveRecognitionState,
  emptyContributionSignals,
  validateContributionSignals,
} from "@life-community-os/types";
import { communityContentCatalog, type CommunityContent } from "./community-content";
import {
  DEMO_PERSON_JOHN,
  DEMO_PERSON_LUCIA,
  DEMO_PERSON_MARTA,
  DEMO_TERRITORY_ID,
} from "./demo-ids";
import { listDemoMembers } from "./demo-members";
import {
  listExperiencesForContribution,
  type Experience,
} from "./experiences";
import { groupCatalog, type CommunityGroup } from "./groups";
import { localRecommendationCatalog } from "./local-places";
import {
  marketplaceCatalog,
  type MarketplaceListing,
} from "./marketplace";
import { resolvePersonId } from "./person-id-alignment";

export type ContributionSourceInput = {
  territoryId?: string;
  experiences?: readonly Experience[];
  communityContent?: readonly CommunityContent[];
  groups?: readonly CommunityGroup[];
  recommendations?: readonly LocalRecommendation[];
  marketplace?: readonly MarketplaceListing[];
  /**
   * Experience ids the person joined in this session (localStorage overlay).
   * Catalog participants are counted separately.
   */
  sessionJoinedExperienceIds?: readonly string[];
};

export type PersonContributionProjection = {
  signals: ContributionSignals;
  recognitionState: RecognitionState;
  validationIssues: ContributionSignalsIssue[];
};

function experienceCreatorPersonId(exp: Experience): string | undefined {
  return resolvePersonId({
    personId: exp.createdByPersonId,
    actorId: exp.organizer.id,
    displayName: exp.organizer.name,
  });
}

function contentAuthorPersonId(content: CommunityContent): string | undefined {
  return resolvePersonId({
    actorId: content.author.id,
    displayName: content.author.name,
  });
}

/**
 * Aggregate contribution facts for one Person. Pure over the provided sources
 * (defaults to demo catalogs). Does not write storage or change Permissions.
 */
export function aggregateContributionSignals(
  personId: string,
  input: ContributionSourceInput = {},
): ContributionSignals {
  const territoryId = input.territoryId ?? DEMO_TERRITORY_ID;
  const signals = emptyContributionSignals(personId, territoryId);
  const targetId = personId.trim();
  if (!targetId) return signals;

  const experiences =
    input.experiences ??
    listExperiencesForContribution({ includeSessionCreated: false });
  const content = input.communityContent ?? communityContentCatalog;
  const groups = input.groups ?? groupCatalog;
  const recommendations =
    input.recommendations ?? localRecommendationCatalog;
  const marketplace = input.marketplace ?? marketplaceCatalog;
  const sessionJoined = new Set(input.sessionJoinedExperienceIds ?? []);

  for (const exp of experiences) {
    const creatorId = experienceCreatorPersonId(exp);
    // Require a resolved Person id — never match undefined (official/group actors).
    if (creatorId && creatorId === targetId) {
      signals.experiencesOrganized += 1;
      if (exp.status !== "cancelled") {
        signals.neighboursParticipated += Math.max(0, exp.participantCount);
      }
    }

    const listedAsParticipant = (exp.participants ?? []).some((p) => {
      const participantId = resolvePersonId({
        actorId: p.id,
        displayName: p.name,
      });
      return Boolean(participantId && participantId === targetId);
    });
    if (listedAsParticipant || sessionJoined.has(exp.id)) {
      signals.experiencesJoined += 1;
    }
  }

  for (const group of groups) {
    if (group.ownerPersonId && group.ownerPersonId === targetId) {
      signals.groupsOwned += 1;
      signals.groupMembersReached += Math.max(0, group.memberCount);
    }
  }

  for (const item of content) {
    if (item.type !== "proposal") continue;
    const authorId = contentAuthorPersonId(item);
    if (!authorId || authorId !== targetId) continue;
    signals.proposalsAuthored += 1;
    signals.proposalSupportReceived += Math.max(
      0,
      item.reactionCounts.support ?? 0,
    );
  }

  for (const tip of recommendations) {
    const authorId = resolvePersonId({
      personId: tip.authorPersonId,
      displayName: tip.authorName,
    });
    if (authorId && authorId === targetId) {
      signals.recommendationsAuthored += 1;
    }
  }

  for (const listing of marketplace) {
    if (listing.kind !== "give" && listing.kind !== "request") continue;
    const authorId = resolvePersonId({
      personId: listing.authorPersonId,
      displayName: listing.authorName,
    });
    if (authorId && authorId === targetId) {
      signals.neighbourHelpListings += 1;
    }
  }

  return signals;
}

/** Signals + recognition + structural validation for one person. */
export function projectPersonContribution(
  personId: string,
  input: ContributionSourceInput = {},
): PersonContributionProjection {
  const signals = aggregateContributionSignals(personId, input);
  return {
    signals,
    recognitionState: deriveRecognitionState(signals),
    validationIssues: validateContributionSignals(signals),
  };
}

export type ContributionFoundationValidationResult = {
  ok: boolean;
  projections: PersonContributionProjection[];
  issues: string[];
};

/**
 * Validates demo foundation: aggregator + recognition for switchable members.
 * Read-only check — safe to call from typecheck scripts or future UI gates.
 */
export function validateDemoContributionFoundation(
  input: ContributionSourceInput = {},
): ContributionFoundationValidationResult {
  const issues: string[] = [];
  const personIds = [
    ...new Set([
      ...listDemoMembers().map((m) => m.personId),
      DEMO_PERSON_MARTA,
      DEMO_PERSON_JOHN,
      DEMO_PERSON_LUCIA,
    ]),
  ];

  const projections = personIds.map((id) =>
    projectPersonContribution(id, input),
  );

  for (const projection of projections) {
    const { signals, recognitionState, validationIssues } = projection;
    if (validationIssues.length > 0) {
      for (const issue of validationIssues) {
        issues.push(`${signals.personId}: ${issue.code} — ${issue.message}`);
      }
    }
    const allowed: RecognitionState[] = [
      "new_neighbour",
      "active_participant",
      "community_contributor",
      "community_reference",
    ];
    if (!allowed.includes(recognitionState)) {
      issues.push(
        `${signals.personId}: invalid recognitionState ${recognitionState}`,
      );
    }
    if (deriveRecognitionState(signals) !== recognitionState) {
      issues.push(
        `${signals.personId}: recognitionState not derived from signals`,
      );
    }
  }

  const marta = projections.find((p) => p.signals.personId === DEMO_PERSON_MARTA);
  if (!marta || marta.signals.experiencesOrganized < 1) {
    issues.push("person-marta must organize at least one catalog experience");
  }
  if (!marta || marta.signals.groupsOwned < 1) {
    issues.push("person-marta must own at least one catalog group");
  }
  if (
    !marta ||
    (marta.recognitionState !== "community_contributor" &&
      marta.recognitionState !== "community_reference")
  ) {
    issues.push(
      "person-marta recognition must be community_contributor or community_reference",
    );
  }

  const john = projections.find((p) => p.signals.personId === DEMO_PERSON_JOHN);
  if (!john || john.signals.experiencesJoined < 1) {
    issues.push("person-john must join at least one catalog experience");
  }

  const lucia = projections.find((p) => p.signals.personId === DEMO_PERSON_LUCIA);
  if (!lucia || lucia.signals.experiencesJoined < 1) {
    issues.push("person-lucia must join at least one catalog experience");
  }

  return { ok: issues.length === 0, projections, issues };
}
