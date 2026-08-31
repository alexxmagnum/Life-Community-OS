"use client";

/**
 * Living feed card — UI projection of Community Experience Feed.
 * Not a content entity.
 */

import {
  communityFeedItemHref,
  communityFeedLivingLabel,
  communityFeedPrimaryLabel,
  communityFeedTimeLabel,
  livingFeedCardState,
  livingFeedCardStateLabel,
  type CommunityFeedItem,
} from "@life-community-os/types";
import { ActivityCard, staggerItemProps } from "@life-community-os/ui";

const FALLBACK_IMAGE =
  "/assets/3d/platform/community/neighbours/scene/neighbours.webp";

export type LivingFeedCardProps = {
  item: CommunityFeedItem;
  index?: number;
  fallbackImage?: string;
  reason?: string;
  onOpenPlace?: (locationId: string) => void;
  onOpenHref?: (href: string) => void;
};

export function LivingFeedCard({
  item,
  index = 0,
  fallbackImage = FALLBACK_IMAGE,
  onOpenPlace,
  onOpenHref,
  reason,
}: LivingFeedCardProps) {
  const stagger = staggerItemProps(index);
  const href = communityFeedItemHref(item);
  const state = livingFeedCardState(item);
  const open = () => {
    if (item.locationId && onOpenPlace) {
      onOpenPlace(item.locationId);
      return;
    }
    onOpenHref?.(href);
  };
  return (
    <div className={stagger.className} data-stagger-index={stagger["data-stagger-index"]}>
      <ActivityCard
        className="ui-press ui-lift"
        title={item.title}
        when={communityFeedTimeLabel(item) ?? communityFeedPrimaryLabel(item)}
        where={item.metadata?.locationLabel || item.description || ""}
        peopleLabel={
          [communityFeedLivingLabel(item), reason ? `Porque: ${reason}` : null]
            .filter(Boolean)
            .join(" · ") || undefined
        }
        imageUrl={item.metadata?.imageUrl?.trim() || fallbackImage}
        badgeLabel={livingFeedCardStateLabel(state)}
        ctaLabel={communityFeedPrimaryLabel(item)}
        onClick={open}
        onCta={() => onOpenHref?.(href)}
      />
    </div>
  );
}
