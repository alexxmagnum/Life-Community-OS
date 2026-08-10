import type { NotificationContextRef } from "@life-community-os/types";

/**
 * Resolve in-app deep link from Platform Notification context.
 * Tenant-agnostic route map for known context types — not Panoramica-specific.
 */
export function hrefForNotificationContext(
  context?: NotificationContextRef,
): string | undefined {
  if (!context?.contextType || !context.contextId) return undefined;

  switch (context.contextType) {
    case "marketplace":
      return `/marketplace/${context.contextId}/conversation`;
    case "service":
      return `/services/work/${context.contextId}/conversation`;
    case "experience":
      return `/experiences/${context.contextId}`;
    case "group":
      return `/community/groups/${context.contextId}/conversation`;
    case "official":
      return `/official/${context.contextId}`;
    case "place":
      return `/near/place/${context.contextId}/conversation`;
    case "reservation":
      return `/reservations`;
    case "housing_listing":
      // Extension point — housing surface not shipped yet.
      return undefined;
    default:
      return undefined;
  }
}
