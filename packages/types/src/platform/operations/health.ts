/**
 * Platform health observability — infrastructure signals only.
 * Never observes users, messages, social activity or engagement.
 */

export const PLATFORM_HEALTH_STATUSES = [
  "healthy",
  "warning",
  "critical",
  "unknown",
] as const;

export type PlatformHealthStatus = (typeof PLATFORM_HEALTH_STATUSES)[number];

export const PLATFORM_HEALTH_COMPONENTS = [
  "api",
  "database",
  "storage",
  "authentication",
  "realtime",
] as const;

export type PlatformHealthComponent =
  (typeof PLATFORM_HEALTH_COMPONENTS)[number];

export type PlatformHealthSignal = {
  component: PlatformHealthComponent;
  status: PlatformHealthStatus;
  detail?: string;
  checkedAt: string;
};

export type PlatformHealthContext = {
  overall: PlatformHealthStatus;
  signals: PlatformHealthSignal[];
  checkedAt: string;
};

export function worstHealthStatus(
  statuses: readonly PlatformHealthStatus[],
): PlatformHealthStatus {
  if (statuses.includes("critical")) return "critical";
  if (statuses.includes("warning")) return "warning";
  if (statuses.every((row) => row === "healthy")) return "healthy";
  return "unknown";
}

export function projectPlatformHealthContext(input: {
  signals: readonly PlatformHealthSignal[];
  checkedAt?: string;
}): PlatformHealthContext {
  const checkedAt = input.checkedAt ?? new Date().toISOString();
  const overall = worstHealthStatus(input.signals.map((row) => row.status));
  return {
    overall,
    signals: [...input.signals],
    checkedAt,
  };
}

export function platformHealthObservesDomainData(
  context: PlatformHealthContext,
): boolean {
  return context.signals.some(
    (row) =>
      row.detail?.includes("message") ||
      row.detail?.includes("engagement") ||
      row.detail?.includes("user_activity"),
  );
}
