import type { DomainId, IsoDateTimeString } from "../../domain/ids";

/**
 * Support — "I endorse this proposal."
 *
 * Soft social / prioritization signal. Not a formal ballot (see Vote).
 * Not a lightweight like (see SoftReaction / message ReactionType).
 */

export const SUPPORT_VISIBILITY_MODES = [
  /** Named supporters visible to eligible members (default residential). */
  "named",
  /** Count only — no public roster (privacy-sensitive topics). */
  "count_only",
] as const;

export type SupportVisibility = (typeof SUPPORT_VISIBILITY_MODES)[number];

export function isSupportVisibility(value: string): value is SupportVisibility {
  return (SUPPORT_VISIBILITY_MODES as readonly string[]).includes(value);
}

export type SupportRecord = {
  id: DomainId;
  tenantId: DomainId;
  /** Proposal / decide-content id this support endorses. */
  subjectId: DomainId;
  personId: DomainId;
  createdAt: IsoDateTimeString;
  /** Optional display fields when projecting for UI (not AuthZ). */
  displayName?: string;
  avatarUrl?: string;
};

export type SupportAggregate = {
  subjectId: DomainId;
  count: number;
  visibility: SupportVisibility;
  /** Present when visibility === "named"; may be truncated. */
  supporters?: SupportRecord[];
  /** Whether the acting person already supports. */
  supportedByViewer?: boolean;
};

export type SupportIssueCode =
  | "missing_id"
  | "missing_tenant_id"
  | "missing_subject_id"
  | "missing_person_id"
  | "missing_created_at";

export type SupportIssue = {
  code: SupportIssueCode;
  message: string;
  field?: keyof SupportRecord;
};

export function validateSupportRecord(record: SupportRecord): SupportIssue[] {
  const issues: SupportIssue[] = [];
  if (!record.id?.trim()) {
    issues.push({
      code: "missing_id",
      message: "SupportRecord requires id.",
      field: "id",
    });
  }
  if (!record.tenantId?.trim()) {
    issues.push({
      code: "missing_tenant_id",
      message: "SupportRecord requires tenantId.",
      field: "tenantId",
    });
  }
  if (!record.subjectId?.trim()) {
    issues.push({
      code: "missing_subject_id",
      message: "SupportRecord requires subjectId.",
      field: "subjectId",
    });
  }
  if (!record.personId?.trim()) {
    issues.push({
      code: "missing_person_id",
      message: "SupportRecord requires personId.",
      field: "personId",
    });
  }
  if (!record.createdAt?.trim()) {
    issues.push({
      code: "missing_created_at",
      message: "SupportRecord requires createdAt.",
      field: "createdAt",
    });
  }
  return issues;
}
