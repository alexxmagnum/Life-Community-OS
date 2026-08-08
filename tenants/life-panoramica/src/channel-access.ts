import type { Channel } from "@life-community-os/types";

import { getChannelById } from "./channels";
import { personHasVerifiedResidencyInArea } from "./residency-demo";

/**
 * Private / restricted channel gate (ADR-035 + ADR-038).
 * Claim (pending_verification) never unlocks these channels.
 */
export function canAccessChannel(
  channel: Channel | string,
  personId: string,
): { allowed: boolean; reason: string } {
  const ch =
    typeof channel === "string" ? getChannelById(channel) : channel;
  if (!ch || ch.status !== "active") {
    return { allowed: false, reason: "channel_unavailable" };
  }
  if (!ch.requiresVerifiedResidency) {
    return { allowed: true, reason: "open_channel" };
  }
  if (!ch.communityAreaId) {
    return { allowed: false, reason: "missing_channel_area" };
  }
  if (personHasVerifiedResidencyInArea(personId, ch.communityAreaId)) {
    return { allowed: true, reason: "verified_residency" };
  }
  return { allowed: false, reason: "verified_residency_required" };
}
