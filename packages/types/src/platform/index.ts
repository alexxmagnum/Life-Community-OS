export type {
  TenantResolutionSource,
  TenantContext,
  PlatformContext,
  ExecutionContext,
  TenantContextCarrier,
} from "./tenant-context";

export type {
  ActingIdentityId,
  AuthenticationResult,
  AuthorizationDecision,
} from "./security-boundaries";

export type {
  PlatformModule,
  PlatformModuleCategory,
  PlatformModuleStatus,
  PlatformModuleNavigation,
  PlatformModuleRegistryIssue,
  PlatformModuleRegistryDocument,
} from "./module-registry";
export {
  PLATFORM_MODULE_REGISTRY_VERSION,
  PLATFORM_MODULE_REGISTRY,
  listPlatformModules,
  listRootPlatformModules,
  getPlatformModuleById,
  listPlatformModulesByFeatureFlag,
  validatePlatformModuleRegistry,
  getPlatformModuleRegistryDocument,
} from "./module-registry";

export type {
  TenantConfiguration,
  TenantConfigurationBranding,
  TenantConfigurationTerritory,
  TenantModuleEnablement,
  TenantPackConfigurationSource,
  TenantConfigurationSource,
  TenantConfigurationPreset,
} from "./tenant-configuration";
export {
  resolveModuleEnabledFromFeatures,
  tenantPackToTenantConfiguration,
  resolveTenantConfiguration,
  isTenantModuleEnabled,
  applyTenantConfigurationPreset,
  assertTenantConfigurationCoversRegistry,
} from "./tenant-configuration";
