/**
 * Trust projection helpers — reorder and label existing domain data.
 * Never persist a score. Never hide content.
 */

import type { CommunityFeedItem } from "../community/community-feed";

export function applyTrustedOrganizerBoost(input: {
  feed: readonly CommunityFeedItem[];
  trustedOrganizerIds: readonly string[];
}): CommunityFeedItem[] {
  const trusted = new Set(
    input.trustedOrganizerIds.map((id) => id.trim()).filter(Boolean),
  );
  if (trusted.size === 0) return [...input.feed];
  return [...input.feed]
    .map((item, index) => ({ item, index }))
    .sort((left, right) => {
      const leftHit = trusted.has(left.item.metadata?.organizerPersonId ?? "")
        ? 1
        : 0;
      const rightHit = trusted.has(right.item.metadata?.organizerPersonId ?? "")
        ? 1
        : 0;
      if (leftHit !== rightHit) return rightHit - leftHit;
      return left.index - right.index;
    })
    .map(({ item }) => item);
}
