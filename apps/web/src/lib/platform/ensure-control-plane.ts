/**
 * Seed SaaS control-plane operators and observe already-configured tenants.
 * Does not load community users, messages, or domain content.
 */

import { featuresForPlan } from "@life-community-os/types";
import { listTenantManifest } from "@/lib/tenant/manifest";
import { getTenantPack } from "@/lib/tenant/registry";
import {
  TenantFactoryRuntime,
  replacePlatformOperatorsForTests,
} from "@/lib/tenant/tenant-factory-service";

function operatorIdsFromEnv(): string[] {
  const fromEnv = (process.env.LCOS_PLATFORM_OPERATOR_PERSON_IDS ?? "")
    .split(",")
    .map((row) => row.trim())
    .filter(Boolean);
  if (
    process.env.LCOS_PLATFORM_FIXTURE === "1" &&
    !fromEnv.includes("person-platform")
  ) {
    fromEnv.push("person-platform");
  }
  return fromEnv;
}

export function ensurePlatformOperators(): void {
  if (TenantFactoryRuntime.snapshot().operators.length > 0) return;
  const ids = operatorIdsFromEnv();
  if (!ids.length) return;
  replacePlatformOperatorsForTests(
    ids.map((personId) => ({ personId, status: "active" as const })),
  );
}

export function observeRegisteredTenants(): void {
  for (const identity of listTenantManifest()) {
    const pack = getTenantPack(identity.slug);
    TenantFactoryRuntime.adoptConfigured({
      identity,
      branding: {
        name: pack?.theme.name ?? identity.name,
        shortName: pack?.theme.shortName,
        primaryColor: pack?.theme.colors.brandPrimary,
      },
      features: pack?.productCapabilities ?? featuresForPlan("community"),
      territories: [
        {
          id: identity.territoryUuid,
          name: identity.name,
          slug: identity.slug,
          locale: identity.locale,
          timezone: identity.timezone,
        },
      ],
    });
  }
}

export function ensurePlatformControlPlane(): void {
  ensurePlatformOperators();
  observeRegisteredTenants();
}
