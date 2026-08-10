import type { DomainId, IsoDateTimeString } from "../../domain/ids";

/**
 * Vote — formal decision foundation (contracts only).
 *
 * Do NOT invent fake ballots or live tallies in UI until eligibility,
 * permissions, and auditability are product-ready.
 */

export const VOTE_STATUSES = [
  "draft",
  "scheduled",
  "open",
  "closed",
  "cancelled",
] as const;

export type VoteStatus = (typeof VOTE_STATUSES)[number];

export function isVoteStatus(value: string): value is VoteStatus {
  return (VOTE_STATUSES as readonly string[]).includes(value);
}

export type VoteOption = {
  id: DomainId;
  label: string;
  sortOrder?: number;
};

export type VoteEligibility = {
  /** Capability or role keys resolved by Tenant Config / RBAC. */
  requiredCapabilityIds?: string[];
  /** Human-readable hint for UI (terminology via Tenant Config). */
  eligibilityHint?: string;
};

export type VoteDefinition = {
  id: DomainId;
  tenantId: DomainId;
  subjectId: DomainId;
  question: string;
  options: VoteOption[];
  status: VoteStatus;
  startsAt?: IsoDateTimeString;
  endsAt?: IsoDateTimeString;
  eligibility?: VoteEligibility;
};

export type VoteResultTally = {
  optionId: DomainId;
  count: number;
};

export type VoteResults = {
  voteId: DomainId;
  status: VoteStatus;
  tallies: VoteResultTally[];
  turnout?: number;
  closedAt?: IsoDateTimeString;
};

export type VoteIssueCode =
  | "missing_id"
  | "missing_tenant_id"
  | "missing_subject_id"
  | "missing_question"
  | "insufficient_options"
  | "invalid_status";

export type VoteIssue = {
  code: VoteIssueCode;
  message: string;
  field?: string;
};

export function validateVoteDefinition(vote: VoteDefinition): VoteIssue[] {
  const issues: VoteIssue[] = [];
  if (!vote.id?.trim()) {
    issues.push({
      code: "missing_id",
      message: "VoteDefinition requires id.",
      field: "id",
    });
  }
  if (!vote.tenantId?.trim()) {
    issues.push({
      code: "missing_tenant_id",
      message: "VoteDefinition requires tenantId.",
      field: "tenantId",
    });
  }
  if (!vote.subjectId?.trim()) {
    issues.push({
      code: "missing_subject_id",
      message: "VoteDefinition requires subjectId.",
      field: "subjectId",
    });
  }
  if (!vote.question?.trim()) {
    issues.push({
      code: "missing_question",
      message: "VoteDefinition requires question.",
      field: "question",
    });
  }
  if (!vote.options || vote.options.length < 2) {
    issues.push({
      code: "insufficient_options",
      message: "VoteDefinition requires at least two options.",
      field: "options",
    });
  }
  if (!isVoteStatus(vote.status)) {
    issues.push({
      code: "invalid_status",
      message: "VoteDefinition status is not a known VoteStatus.",
      field: "status",
    });
  }
  return issues;
}

export const VOTE_FOUNDATION_NOTE =
  "Vote UI must not cast or invent results until eligibility, window, and audit rules are implemented.";
