/**
 * Production environment governance — operational state only.
 * No users, messages, content or domain activity.
 */

export const DEPLOYMENT_ENVIRONMENTS = ["local", "staging", "production"] as const;

export type DeploymentEnvironment = (typeof DEPLOYMENT_ENVIRONMENTS)[number];

export const DEPLOYMENT_STATUSES = [
  "idle",
  "deploying",
  "ready",
  "failed",
] as const;

export type DeploymentStatus = (typeof DEPLOYMENT_STATUSES)[number];

export const CONFIGURATION_HEALTH_STATUSES = [
  "healthy",
  "warning",
  "critical",
  "unknown",
] as const;

export type ConfigurationHealthStatus =
  (typeof CONFIGURATION_HEALTH_STATUSES)[number];

export type ProductionEnvironmentContext = {
  environment: DeploymentEnvironment;
  deploymentStatus: DeploymentStatus;
  version: string;
  commitHash?: string;
  lastDeployment?: string;
  configurationHealth: ConfigurationHealthStatus;
};

export function resolveDeploymentEnvironment(
  value?: string | null,
): DeploymentEnvironment {
  const normalized = value?.trim().toLowerCase();
  if (normalized === "staging") return "staging";
  if (normalized === "production") return "production";
  return "local";
}

export function projectProductionEnvironmentContext(input: {
  environment?: string | null;
  version?: string;
  commitHash?: string;
  lastDeployment?: string;
  configurationHealth?: ConfigurationHealthStatus;
  deploymentStatus?: DeploymentStatus;
}): ProductionEnvironmentContext {
  const environment = resolveDeploymentEnvironment(input.environment);
  return {
    environment,
    deploymentStatus: input.deploymentStatus ?? "ready",
    version: input.version?.trim() || "0.0.0",
    ...(input.commitHash?.trim() ? { commitHash: input.commitHash.trim() } : {}),
    ...(input.lastDeployment ? { lastDeployment: input.lastDeployment } : {}),
    configurationHealth: input.configurationHealth ?? "unknown",
  };
}

export function environmentContainsDomainData(
  context: ProductionEnvironmentContext,
): boolean {
  return (
    "users" in context ||
    "messages" in context ||
    "conversations" in context ||
    "feed" in context
  );
}
