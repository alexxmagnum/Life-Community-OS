/**
 * Action Composer client — opens the + sheet from Home, Discover, Life Place, Life Map.
 * Does not persist. The server stamps actor + Active Territory on create.
 */

import {
  isCommunityCreationSource,
  sanitizeCommunityCreationContext,
  type CommunityCreationContext,
  type CommunityCreationSource,
} from "@life-community-os/types";

export const ACTION_COMPOSER_EVENT = "lcos:open-create";

export type ActionComposerDetail = CommunityCreationContext;

export function inferCreationSource(
  pathname: string,
): CommunityCreationSource {
  if (pathname === "/" || pathname === "") return "home";
  if (pathname.startsWith("/map") || pathname.startsWith("/locations")) {
    return "life_map";
  }
  if (pathname.startsWith("/discover")) return "discover";
  return "global_plus";
}

export function openActionComposer(detail?: ActionComposerDetail): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<ActionComposerDetail>(ACTION_COMPOSER_EVENT, {
      detail: sanitizeCommunityCreationContext({
        source: isCommunityCreationSource(detail?.source)
          ? detail.source
          : undefined,
        locationId: detail?.locationId,
        locationName: detail?.locationName,
      }),
    }),
  );
}
