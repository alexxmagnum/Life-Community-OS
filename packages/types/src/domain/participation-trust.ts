import type { DomainId } from "./ids";

/**
 * Soft community trust projection from participation history.
 * Not a Permission, not a punitive score, not AuthZ (Phase 1 foundation only).
 */
export type ParticipationTrust = {
  personId: DomainId;
  territoryId: DomainId;
  participationsCount: number;
  /** 0–1 attendance rate when known; omit if insufficient data. */
  attendanceRate?: number;
};
