import type { DomainId } from "./ids";

/**
 * Trust / verification signal for public representation (ADR-016 / ADR-035).
 * Not a Permission and not a Membership type.
 */
export type VerificationLevel =
  | "official_verified"
  | "business_verified"
  | "community_member"
  | "unverified";
