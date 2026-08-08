import type { DomainId } from "../../domain/ids";

/**
 * Conversation / media retention policy foundation (ADR-043 / D.0.5a).
 *
 * Policy ids are referenced by Conversation.retentionPolicyId.
 * No enforcement engine in this slice — contracts only.
 */

export const RETENTION_POLICY_TYPES = [
  "experience",
  "group",
  "service",
  "official",
  "ephemeral",
] as const;

export type RetentionPolicyType = (typeof RETENTION_POLICY_TYPES)[number];

export type RetentionPolicy = {
  id: DomainId;
  type: RetentionPolicyType;
  /** Soft TTL for ephemeral-style policies (days). */
  ttlDays?: number;
  /** Archive after this many days (inactivity or context end) — days. */
  archiveAfter?: number;
  /** When true, media refs should enter cleanup after archive / TTL. */
  cleanupMedia?: boolean;
};

/**
 * Suggested demo / default policy ids — not persisted; documentation aids only.
 */
export const DEFAULT_RETENTION_POLICY_IDS = {
  experience: "retention-experience",
  group: "retention-group",
  service: "retention-service",
  official: "retention-official",
  ephemeral: "retention-ephemeral",
} as const satisfies Record<RetentionPolicyType, DomainId>;

export type RetentionPolicyIssueCode =
  | "missing_id"
  | "missing_type"
  | "negative_ttl"
  | "negative_archive_after";

export type RetentionPolicyIssue = {
  code: RetentionPolicyIssueCode;
  message: string;
  field?: keyof RetentionPolicy;
};

const RETENTION_TYPES: ReadonlySet<RetentionPolicyType> = new Set(
  RETENTION_POLICY_TYPES,
);

export function validateRetentionPolicy(
  policy: RetentionPolicy,
): RetentionPolicyIssue[] {
  const issues: RetentionPolicyIssue[] = [];

  if (!policy.id?.trim()) {
    issues.push({
      code: "missing_id",
      message: "RetentionPolicy requires id.",
      field: "id",
    });
  }
  if (!RETENTION_TYPES.has(policy.type)) {
    issues.push({
      code: "missing_type",
      message: "RetentionPolicy requires a valid type.",
      field: "type",
    });
  }
  if (policy.ttlDays !== undefined && policy.ttlDays < 0) {
    issues.push({
      code: "negative_ttl",
      message: "ttlDays must be >= 0 when set.",
      field: "ttlDays",
    });
  }
  if (policy.archiveAfter !== undefined && policy.archiveAfter < 0) {
    issues.push({
      code: "negative_archive_after",
      message: "archiveAfter must be >= 0 when set.",
      field: "archiveAfter",
    });
  }

  return issues;
}
