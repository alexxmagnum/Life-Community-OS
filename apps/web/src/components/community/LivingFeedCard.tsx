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
  type CommunityFeedItem,
} from "@life-community-os/types";
import { ActivityCard, staggerItemProps } from "@life-community-os/ui";

export type LivingFeedCardProps = {
  item: CommunityFeedItem;
  index?: number;
  fallbackImage: string;
  onOpenPlace?: (locationId: string) => void;
  onOpenHref?: (href: string) => void;
};

export function LivingFeedCard({
  item,
  index = 0,
  fallbackImage,
  onOpenPlace,
  onOpenHref,
}: LivingFeedCardProps) {
  const stagger = staggerItemProps(index);
  const href = communityFeedItemHref(item);
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
        className="ui-lift"
        title={item.title}
        when={communityFeedTimeLabel(item) ?? communityFeedPrimaryLabel(item)}
        where={item.metadata?.locationLabel || item.description || ""}
        peopleLabel={communityFeedLivingLabel(item)}
        imageUrl={item.metadata?.imageUrl?.trim() || fallbackImage}
        ctaLabel={communityFeedPrimaryLabel(item)}
        onClick={open}
        onCta={() => onOpenHref?.(href)}
      />
    </div>
  );
}
