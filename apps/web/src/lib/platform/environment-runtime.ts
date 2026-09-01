/**
 * Environment runtime — operational environment posture.
 * Does not mutate business domains.
 */

import {
  projectProductionEnvironmentContext,
  type ProductionEnvironmentContext,
} from "@life-community-os/types";

function readPackageVersion(): string {
  try {
    const pkg = process.env.npm_package_version;
    if (pkg?.trim()) return pkg.trim();
  } catch {
    /* ignore */
  }
  return "0.0.0";
}

export const EnvironmentRuntime = {
  resolve(): ProductionEnvironmentContext {
    const environment =
      process.env.LCOS_DEPLOYMENT_ENV ??
      process.env.NODE_ENV ??
      process.env.VERCEL_ENV ??
      "local";
    const commitHash =
      process.env.VERCEL_GIT_COMMIT_SHA ??
      process.env.GITHUB_SHA ??
      process.env.COMMIT_HASH;
    const configurationHealth =
      process.env.SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL
        ? ("healthy" as const)
        : process.env.NODE_ENV === "production"
          ? ("warning" as const)
          : ("unknown" as const);
    return projectProductionEnvironmentContext({
      environment,
      version: readPackageVersion(),
      commitHash,
      lastDeployment: process.env.LCOS_LAST_DEPLOYMENT,
      configurationHealth,
      deploymentStatus: "ready",
    });
  },
};
