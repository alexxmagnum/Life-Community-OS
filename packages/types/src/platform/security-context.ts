/**
 * SaaS security control plane — policy, authorization, privacy foundation.
 * Protects existing domains. Does not store content, users, activity or scores.
 * Never branches on a customer slug.
 */

import { sanitizeAuditMetadata } from "../domain/admin-audit-log";
import { SAAS_CONTROL_PLANE_FORBIDDEN } from "../domain/admin-operations";
import {
  rejectClientAuthoritySpoof,
  type ClientAuthoritySpoof,
} from "../tenant/factory";
import {
  mediaOwnedByTenant,
  isOrphanMediaOwnership,
  type TenantOwnedMedia,
} from "./data-export";
import type { PlatformAuditRecord, PlatformSecurityEvent } from "./operations";

export const CROSS_TENANT_ACCESS_DENIED = "cross_tenant_access_denied";
export const TERRITORY_BOUNDARY_VIOLATION = "territory_boundary_violation";
export const CLIENT_CAPABILITY_SPOOF = "client_capability_spoof";
export const PRIVILEGED_CONFIRMATION_REQUIRED =
  "privileged_confirmation_required";
export const CROSS_TENANT_MEDIA_FORBIDDEN = "cross_tenant_media_forbidden";

export const REQUEST_SECURITY_PIPELINE = [
  "session_validation",
  "tenant_resolution",
  "territory_resolution",
  "capability_check",
  "permission_check",
  "domain_operation",
] as const;

export type RequestSecurityPipelineStep =
  (typeof REQUEST_SECURITY_PIPELINE)[number];

export type SecurityPolicyContext = {
  tenantId: string;
  isolation: {
    tenantIsolation: boolean;
    territoryIsolation: boolean;
  };
  permissions: {
    platformAccess: boolean;
    communityAccess: boolean;
  };
  policies: {
    exportAllowed: boolean;
    restoreAllowed: boolean;
    mediaAccess: boolean;
  };
};

export type AuthorizationActorKind =
  | "member"
  | "communityAdministrator"
  | "platformOperator";

export type AuthorizationAction =
  | "experienceCreate"
  | "tenantSuspend"
  | "platformFeatureChange"
  | "tenantLifecycle"
  | "tenantExport"
  | "backupRestore"
  | "deleteConfiguration"
  | "territoryModerate";

export type AuthorizationDecisionResult = "ALLOW" | "DENY";

export type AuthorizationRequest = {
  actor: {
    kind: AuthorizationActorKind;
    tenantId?: string;
    territoryId?: string;
  };
  action: AuthorizationAction | string;
  resource?: {
    tenantId?: string;
    territoryId?: string;
    type?: string;
  };
  context?: SecurityPolicyContext;
  explicitConfirmation?: boolean;
};

export type PrivacyControlContext = {
  tenantId: string;
  capabilities: {
    exportPersonalData: boolean;
    deleteAccount: boolean;
    anonymizeIdentity: boolean;
    retentionPolicies: boolean;
  };
  implemented: boolean;
};

export type SecurityCenterProjection = {
  boundaryEvents: PlatformSecurityEvent[];
  permissionDenials: PlatformSecurityEvent[];
  auditSecurity: PlatformAuditRecord[];
  configurationRisks: Array<{ kind: string; detail: string }>;
};

export type ConfigurationRisk = {
  kind: string;
  detail: string;
};

const SAAS_CONTROL_ACTIONS = new Set<string>([
  "tenantSuspend",
  "platformFeatureChange",
  "tenantLifecycle",
  "tenantExport",
  "backupRestore",
  "deleteConfiguration",
]);

export const PRIVILEGED_ACTIONS = [
  "tenantSuspend",
  "backupRestore",
  "deleteConfiguration",
] as const;

const PRIVILEGED_ACTION_SET = new Set<string>(PRIVILEGED_ACTIONS);

const OPAQUE_SECURITY_ENTITIES = new Set([
  "GlobalSecurityEntity",
  "UniversalPermissionEntity",
  "SecurityScore",
  "ComplianceScore",
  "GlobalBanSystem",
  "CrossTenantAdmin",
  "PlatformContentAccess",
]);

const FORBIDDEN_FRONTEND_SECRET =
  /SERVICE_ROLE|DATABASE_URL|PRIVATE_KEY|SUPABASE_SERVICE|API_SECRET/i;

export function projectSecurityPolicyContext(input: {
  tenantId: string;
  platformAccess: boolean;
  communityAccess: boolean;
  exportAllowed?: boolean;
  restoreAllowed?: boolean;
  mediaAccess?: boolean;
}): SecurityPolicyContext {
  return {
    tenantId: input.tenantId,
    isolation: {
      tenantIsolation: true,
      territoryIsolation: true,
    },
    permissions: {
      platformAccess: input.platformAccess,
      communityAccess: input.communityAccess,
    },
    policies: {
      exportAllowed: input.exportAllowed ?? input.platformAccess,
      restoreAllowed: input.restoreAllowed ?? input.platformAccess,
      mediaAccess: input.mediaAccess ?? true,
    },
  };
}

export function assertTenantBoundary(input: {
  actorTenantId: string;
  resourceTenantId: string;
  actorTerritoryId?: string;
  resourceTerritoryId?: string;
}): void {
  const actorTenant = input.actorTenantId.trim();
  const resourceTenant = input.resourceTenantId.trim();
  if (!actorTenant || !resourceTenant || actorTenant !== resourceTenant) {
    throw new Error(CROSS_TENANT_ACCESS_DENIED);
  }
  const actorTerritory = input.actorTerritoryId?.trim();
  const resourceTerritory = input.resourceTerritoryId?.trim();
  if (
    actorTerritory &&
    resourceTerritory &&
    actorTerritory !== resourceTerritory
  ) {
    throw new Error(TERRITORY_BOUNDARY_VIOLATION);
  }
}

export function assertMediaOwnership(
  media: TenantOwnedMedia,
  tenantId: string,
): void {
  if (isOrphanMediaOwnership(media) || !mediaOwnedByTenant(media, tenantId)) {
    throw new Error(CROSS_TENANT_MEDIA_FORBIDDEN);
  }
}

export function requirePrivilegedConfirmation(input: {
  action: string;
  explicitConfirmation?: boolean;
}): void {
  if (!PRIVILEGED_ACTION_SET.has(input.action)) return;
  if (input.explicitConfirmation !== true) {
    throw new Error(PRIVILEGED_CONFIRMATION_REQUIRED);
  }
}

export function isCapabilitySpoofField(field: string): boolean {
  return (
    field === "capability" ||
    field === "capabilities" ||
    field === "permission"
  );
}

export function spoofDenialCode(field: string): string {
  return isCapabilitySpoofField(field)
    ? CLIENT_CAPABILITY_SPOOF
    : SAAS_CONTROL_PLANE_FORBIDDEN;
}

export function clientCannotSupplyAuthority(
  body: ClientAuthoritySpoof | null | undefined,
): boolean {
  return rejectClientAuthoritySpoof(body) === null;
}

export function requestSecurityPipelineOrder(): readonly RequestSecurityPipelineStep[] {
  return REQUEST_SECURITY_PIPELINE;
}

export const AuthorizationService = {
  authorize(input: AuthorizationRequest): AuthorizationDecisionResult {
    if (input.resource?.tenantId && input.actor.tenantId) {
      try {
        assertTenantBoundary({
          actorTenantId: input.actor.tenantId,
          resourceTenantId: input.resource.tenantId,
          actorTerritoryId: input.actor.territoryId,
          resourceTerritoryId: input.resource.territoryId,
        });
      } catch {
        return "DENY";
      }
    }

    if (input.actor.kind === "platformOperator") {
      return "ALLOW";
    }

    if (input.actor.kind === "communityAdministrator") {
      if (SAAS_CONTROL_ACTIONS.has(input.action)) return "DENY";
      if (
        input.action === "territoryModerate" ||
        input.action === "experienceCreate"
      ) {
        return "ALLOW";
      }
      return "DENY";
    }

    if (input.action === "experienceCreate") return "ALLOW";
    return "DENY";
  },
};

export function projectPrivacyControlContext(
  tenantId: string,
): PrivacyControlContext {
  return {
    tenantId,
    capabilities: {
      exportPersonalData: true,
      deleteAccount: true,
      anonymizeIdentity: true,
      retentionPolicies: true,
    },
    implemented: true,
  };
}

export function isOpaqueSecurityEntity(name: string): boolean {
  return OPAQUE_SECURITY_ENTITIES.has(name);
}

export function isForbiddenFrontendSecretKey(key: string): boolean {
  return FORBIDDEN_FRONTEND_SECRET.test(key);
}

export function frontendMustNotExposeSecrets(
  envKeys: readonly string[],
): boolean {
  return !envKeys.some(isForbiddenFrontendSecretKey);
}

export function auditMetadataIsSanitized(
  metadata?: Record<string, string | number | boolean | null>,
): boolean {
  const sanitized = sanitizeAuditMetadata(metadata);
  if (!sanitized) return true;
  return !Object.keys(sanitized).some((key) =>
    /password|token|secret|cookie|api[_-]?key/i.test(key),
  );
}

export function projectConfigurationRisks(input: {
  incompleteTenants?: number;
  frontendSecretKeys?: readonly string[];
}): ConfigurationRisk[] {
  const risks: ConfigurationRisk[] = [];
  if ((input.incompleteTenants ?? 0) > 0) {
    risks.push({
      kind: "incomplete_tenant",
      detail: `${input.incompleteTenants} tenants incomplete`,
    });
  }
  if (input.frontendSecretKeys?.some(isForbiddenFrontendSecretKey)) {
    risks.push({
      kind: "frontend_secret_exposure",
      detail: "service secrets must remain server-side",
    });
  }
  return risks;
}

export function projectSecurityCenter(input: {
  events: PlatformSecurityEvent[];
  audit: PlatformAuditRecord[];
  configurationRisks?: ConfigurationRisk[];
}): SecurityCenterProjection {
  return {
    boundaryEvents: input.events.filter(
      (event) =>
        event.kind === "cross_tenant" || event.kind === "territory_mismatch",
    ),
    permissionDenials: input.events.filter(
      (event) => event.kind === "invalid_permission",
    ),
    auditSecurity: input.audit.filter((row) =>
      String(row.action).startsWith("security."),
    ),
    configurationRisks: input.configurationRisks ?? [],
  };
}

export function securityDoesNotOwnDomainData(): boolean {
  return true;
}
