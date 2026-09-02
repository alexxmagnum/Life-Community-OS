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
import { communityFeedCardImageUrl } from "@/lib/location/location-card-asset";

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
  fallbackImage,
  onOpenPlace,
  onOpenHref,
  reason,
}: LivingFeedCardProps) {
  const stagger = staggerItemProps(index);
  const href = communityFeedItemHref(item);
  const state = livingFeedCardState(item);
  const imageUrl =
    item.metadata?.imageUrl?.trim() ||
    fallbackImage ||
    communityFeedCardImageUrl(item);
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
          [
            communityFeedLivingLabel(item),
            item.metadata?.trustLabel,
            reason ? `Porque: ${reason}` : null,
          ]
            .filter(Boolean)
            .join(" · ") || undefined
        }
        imageUrl={imageUrl}
        badgeLabel={livingFeedCardStateLabel(state)}
        ctaLabel={communityFeedPrimaryLabel(item)}
        onClick={open}
        onCta={() => onOpenHref?.(href)}
      />
    </div>
  );
}
