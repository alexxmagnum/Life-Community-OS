/**
 * Community activation metrics — real activity counts, not engagement.
 * No likes, followers, time spent, or ranking.
 */

export type CommunityActivationMetrics = {
  tenantId: string;
  experiencesCreated: number;
  experiencesParticipants: number;
  announcementsPublished: number;
  businessesPublished: number;
  servicesAvailable: number;
  reservationsCompleted: number;
  helpRequestsCreated: number;
  helpRequestsCompleted: number;
};

export const EMPTY_COMMUNITY_ACTIVATION_METRICS = (
  tenantId: string,
): CommunityActivationMetrics => ({
  tenantId,
  experiencesCreated: 0,
  experiencesParticipants: 0,
  announcementsPublished: 0,
  businessesPublished: 0,
  servicesAvailable: 0,
  reservationsCompleted: 0,
  helpRequestsCreated: 0,
  helpRequestsCompleted: 0,
});

/** Guard: metrics must never expose engagement-style fields. */
export const FORBIDDEN_ACTIVATION_METRIC_KEYS = [
  "likes",
  "followers",
  "timeSpent",
  "ranking",
  "engagementScore",
] as const;
