import type { DomainId, IsoDateTimeString } from "./ids";

/**
 * Residency verification case (ADR-038).
 * Claims do not grant access until approved and the related
 * PropertyPersonRelationship becomes active.
 *
 * Evidence is never stored on Person — use Files references (ADR-020).
 */

export type ResidencyVerificationMethod =
  | "residency_certificate"
  | "owner_invitation"
  | "administration_approval"
  | "approved_documentation";

export type ResidencyVerificationStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "approved"
  | "rejected"
  | "cancelled";

export type ResidencyVerification = {
  id: DomainId;
  /** PropertyPersonRelationship under review. */
  relationshipId: DomainId;
  personId: DomainId;
  territoryId: DomainId;
  communityAreaId?: DomainId;
  method: ResidencyVerificationMethod;
  status: ResidencyVerificationStatus;
  reviewedByPersonId?: DomainId;
  decisionNote?: string;
  submittedAt?: IsoDateTimeString;
  decidedAt?: IsoDateTimeString;
  createdAt?: IsoDateTimeString;
  updatedAt?: IsoDateTimeString;
};

export type ResidencyVerificationEvidenceKind =
  | "certificate_file"
  | "supporting_document_file"
  | "owner_invitation_reference"
  | "administration_decision_reference";

/**
 * Verification evidence separated from identity (ADR-038).
 * Prefer `fileId` (Core Files) over embedding binaries anywhere on Person.
 */
export type ResidencyVerificationEvidence = {
  id: DomainId;
  verificationId: DomainId;
  kind: ResidencyVerificationEvidenceKind;
  /** Platform Core Files id (ADR-020). */
  fileId?: DomainId;
  /** Non-file reference (invite id, admin case id, etc.). */
  externalReference?: string;
  metadata?: Record<string, unknown>;
  createdAt?: IsoDateTimeString;
};

export type ResidencyVerificationIssue = {
  code:
    | "missing_relationship"
    | "missing_person"
    | "missing_territory"
    | "invalid_method"
    | "invalid_status"
    | "evidence_on_person_forbidden"
    | "file_required_for_method";
  message: string;
};

const METHODS: ReadonlySet<ResidencyVerificationMethod> = new Set([
  "residency_certificate",
  "owner_invitation",
  "administration_approval",
  "approved_documentation",
]);

const STATUSES: ReadonlySet<ResidencyVerificationStatus> = new Set([
  "draft",
  "submitted",
  "under_review",
  "approved",
  "rejected",
  "cancelled",
]);

const FILE_METHODS: ReadonlySet<ResidencyVerificationMethod> = new Set([
  "residency_certificate",
  "approved_documentation",
]);

/**
 * Validates a verification case shape before persistence (ADR-038).
 * Does not perform I/O or document inspection.
 */
export function validateResidencyVerification(
  verification: ResidencyVerification,
  evidence: readonly ResidencyVerificationEvidence[] = [],
): ResidencyVerificationIssue[] {
  const issues: ResidencyVerificationIssue[] = [];

  if (!verification.relationshipId) {
    issues.push({
      code: "missing_relationship",
      message: "ResidencyVerification requires relationshipId.",
    });
  }
  if (!verification.personId) {
    issues.push({
      code: "missing_person",
      message: "ResidencyVerification requires personId.",
    });
  }
  if (!verification.territoryId) {
    issues.push({
      code: "missing_territory",
      message: "ResidencyVerification requires territoryId.",
    });
  }
  if (!METHODS.has(verification.method)) {
    issues.push({
      code: "invalid_method",
      message: `Unknown verification method: ${String(verification.method)}.`,
    });
  }
  if (!STATUSES.has(verification.status)) {
    issues.push({
      code: "invalid_status",
      message: `Unknown verification status: ${String(verification.status)}.`,
    });
  }

  for (const item of evidence) {
    if (item.verificationId !== verification.id) continue;
    // Guardrail: evidence rows must not pretend to be Person document fields.
    if (item.metadata && "personDocumentBlob" in item.metadata) {
      issues.push({
        code: "evidence_on_person_forbidden",
        message: "Verification evidence must not embed Person document blobs.",
      });
    }
  }

  if (
    FILE_METHODS.has(verification.method) &&
    (verification.status === "submitted" ||
      verification.status === "under_review" ||
      verification.status === "approved")
  ) {
    const hasFile = evidence.some(
      (e) =>
        e.verificationId === verification.id &&
        Boolean(e.fileId) &&
        (e.kind === "certificate_file" ||
          e.kind === "supporting_document_file"),
    );
    if (!hasFile) {
      issues.push({
        code: "file_required_for_method",
        message: `Method ${verification.method} requires Files-backed evidence (fileId).`,
      });
    }
  }

  return issues;
}

/**
 * Whether a verification case may activate its relationship.
 */
export function canActivateRelationshipFromVerification(
  verification: ResidencyVerification,
): boolean {
  return verification.status === "approved";
}
