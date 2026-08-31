/**
 * Action Composer client — opens the + sheet from Home, Discover, Life Place, Life Map.
 * Does not persist. The server stamps actor + Active Territory on create.
 */

export const ACTION_COMPOSER_EVENT = "lcos:open-create";

export type ActionComposerDetail = {
  locationId?: string;
  locationName?: string;
};

export function openActionComposer(detail?: ActionComposerDetail): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<ActionComposerDetail>(ACTION_COMPOSER_EVENT, {
      detail: {
        locationId: detail?.locationId?.trim() || undefined,
        locationName: detail?.locationName?.trim() || undefined,
      },
    }),
  );
}
