/**
 * Community participation foundations (Phase 2.5 / Phase 2.4 doctrine).
 *
 * PRODUCT LAW:
 *   Reaction ≠ Support ≠ Vote
 *
 * - Reaction: lightweight affect / acknowledgement — no governance consequence
 * - Support: endorsement of a proposal — soft social signal, not a ballot
 * - Vote: formal decision — options, eligibility, window, results, permissions
 *
 * Message emoji reactions remain in `platform/communication/reactions.ts`.
 * This module owns public-content and proposal participation semantics.
 *
 * No Life Panoramica. No UI. No fake tallies.
 */

export type {
  SoftReactionKind,
  SoftReactionSummary,
} from "./soft-reaction";
export {
  SOFT_REACTION_KINDS,
  isSoftReactionKind,
  emptySoftReactionSummary,
  PARTICIPATION_SEPARATION_NOTE,
} from "./soft-reaction";

export type {
  SupportVisibility,
  SupportRecord,
  SupportAggregate,
  SupportIssue,
  SupportIssueCode,
} from "./support";
export {
  SUPPORT_VISIBILITY_MODES,
  isSupportVisibility,
  validateSupportRecord,
} from "./support";

export type {
  VoteStatus,
  VoteOption,
  VoteEligibility,
  VoteDefinition,
  VoteResultTally,
  VoteResults,
  VoteIssue,
  VoteIssueCode,
} from "./vote";
export {
  VOTE_STATUSES,
  isVoteStatus,
  validateVoteDefinition,
  VOTE_FOUNDATION_NOTE,
} from "./vote";
