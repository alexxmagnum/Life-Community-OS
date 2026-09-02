export type * from "./domain";
export type * from "./platform";

/** Community Core snapshot helper. */
export { emptyCommunityDomain } from "./domain/community-core";

/** Community Experience Feed — projection of existing domains, not a SoT. */
export type {
  CommunityFeedItem,
  CommunityFeedItemType,
  CommunityFeedPrimaryAction,
  CommunityFeedRankBand,
  CommunityFeedCapacity,
  CommunityFeedItemMetadata,
  CommunityFeedResponse,
  CommunityExperienceFeedQuery,
  DiscoverExperienceQuery,
  CommunityFeedLifeMapContext,
  ProjectExperienceFeedInput,
  ProjectEventFeedInput,
  ProjectResourceFeedInput,
  ProjectBusinessFeedInput,
  ProjectHelpFeedInput,
  LivingCommunityFeedPartition,
  LivingFeedCardState,
} from "./community/community-feed";
export {
  COMMUNITY_FEED_ITEM_TYPES,
  COMMUNITY_FEED_PRIMARY_ACTIONS,
  COMMUNITY_FEED_RANK_BANDS,
  LIVING_EMPTY_TITLE,
  LIVING_EMPTY_DESCRIPTION,
  LIVING_EMPTY_CTA,
  LIVING_PLACE_EMPTY_TITLE,
  LIVING_PLACE_EMPTY_DESCRIPTION,
  LIVING_PLACE_EMPTY_CTA,
  livingFeedCardState,
  livingFeedCardStateLabel,
  isCommunityFeedItemType,
  isCommunityFeedPrimaryAction,
  isHelpFeedItem,
  isLivingMomentFeedItem,
  communityFeedOccupied,
  communityFeedLivingLabel,
  communityFeedTimeLabel,
  partitionLivingCommunityFeed,
  discoverExperienceQuery,
  primaryActionForFeedType,
  communityFeedPrimaryLabel,
  communityFeedItemHref,
  feedSourceEnabled,
  filterFeedItemsByCapabilities,
  occupancyRatio,
  communityFeedRankBand,
  sortCommunityFeedItems,
  projectExperienceToFeedItem,
  projectEventToFeedItem,
  projectResourceToFeedItem,
  projectBusinessToFeedItem,
  projectHelpToFeedItem,
  lifeMapContextFromFeedItem,
  lifeMapContextsFromFeed,
} from "./community/community-feed";

/** Action Composer — intention layer, not a creation domain. */
export type {
  CommunityCreationActionType,
  CommunityCreationAction,
  CommunityCreationSource,
  CommunityCreationContext,
  CommunityActionRegistryInput,
} from "./community/action-composer";
export {
  COMMUNITY_CREATION_ACTION_TYPES,
  COMMUNITY_CREATION_SOURCES,
  COMMUNITY_CREATION_ACTIONS,
  isCommunityCreationActionType,
  isCommunityCreationSource,
  sanitizeCommunityCreationContext,
  communityCreationRoute,
  isCommunityCreationActionAvailable,
  listCommunityCreationActions,
  CommunityActionRegistry,
  magicPlusSectionIdForActionType,
} from "./community/action-composer";

/** Community Operations — daily territorial projection, not a life domain. */
export type {
  CommunityOperationActionKind,
  CommunityOperationAction,
  CommunityOperationsToday,
  CommunityOperationsContext,
  TerritoryAnnouncement,
  TerritoryDailyPulse,
  LifePlaceOperationsStatus,
  LifePlaceOperations,
} from "./community/operations";
export {
  COMMUNITY_OPERATION_ACTION_KINDS,
  LIFE_PLACE_OPERATIONS_STATUSES,
  emptyCommunityOperationsContext,
  projectCommunityOperationsContext,
  communityOperationActionLabel,
  announcementFromPost,
  projectTerritoryDailyPulse,
  personalizeTerritoryDailyPulse,
  deriveLifePlaceOperations,
  composerTitleForSource,
  isOpaqueDailyLifeEntity,
} from "./community/operations";

/** Structured community announcements — territorial actions, not social posts. */
export type {
  CommunityAnnouncementCategory,
  CommunityAnnouncementPriority,
  CommunityAnnouncementAudience,
  CommunityAnnouncementMeta,
} from "./community/announcement";
export {
  COMMUNITY_ANNOUNCEMENT_CATEGORIES,
  COMMUNITY_ANNOUNCEMENT_PRIORITIES,
  COMMUNITY_ANNOUNCEMENT_AUDIENCES,
  communityAnnouncementCategoryLabel,
  isOfficialAnnouncementCategory,
  announcementMetaFromPost,
  projectStructuredAnnouncement,
} from "./community/announcement";

/** Activation empty states — guide users without fake content. */
export {
  COMMUNITY_NOW_EMPTY_TITLE,
  COMMUNITY_NOW_EMPTY_DESCRIPTION,
  COMMUNITY_GROUPS_EMPTY_TITLE,
  COMMUNITY_GROUPS_EMPTY_DESCRIPTION,
  COMMUNITY_GROUPS_EMPTY_CTA,
  COMMUNITY_HELP_EMPTY_TITLE,
  COMMUNITY_HELP_EMPTY_DESCRIPTION,
  COMMUNITY_HELP_EMPTY_CTA,
  COMMUNITY_OFFICIAL_ANNOUNCEMENTS_TITLE,
  COMMUNITY_OFFICIAL_ANNOUNCEMENTS_DESCRIPTION,
  COMMUNITY_OFFICIAL_ANNOUNCEMENTS_CTA,
  COMMUNITY_OFFICIAL_ANNOUNCEMENTS_VISITOR,
  HOME_ANNOUNCEMENTS_EMPTY,
  HOME_ANNOUNCEMENTS_CTA,
  HOME_HELP_CTA,
  HOME_SERVICES_EMPTY_TITLE,
  HOME_SERVICES_EMPTY_CTA,
  COMMUNITY_ACTIVATION_PANEL_TITLE,
  COMMUNITY_ACTIVATION_PANEL_DESCRIPTION,
  COMMUNITY_ACTIVATION_VISITOR_CTA,
  LIVING_PLACE_CREATE_CTA,
  SERVICES_PROFESSIONALS_EMPTY_TITLE,
  SERVICES_PROFESSIONALS_EMPTY_DESCRIPTION,
  SERVICES_PROFESSIONALS_EMPTY_CTA,
  SERVICES_PROFESSIONALS_VISITOR,
  RESERVATIONS_EMPTY_TITLE,
  RESERVATIONS_EMPTY_DESCRIPTION,
  RESERVATIONS_EMPTY_CTA,
  PROFILE_VISITOR_TITLE,
  PROFILE_VISITOR_DESCRIPTION,
  PROFILE_REGISTERED_TITLE,
  DEAD_EMPTY_COPY_PATTERNS,
} from "./community/activation-empty-states";

export type { CommunityActivationMetrics } from "./community/community-activation-metrics";
export {
  EMPTY_COMMUNITY_ACTIVATION_METRICS,
  FORBIDDEN_ACTIVATION_METRIC_KEYS,
} from "./community/community-activation-metrics";

/** Territory Home & resident experience evolution — projection only. */
export type {
  LifeHomeTerritoryHero,
  LifeHomePlace,
  LifeHomeAction,
  LifeHomeEmptyState,
  LifeHomeMembershipScope,
  LifeHomeContext,
  ProfileLifeContext,
} from "./community/life-home";
export {
  resolveLifeHomeMembershipScope,
  projectLifeHomeContext,
  projectProfileLifeContext,
  isOpaqueCommunityExperienceEntity,
  personalizationDoesNotInventContent,
  homeShowsTerritoryLife,
} from "./community/life-home";

/** Discover Experience — territorial exploration, not a catalog. */
export type {
  DiscoverServiceSummary,
  DiscoverHelpSummary,
  DiscoverExperienceContext,
} from "./community/discover-experience";
export {
  projectDiscoverExperienceContext,
  discoverUsesRealDomainData,
} from "./community/discover-experience";

/** Community Intelligence — contextual suggestions, not opaque AI authority. */
export type {
  CommunityIntelligenceProviderId,
  CommunitySuggestionKind,
  CommunitySuggestion,
  CommunityIntelligenceContext,
  CommunityIntelligenceInput,
  CommunityIntelligenceProvider,
  RecommendationProvider,
  ExplanationProvider,
} from "./community/intelligence";
export {
  COMMUNITY_INTELLIGENCE_PROVIDER_IDS,
  explainSuggestion,
  resolveDailyIdeas,
  resolvePlaceIdeas,
  resolveContributionIdeas,
  resolveSuggestions,
  projectCommunityIntelligenceContext,
  RuleBasedCommunityIntelligenceProvider,
  intelligenceDoesNotInventContent,
  intelligenceRespectsTerritory,
  isOpaqueCommunityIntelligenceEntity,
  suggestionUsesExplicitPreference,
  matchingInterestsForSuggestion,
} from "./community/intelligence";

/** Community Automation — proactive assistance, user confirms every delivery. */
export type {
  CommunityAutomationProviderId,
  CommunityAutomationTriggerKind,
  CommunityAutomationTrigger,
  CommunityAutomationPreview,
  CommunityOperationalHint,
  CommunityAutomationPermissions,
  CommunityAutomationContext,
  CommunityAutomationInput,
  ReservationAutomationRow,
  ExperienceAutomationRow,
  AutomationProvider,
  TriggerResolver,
  NotificationPlanner,
} from "./community/automation";
export {
  COMMUNITY_AUTOMATION_PROVIDER_IDS,
  COMMUNITY_AUTOMATION_TRIGGER_KINDS,
  resolveReminders,
  resolveCommunitySuggestions,
  resolveOperationalHints,
  resolveAdminOperationalHints,
  resolveTriggers,
  createAutomationPreview,
  planAutomationNotifications,
  projectCommunityAutomationContext,
  RuleBasedAutomationProvider,
  RuleBasedNotificationPlanner,
  automationRespectsTerritory,
  automationRequiresConfirmation,
  automationDoesNotAutoExecute,
  isOpaqueCommunityAutomationEntity,
  operationalHintsFromPlace,
} from "./community/automation";

/** Community Communication — territorial messaging without a social network. */
export type {
  CommunityChannelKind,
  CommunityCommunicationLayer,
  CommunityCommunicationNotificationKind,
  CommunityChannelContext,
  CommunityConversationSummary,
  CommunityAnnouncementExperience,
  ExperienceConversationContext,
  CommunityCommunicationPreferences,
  CommunityUnreadContext,
  CommunityCommunicationPermissions,
  CommunityCommunicationComposerHint,
  CommunityCommunicationContext,
  CommunityCommunicationInput,
  LifeHomeCommunicationSummary,
} from "./community/communication";
export {
  COMMUNITY_CHANNEL_KINDS,
  COMMUNITY_COMMUNICATION_LAYERS,
  COMMUNITY_COMMUNICATION_NOTIFICATION_KINDS,
  ConversationExperienceService,
  resolveChannelKind,
  resolveCommunicationLayer,
  resolveConversation,
  resolveChannels,
  resolveUnreadContext,
  resolveCommunicationPreferences,
  announcementExperienceFromTerritory,
  resolveComposerHints,
  projectCommunityCommunicationContext,
  projectLifeHomeCommunicationSummary,
  communicationRespectsTerritory,
  privateConversationProtected,
  isOpaqueCommunityCommunicationEntity,
} from "./community/communication";

/** Tenant Factory — SaaS community deployment, not a customer fork. */
export type {
  TenantPlan,
  CommunityOnboardingStep,
  TenantBrandingSlice,
  ProvisionedTenant,
  TerritoryProvisionInput,
  TenantProvisionRequest,
  TenantProvisionResult,
  TenantConfigurationContext,
  PlatformOperator,
  TenantAdministratorSeed,
  TenantFactorySnapshot,
  ClientAuthoritySpoof,
} from "./tenant/factory";
export {
  TENANT_PLANS,
  COMMUNITY_ONBOARDING_STEPS,
  PACK_MAY_PROVIDE,
  PACK_MUST_NOT_PROVIDE,
  emptyTenantFactorySnapshot,
  isTenantPlan,
  featuresForPlan,
  tenantFeatureFlagsFromProduct,
  enabledModulesFromFeatures,
  featureOnDoesNotGrantPermissions,
  packCannotControlAuthz,
  canAccessPlatformAdmin,
  rejectClientAuthoritySpoof,
  TerritoryProvisionService,
  TenantFactoryService,
  adoptConfiguredTenant,
  isOpaqueTenantFactoryEntity,
} from "./tenant/factory";

/** Platform Operations — SaaS control plane, not community life. */
export type {
  TenantHealthStatus,
  TenantProvisioningStatus,
  TenantProvisioningStep,
  PlatformAdminSurface,
  PlatformSecurityEventKind,
  PlatformAlertKind,
  PlatformAlert,
  SystemHealth,
  FeatureUsageMap,
  TenantFeatureObservability,
  PlatformOperationsContext,
  TenantHealthContext,
  TenantPlanLimits,
  TenantSubscription,
  PlatformSecurityEvent,
  PlatformAuditRecord,
  PlatformOperationsInput,
} from "./platform/operations";
export {
  TENANT_HEALTH_STATUSES,
  TENANT_PROVISIONING_STATUSES,
  TENANT_PROVISIONING_STEPS,
  PLATFORM_ADMIN_SURFACES,
  PLATFORM_SECURITY_EVENT_KINDS,
  tenantHealthStatusFromTenant,
  provisioningStatusFromTenant,
  limitsForPlan,
  projectTenantSubscription,
  billingPlanDoesNotGrantPermissions,
  communityAdminCannotMutateSaas,
  emptyFeatureUsage,
  projectFeatureUsage,
  projectTenantHealth,
  projectPlatformAudit,
  detectCrossTenantSecurityEvent,
  detectInvalidPermissionEvent,
  detectTerritoryMismatchEvent,
  detectAdminChangeEvent,
  projectTenantFeatureObservability,
  projectTenantHealthList,
  projectTenantFeatureObservabilityList,
  projectPlatformOperationsContext,
  isOpaquePlatformOperationsEntity,
} from "./platform/operations";

/** Production Readiness — environment, health, incidents, launch, backup verification. */
export type {
  DeploymentEnvironment,
  DeploymentStatus,
  ConfigurationHealthStatus,
  ProductionEnvironmentContext,
  PlatformHealthStatus,
  PlatformHealthComponent,
  PlatformHealthSignal,
  PlatformHealthContext,
  MigrationStatus,
  DatabaseOperationsContext,
  MigrationCheckResult,
  ApiProtectionStatus,
  SupabaseSecurityReadinessContext,
  PlatformIncidentStatus,
  PlatformIncidentContext,
  TenantLaunchStatus,
  TenantLaunchCheckItem,
  TenantLaunchChecklist,
  BackupVerificationStatus,
  BackupVerificationContext,
  ProductionReadinessContext,
} from "./platform/operations/index";
export {
  DEPLOYMENT_ENVIRONMENTS,
  DEPLOYMENT_STATUSES,
  CONFIGURATION_HEALTH_STATUSES,
  resolveDeploymentEnvironment,
  projectProductionEnvironmentContext,
  environmentContainsDomainData,
  PLATFORM_HEALTH_STATUSES,
  PLATFORM_HEALTH_COMPONENTS,
  worstHealthStatus,
  projectPlatformHealthContext,
  platformHealthObservesDomainData,
  MIGRATION_STATUSES,
  projectDatabaseOperationsContext,
  validateMigrationCheck,
  databaseHealthMetadataSanitized,
  API_PROTECTION_STATUSES,
  projectSupabaseSecurityReadiness,
  supabaseReadinessExposesSecrets,
  PLATFORM_INCIDENT_STATUSES,
  createPlatformIncident,
  updatePlatformIncidentStatus,
  incidentRespectsTenantScope,
  TENANT_LAUNCH_STATUSES,
  TENANT_LAUNCH_CHECK_ITEMS,
  emptyLaunchChecklist,
  deriveLaunchStatus,
  projectTenantLaunchChecklist,
  launchChecklistComplete,
  BACKUP_VERIFICATION_STATUSES,
  projectBackupVerificationContext,
  backupVerificationRespectsTenantIsolation,
  backupVerificationFlowComplete,
  projectProductionReadinessContext,
  productionContextContainsDomainData,
  isOpaqueProductionReadinessEntity,
} from "./platform/operations/index";

/** Tenant Lifecycle — SaaS maturity, not community life. */
export type {
  TenantLifecycleStatus,
  TenantLimits,
  TenantSaaSContract,
  TenantLifecycleContext,
} from "./platform/tenant-lifecycle";
export {
  TENANT_LIFECYCLE_STATUSES,
  SUBSCRIPTION_STATUSES,
  TENANT_LIFECYCLE_TRANSITIONS,
  lifecycleStatusFromTenant,
  tenantStatusFromLifecycle,
  productLimitsForPlan,
  canTransitionLifecycle,
  subscriptionStatusForLifecycle,
  tenantLifecycleBlocksAuth,
  tenantLifecycleBlocksMutations,
  productLimitsDoNotGrantPermissions,
  saasPlanDoesNotGrantPermissions,
  projectTenantLifecycleContext,
  projectTenantSaaSContract,
  wouldExceedTerritoryLimit,
  TenantLifecycleService,
  isOpaqueTenantLifecycleEntity,
} from "./platform/tenant-lifecycle";

/** Tenant Data Operations — export, backup, restore, DR readiness. */
export type {
  DataOperationClass,
  TenantBackupType,
  TenantBackupStatus,
  TenantRestoreStatus,
  DisasterRecoveryScenario,
  TenantMembershipReference,
  TenantOwnedRecord,
  TenantOwnedMedia,
  TenantBackupContext,
  TenantBackupPayload,
  TenantRestoreContext,
  TenantDataExport,
  RecoveryObjectives,
  DisasterRecoveryReadiness,
  TenantDataPlane,
} from "./platform/data-export";
export {
  DATA_OPERATION_CLASSES,
  TENANT_BACKUP_TYPES,
  TENANT_BACKUP_STATUSES,
  TENANT_RESTORE_STATUSES,
  DISASTER_RECOVERY_SCENARIOS,
  DEFAULT_RECOVERY_OBJECTIVES,
  classifyDataOperations,
  emptyTenantDataPlane,
  projectDisasterRecoveryReadiness,
  mediaStorageBelongsToTenant,
  mediaOwnedByTenant,
  isOrphanMediaOwnership,
  backupIsNotContentDuplication,
  dataOpsPlanDoesNotGrantPermissions,
  isOpaqueTenantDataOpsEntity,
  assertBackupIsolated,
  TenantDataExportService,
  TenantBackupService,
  TenantRestoreService,
} from "./platform/data-export";

/** SaaS security hardening — policy, authorization, privacy foundation. */
export type {
  RequestSecurityPipelineStep,
  SecurityPolicyContext,
  AuthorizationActorKind,
  AuthorizationAction,
  AuthorizationDecisionResult,
  AuthorizationRequest,
  PrivacyControlContext,
  SecurityCenterProjection,
  ConfigurationRisk,
} from "./platform/security-context";
export {
  CROSS_TENANT_ACCESS_DENIED,
  TERRITORY_BOUNDARY_VIOLATION,
  CLIENT_CAPABILITY_SPOOF,
  PRIVILEGED_CONFIRMATION_REQUIRED,
  CROSS_TENANT_MEDIA_FORBIDDEN,
  REQUEST_SECURITY_PIPELINE,
  PRIVILEGED_ACTIONS,
  projectSecurityPolicyContext,
  assertTenantBoundary,
  assertMediaOwnership,
  requirePrivilegedConfirmation,
  isCapabilitySpoofField,
  spoofDenialCode,
  clientCannotSupplyAuthority,
  requestSecurityPipelineOrder,
  AuthorizationService,
  projectPrivacyControlContext,
  isOpaqueSecurityEntity,
  isForbiddenFrontendSecretKey,
  frontendMustNotExposeSecrets,
  auditMetadataIsSanitized,
  projectConfigurationRisks,
  projectSecurityCenter,
  securityDoesNotOwnDomainData,
} from "./platform/security-context";

/** GDPR privacy governance — personal data controls and consent. */
export type {
  PersonalDataClass,
  PrivacyRetentionDomain,
  PrivacyContext,
  PrivacyConfiguration,
  PrivacyRetentionRule,
  PrivacyRetentionPolicy,
  PersonalDataExport,
  PersonalAnonymizationResult,
  PersonalDataPlane,
  PrivacyConsentInput,
} from "./privacy/privacy-context";
export {
  PRIVACY_ACCESS_DENIED,
  EXPORT_OTHER_PERSON_DATA,
  PERSONAL_DATA_CLASSES,
  PRIVACY_RETENTION_DOMAINS,
  defaultPrivacyRetentionPolicy,
  emptyPersonalDataPlane,
  projectPrivacyContext,
  projectPrivacyConfiguration,
  assertSelfPersonAccess,
  assertPrivacyTenantBoundary,
  personalMediaPolicy,
  privateMessageVisible,
  PrivacyConsentService,
  PersonalDataExportService,
  PersonalAnonymizationService,
  privacyIntegratesWithSecurity,
  gdprDoesNotOwnDomainData,
  isOpaquePrivacyEntity,
  mergeTrustPrivacyForExport,
} from "./privacy/privacy-context";

/** Membership onboarding — Person vs Membership, codes, invitations, guest access. */
export type {
  MembershipLifecycleStatus,
  OnboardingPerson,
  OnboardingMembership,
  CommunityAccessCode,
  CommunityInvitation,
  MembershipOnboardingPlane,
  RegistrationPersonInput,
} from "./membership/onboarding-context";
export {
  ROLE_SPOOF_FORBIDDEN,
  COMMUNITY_CODE_INVALID,
  COMMUNITY_CODE_TERRITORY_DENIED,
  DUPLICATE_IDENTITY,
  GUEST_ACCESS_DENIED,
  INVITATION_INVALID,
  MEMBERSHIP_LIFECYCLE_STATUSES,
  normalizeIdentityEmail,
  emptyMembershipOnboardingPlane,
  assertClientCannotSupplyAuthority,
  projectRegistrationPerson,
  resolveCommunityCode,
  assertCommunityCodeTerritory,
  isDuplicateIdentity,
  invitationIsValid,
  guestCanAccess,
  magicPlusEligible,
  projectOnboardingMembership,
  MembershipOnboardingService,
  onboardingRespectsPrivacy,
  onboardingDoesNotOwnDomainData,
  isOpaqueOnboardingEntity,
  onboardingAuditMetadata,
} from "./membership/onboarding-context";
export { membershipGrantsCommunityAccess } from "./domain/membership";

/** Commercial SaaS customer operations — onboarding, activation, support. */
export type {
  CustomerOnboardingStatus,
  ProductFeatureCatalogKey,
  ProductFeatureCatalogEntry,
  TenantCustomerContext,
  CustomerAdministratorInvitation,
  CustomerOperationsPlane,
  CustomerOperationsContext,
  CustomerActivationStep,
} from "./platform/customer-context";
export {
  CUSTOMER_ONBOARDING_STATUSES,
  PRODUCT_FEATURE_CATALOG_KEYS,
  emptyCustomerOperationsPlane,
  productFeatureCatalog,
  catalogKeyToCapability,
  projectTenantCustomerContext,
  projectCustomerOperationsContext,
  planDoesNotGrantPermissions,
  featureDoesNotGrantCapability,
  limitsAreProductNotSecurity,
  memberLimitReached,
  communityAdminBlockedFromControlPlane,
  isOpaqueCustomerEntity,
  customerAuditMetadata,
  TenantActivationService,
  assertCustomerTenantBoundary,
  rejectCustomerClientSpoof,
  customerDoesNotOwnCommunityData,
  billingReadinessContract,
  provisioningMapsToOnboarding,
  saasControlPlaneForbiddenForCommunityAdmin,
} from "./platform/customer-context";

/** Customer Success — continuous SaaS operations, health and support. */
export type {
  CustomerSuccessHealthStatus,
  CustomerSuccessTenantHealth,
  OnboardingChecklistKey,
  OnboardingChecklistItemStatus,
  TenantOnboardingChecklistItem,
  TenantOnboardingChecklist,
  TenantOperationalAlertType,
  TenantOperationalAlert,
  CustomerSupportNoteStatus,
  CustomerSupportNote,
  CustomerSupportContext,
  SubscriptionHealthStatus,
  SubscriptionHealth,
  CustomerSuccessContext,
  CustomerSuccessPlane,
} from "./platform/customer-success";
export {
  CUSTOMER_SUCCESS_HEALTH_STATUSES,
  ONBOARDING_CHECKLIST_KEYS,
  OPERATIONAL_ALERT_TYPES,
  SUPPORT_NOTE_STATUSES,
  SUBSCRIPTION_HEALTH_STATUSES,
  emptyCustomerSuccessPlane,
  isOpaqueCustomerSuccessEntity,
  successDoesNotMeasureEngagement,
  personalDataExcludedFromSuccess,
  subscriptionHealthFromContract,
  buildOnboardingChecklist,
  resolveOperationalAlerts,
  resolveCustomerHealth,
  projectCustomerSupportContext,
  projectCustomerSuccessContext,
  communityAdminBlockedFromCustomerSuccess,
  rejectCustomerSuccessClientSpoof,
  assertCustomerSuccessTenantBoundary,
  customerSuccessAuditMetadata,
  CustomerSuccessService,
  saasControlPlaneForbiddenMessage,
} from "./platform/customer-success";

/** SaaS analytics & business intelligence — aggregated platform observability. */
export type {
  PlatformReportKind,
  TenantFeatureUsage,
  TenantCapacityUsage,
  TenantCapacityContext,
  ProductHealthContext,
  TenantAnalyticsContext,
  PlanDistribution,
  OperationalHealthSummary,
  PlatformBusinessIntelligenceContext,
  PlatformReportContext,
  AnalyticsUsageOverlay,
  PlatformAnalyticsInput,
  CustomerSuccessAnalyticsInsight,
} from "./platform/business-intelligence";
export {
  PLATFORM_REPORT_KINDS,
  deriveTenantCapacityUsage,
  projectTenantCapacity,
  projectTenantFeatureUsage,
  projectProductHealth,
  projectTenantAnalytics,
  projectPlatformBusinessIntelligence,
  projectPlatformReport,
  analyticsInsightsForCustomerSuccess,
  isOpaqueAnalyticsEntity,
  analyticsIsNotTracking,
  privacyRespectedInAnalytics,
  crossTenantAnalyticsBlocked,
  communityAdminBlockedFromAnalytics,
  rejectAnalyticsClientSpoof,
  analyticsAuditMetadata,
  saasAnalyticsForbiddenMessage,
  analyticsContainsPersonalData,
} from "./platform/business-intelligence";

/** Community Social Loop — participation around real life, not a social network. */
export type {
  CommunityParticipationEntityType,
  CommunityParticipationViewerStatus,
  CommunityParticipationActionKind,
  CommunityParticipationAction,
  CommunityParticipationRoleCount,
  CommunityParticipationContext,
  CommunityParticipationPrivacy,
  CommunityOwnActivityItem,
  CommunityOwnActivity,
  CommunityParticipationRow,
} from "./community/participation";
export {
  COMMUNITY_PARTICIPATION_ENTITY_TYPES,
  COMMUNITY_PARTICIPATION_VIEWER_STATUSES,
  COMMUNITY_PARTICIPATION_ACTION_KINDS,
  DEFAULT_COMMUNITY_PARTICIPATION_PRIVACY,
  FORBIDDEN_SOCIAL_NETWORK_TYPES,
  isCommunityParticipationEntityType,
  isCommunityParticipationViewerStatus,
  participationContextId,
  aggregateParticipantRoles,
  occupyingParticipationCount,
  viewerStatusFromRole,
  conversationHrefForParticipation,
  entityHrefForParticipation,
  buildParticipationActions,
  createParticipationContext,
  visibleParticipantIds,
  aggregatedSocialLabel,
  mergeParticipationPrivacy,
} from "./community/participation";

/** Personal Community Intelligence — projection, not a recommendation domain. */
export type {
  PersonalInterestId,
  PersonalInterestOption,
  PersonalFavoriteKind,
  PersonalFavorite,
  PersonalParticipationHistoryItem,
  PersonalPrivacy,
  PersonalPreferences,
  PersonalContext,
} from "./personal/personal-context";
export type {
  PersonalizationProviderId,
  PersonalizedCommunityFeedItem,
  PersonalizedCommunityFeed,
  CommunityInsight,
  PersonalizationInput,
  PersonalizationProvider,
  CommunityInsightProvider,
  AIRecommendationProvider,
} from "./personal/personalization";
export {
  PERSONAL_INTEREST_IDS,
  PERSONAL_INTEREST_OPTIONS,
  PERSONAL_FAVORITE_KINDS,
  DEFAULT_PERSONAL_PRIVACY,
  EMPTY_PERSONAL_PREFERENCES,
  isPersonalInterestId,
  isPersonalFavoriteKind,
  personalInterestLabel,
  sanitizeInterestIds,
  emptyPersonalContext,
  mergePersonalPrivacy,
  favoriteLocationsFrom,
  personalFavoriteId,
} from "./personal/personal-context";
export {
  PERSONALIZATION_PROVIDER_IDS,
  matchingInterestsForItem,
  personalizationReason,
  personalizeCommunityFeed,
  listCommunityInsights,
  personalizeComposerActions,
  composerSuggestionReason,
  personalizeLifePlaceContext,
  RuleBasedPersonalizationProvider,
  RuleBasedCommunityInsightProvider,
  isOpaqueRecommendationEntity,
  hasContinuousLocationTracking,
} from "./personal/personalization";

/** Community Trust — projection of real actions, not a reputation domain. */
export type {
  TrustSignals,
  TrustPrivacy,
  TrustContext,
  TrustContributionLine,
  BusinessTrustInput,
} from "./trust/trust-context";
export {
  EMPTY_TRUST_SIGNALS,
  DEFAULT_TRUST_PRIVACY,
  emptyTrustContext,
  mergeTrustPrivacy,
  countTrustSignals,
  projectTrustContext,
  personTrustLabels,
  publicPersonTrustLabels,
  ownTrustContribution,
  businessTrustLabels,
  placeTrustLabel,
  hasPositiveTrustHistory,
  isOpaqueTrustEntity,
  hasPublicTrustScoring,
} from "./trust/trust-context";
export { applyTrustedOrganizerBoost } from "./trust/trust-projection";

/** Community Governance — territorial care over existing domains. */
export type {
  GovernanceReportEntityType,
  GovernanceReportReason,
  GovernanceReportStatus,
  GovernanceSafetyActionType,
  CommunityRule,
  CommunityContentReport,
  PublicGovernanceReport,
  GovernanceSafetyAction,
  GovernancePersonBlock,
  CommunityGovernanceRoles,
  CommunityGovernancePermissions,
  CommunityGovernanceContext,
  TerritoryGovernanceRoleName,
} from "./governance/governance-context";
export {
  GOVERNANCE_REPORT_ENTITY_TYPES,
  GOVERNANCE_REPORT_REASONS,
  GOVERNANCE_REPORT_STATUSES,
  GOVERNANCE_SAFETY_ACTION_TYPES,
  TERRITORY_GOVERNANCE_ROLE_NAMES,
  TRUST_REVIEW_REPORT_THRESHOLD,
  isGovernanceReportEntityType,
  isGovernanceReportReason,
  isGovernanceReportStatus,
  isGovernanceSafetyActionType,
  territoryRolesFromMembership,
  governancePermissionsFromRoles,
  emptyGovernanceContext,
  projectGovernanceContext,
  redactReporter,
  ownReportView,
  trustReviewRequired,
  hiddenContentIdsFromActions,
  filterModeratedFeedItems,
  isOpaqueGovernanceEntity,
  hasGovernanceKarma,
} from "./governance/governance-context";

/** Local Services — territorial economy projection, not a commerce domain. */
export type {
  ProfessionalCategory,
  LocalServiceActionKind,
  LocalServiceAction,
  LocalServicesCounts,
  LocalServicesPrivacy,
  LocalServicesContext,
  ProfessionalCapabilities,
  LocalServiceCard,
} from "./economy/local-services";
export {
  PROFESSIONAL_CATEGORIES,
  LOCAL_SERVICE_ACTION_KINDS,
  DEFAULT_LOCAL_SERVICES_PRIVACY,
  isProfessionalCategory,
  isProfessionalBusiness,
  professionalCapabilitiesFrom,
  mergeLocalServicesPrivacy,
  emptyLocalServicesContext,
  projectLocalServicesContext,
  localServiceActionLabel,
  helpEconomyLabel,
  neighborExchangeIsMarketplace,
  compareLocalServiceCards,
  sortLocalServiceCards,
  businessToLocalServiceCard,
  boostRelevantServiceFeed,
  isOpaqueEconomyEntity,
  hasEconomyCurrency,
} from "./economy/local-services";

/** Life Map living Territory — Territory + Location + Feed projection. */
export type {
  LifeMapLivingLodBand,
  LifeMapLocationView,
  LifeMapContext,
  LifeMapViewportBox,
  LifeMapQueryInput,
  LifeMapQueryResult,
  LifeMapPlaceSheetAction,
  LifeMapPlaceSheet,
} from "./platform/life-map-living";
export {
  LIFE_MAP_LIVING_LOD,
  resolveLifeMapLivingLod,
  isLandmarkLocationType,
  locationVisibleAtLivingZoom,
  locationInViewport,
  projectLocationToLifeMapView,
  feedItemsForLocation,
  createLifeMapContext,
  filterLifeMapContextForQuery,
  lifeMapFocusHref,
  lifeMapHrefForFeedItem,
  lifeMapActionFromFeed,
  applyFeedLifeToMapObject,
  buildLifeMapPlaceSheet,
  isPackOnlyMapMarker,
} from "./platform/life-map-living";

/** Life Place Experience Layer — projection over Location, not a domain. */
export type {
  LifePlaceActionKind,
  LifePlaceAction,
  LifePlaceLocationView,
  LifePlaceResourceSummary,
  LifePlaceExperienceSummary,
  LifePlaceReservationAvailability,
  LifePlaceBusinessSummary,
  LifePlaceHelpSummary,
  LifePlaceCommunityView,
  LifePlaceContext,
  LifePlaceQueryInput,
} from "./platform/life-place";
export {
  LIFE_PLACE_ACTION_KINDS,
  isLifePlaceActionKind,
  lifePlaceActionLabel,
  contactHref,
  projectLocationToLifePlaceView,
  buildLifePlaceActions,
  createLifePlaceContext,
  lifePlaceNowLabel,
  lifePlaceAvailabilityLabel,
} from "./platform/life-place";

/** Life Place Experience View — presentation over LifePlaceContext. */
export type { LifePlaceExperienceView } from "./platform/life-place-experience-view";
export {
  projectLifePlaceExperienceView,
  lifePlaceMaintainsLocationSoT,
  lifePlaceViewIsNotSocialProfile,
} from "./platform/life-place-experience-view";

/** Runtime helpers for Location (map SoT). */
export {
  LOCATION_TYPES,
  LOCATION_VISIBILITIES,
  isLocationType,
  isLocationVisibility,
  validateLocation,
  createLocation,
} from "./domain/location";

/** Territory Core — physical world owned by a Tenant (1:N). */
export {
  TERRITORY_STATUSES,
  isTerritoryStatus,
  slugifyTerritoryName,
  validateTerritory,
  createTerritory,
  territoryBelongsToTenant,
  filterTerritoriesForTenant,
  optionalTerritoryField,
  recordMatchesTerritoryScope,
  locationBelongsToTerritory,
  filterLocationsForTerritory,
  businessBelongsToTerritory,
  resourceBelongsToTerritory,
  reservationBelongsToTerritory,
  propertyBelongsToTerritory,
  marketplaceBelongsToTerritory,
  helpBelongsToTerritory,
  communityRecordBelongsToTerritory,
  conversationBelongsToTerritory,
  mediaBelongsToTerritory,
  experienceBelongsToTerritory,
  denyCrossTerritoryAccess,
} from "./domain";

export {
  resolveTerritoryContext,
  territoryScopedQuery,
} from "./platform/territory-context";

export {
  TERRITORY_HOME_SOURCES,
  emptyTerritoryExperienceContext,
  resolveActiveTerritory,
  canSwitchTerritory,
  createTerritorySwitcher,
  discoverQueryFromActive,
  territoryHomeQuery,
  lifeMapBindingFromActive,
} from "./platform/territory-experience";

/** Runtime helpers for Business Profile (commercial identity). */
export {
  BUSINESS_PROFILE_STATUSES,
  isBusinessProfileStatus,
  validateBusinessProfile,
  createBusinessProfile,
} from "./domain/business-profile";

export {
  businessLifecyclePhase,
  businessLifecycleLabel,
  businessOwnerStatusMessage,
  isBusinessPubliclyDiscoverable,
  canOwnerSubmitBusinessForReview,
  canAdminApproveBusiness,
  canAdminRejectBusiness,
} from "./domain/business-lifecycle";
export type { BusinessLifecyclePhase } from "./domain/business-lifecycle";

export {
  MARKETPLACE_LISTING_TYPES,
  MARKETPLACE_LISTING_STATUSES,
  isMarketplaceListingType,
  isMarketplaceListingStatus,
  marketplaceListingTypeLabel,
  createMarketplaceListingRecord,
} from "./domain/marketplace-listing";

export {
  HELP_REQUEST_TYPES,
  HELP_REQUEST_STATUSES,
  isHelpRequestType,
  isHelpRequestStatus,
  helpRequestTypeLabel,
  createHelpRequestRecord,
  WORK_HELP_CATEGORIES,
  isWorkHelpCategory,
  helpRequestHref,
  workPostHref,
  helpHrefForCategory,
} from "./domain/help-request";

/** Location discovery — LocalEntity is a view of Location. */
export {
  localEntityKindFromLocation,
  locationTypeFromLocalKind,
  locationToLocalEntity,
  locationsToLocalEntities,
  listNearYouFromLocations,
  listTrustedHelpFromLocations,
  filterLocationsByLocalKinds,
} from "./domain/location-discovery";

/** Address geocoder contract helpers. */
export { validateAddressGeocodeQuery } from "./platform/address-geocoder";

/** Membership capability roles (persisted on memberships.membership_type). */
export {
  MEMBERSHIP_ROLES,
  isMembershipRole,
  coerceMembershipRole,
} from "./platform/membership-role";

/** Platform AuthZ — capabilities, roles, effective permissions. */
export {
  CAPABILITIES,
  capabilitiesForRole,
  resolveEffectivePermissions,
  isCapabilityEnabledForTenant,
  canAccessSecurityModule,
  canAccessMunicipalityModule,
  canAccessHousingModule,
  canAccessLifeMapModule,
  navItemVisible,
  filterLeavesByCapability,
  bindProjectedNavigation,
  projectPlatformNavigation,
} from "./platform";

/** Runtime helpers for Local Discovery (platform capability). */
export {
  filterLocalEntities,
  listEntitiesNearYou,
  listTrustedHelpEntities,
  filterLocalRecommendations,
} from "./domain/local-entity";

/** Runtime helpers for Community Life Pulse (platform capability). */
export {
  selectCommunityPulse,
  summarizeCommunityPulse,
} from "./domain/community-activity";

/** Runtime helpers for Home community feed (platform capability). */
export {
  DEFAULT_HOME_FEED_CATEGORY_LABELS,
  HOME_FEED_FILTER_ORDER,
  sortHomeFeedNewestFirst,
  filterHomeFeed,
  placeHomeSponsor,
} from "./domain/home-feed";

/** Life Map spatial twin constants (contracts foundation — no UI / SDK). */
export {
  LIFE_MAP_LAYER_IDS,
  LIFE_MAP_OBJECT_TYPES,
  LIFE_MAP_ACTION_KINDS,
  LIFE_MAP_BASE_LAYER_TYPES,
  isLifeMapBaseLayerType,
} from "./domain/life-map";

/** Territory ingestion — external sources → LifeMapBaseLayer (no SDK / fetch). */
export {
  TERRITORY_IMPORT_LAYER_KINDS,
  LIFE_MAP_BASE_LAYER_DEFAULT_Z_INDEX,
  mapTerritoryImportKindToBaseLayerType,
  assertSafeTerritoryDataRef,
  validateTerritoryDataSource,
  projectTerritoryLayerImport,
  projectTerritoryLayerImports,
} from "./domain/life-map-territory-ingestion";

/** Territory data resolver — opaque dataRef → payload (no SDK / tokens). */
export {
  TERRITORY_DATA_PAYLOAD_KINDS,
  isTerritoryGeoJsonPayload,
  createNullTerritoryDataResolver,
  createStaticTerritoryDataResolver,
  resolveLifeMapBaseLayer,
  resolveLifeMapBaseLayers,
} from "./domain/life-map-territory-data-resolver";

/** Territory bootstrap — SaaS plan for new territories (no providers / fetch). */
export {
  TERRITORY_BOOTSTRAP_DEFAULT_PROVIDERS,
  validateTerritoryBootstrapRequest,
  createNullTerritoryBootstrapService,
} from "./domain/life-map-territory-bootstrap";

/** Territory bootstrap planner — which layers/providers to attempt (no fetch). */
export {
  TERRITORY_BOOTSTRAP_REQUIRED_LAYERS,
  TERRITORY_BOOTSTRAP_OPTIONAL_LAYERS,
  TERRITORY_BOOTSTRAP_LAYER_PROVIDER_FALLBACKS,
  planTerritoryBootstrap,
} from "./domain/life-map-territory-bootstrap-planner";

/** Territory bootstrap executor — run plan via injectable provider adapters. */
export {
  createTerritoryBootstrapExecutor,
  createNullTerritoryBootstrapExecutor,
} from "./domain/life-map-territory-bootstrap-executor";

/** Territory location resolver — AOI before geographic providers (no geocoding). */
export {
  TERRITORY_LOCATION_PROVIDER_KINDS,
  validateTerritoryLocationQuery,
  validateTerritoryAreaOfInterest,
  createNullTerritoryLocationResolver,
} from "./domain/life-map-territory-location";

/** Life Map spatial object projection registry (not SoT — no UI / SDK). */
export {
  LIFE_MAP_DOMAIN_MODULE_BY_TYPE,
  LIFE_MAP_DEFAULT_LAYER_BY_TYPE,
  LIFE_MAP_DOMAIN_BACKED_OBJECT_TYPES,
  isLifeMapDomainBackedObjectType,
  requiresLifeMapDomainRef,
  validateLifeMapObjectProjection,
  projectLifeMapObject,
  assertLifeMapObjectProjection,
  lifeMapObjectsMatchDomainRef,
  filterLifeMapObjects,
  createLifeMapObjectRegistry,
} from "./domain/life-map-objects";

/** Territory digital twin objects (physical fabric — not Location SoT). */
export {
  TERRITORY_OBJECT_TYPES,
  TERRITORY_OBJECT_LOD_BANDS,
  TERRITORY_OBJECT_LAYER_ID,
  isTerritoryObjectType,
  territoryObjectHasPosition,
  validateTerritoryObject,
  filterRenderableTerritoryObjects,
  projectTerritoryObjectToLifeMapObject,
  projectTerritoryObjectsToLifeMapObjects,
} from "./domain/life-map-territory-object";

/** Channel boundary validators (ADR-035) — required before persistence. */
export {
  CHANNEL_OWNER_COMPATIBILITY,
  validateChannelBoundaries,
  assertChannelBoundaries,
} from "./domain/channel";

/** Resource ownership, availability, and reservation factories (ADR-031 / Phase 8). */
export {
  validateResourceOwnership,
  validateResourceAccessPolicy,
  evaluateResourceAccess,
  RESOURCE_CATEGORIES,
  RESOURCE_PRODUCT_STATUSES,
  RESERVATION_STATUSES,
  isResourceCategory,
  isReservationStatus,
  isResourceProductStatus,
  resourceIsBookable,
  reservationIsActive,
  intervalsOverlap,
  resourceTypeFromCategory,
  resourceCategoryFromType,
  generateResourceAvailability,
  createBookableResourceRecord,
  createResourceAvailabilityRecord,
  createReservationRecord,
  createReservationParticipantRecord,
  usedCapacityForInterval,
  withReservationLifecycle,
  dateOffsetIso,
  minutesToHhmm,
  hhmmToMinutes,
  combineDateAndTime,
  splitIsoToDateTime,
  spotsLeft,
  deriveExperienceViewerState,
  occupyingParticipantRoles,
  participationOccupiesSeat,
  experienceFromResource,
  isActivityResource,
  isExperienceLifecycleStatus,
  isExperienceParticipantRole,
  isExperienceCategory,
  createExperienceRecord,
  createExperienceParticipationRecord,
  EXPERIENCE_LIFECYCLE_STATUSES,
  EXPERIENCE_CATEGORIES,
  EXPERIENCE_PARTICIPANT_ROLES,
  RESERVATION_CONTEXT_TYPES,
  RESERVATION_PARTICIPANT_ROLES,
  isReservationContextType,
  isReservationParticipantRole,
  createReservationContext,
  reservationContextOf,
  reservationMatchesContext,
  occupyingReservationParticipantRoles,
  reservationParticipantOccupiesSeat,
  usedCapacityForContext,
} from "./domain";

/** Housing / Living domain helpers (module foundation). */
export {
  HOUSING_LISTING_TYPES,
  HOUSING_CONTENT_SOURCES,
  HOUSING_TENANT_MODULE_CONFIG_DEFAULTS,
  isHousingListingPubliclyVisible,
  isHousingListingOwnerPerson,
  housingCategoryEnabled,
  housingListingPublisherKind,
  housingListingContentSource,
  housingContentSourceForPublisherKind,
  buildHousingPublisher,
  housingModerationRequired,
  housingInitialCreateStatus,
} from "./domain/housing";

export {
  HOUSING_STATUS_TO_PHASE,
  HOUSING_STATUS_TRANSITIONS,
  HOUSING_LIFECYCLE_RULES,
  canTransitionHousingStatus,
  canPerformHousingListingAction,
  listHousingListingActions,
  housingActionTargetStatus,
  canCreateHousingListing,
  canCreateAsHousingPublisher,
  resolveHousingCreatePublisherKind,
} from "./domain/housing-lifecycle";

export {
  housingPublisherApprovalAfterAction,
  housingPublisherVerificationAfterAction,
  canGrantHousingPublisherCapability,
  canRevokeHousingPublisherCapability,
  canPerformHousingPublisherGovernanceAction,
  isHousingProfessionalPublisherAuthorized,
  housingPublisherFromProfile,
  createPendingHousingPublisherProfile,
  applyHousingPublisherGrant,
  applyHousingPublisherRevoke,
  housingProfessionalGovernancePolicy,
} from "./domain/housing-publisher-governance";

/** Residency-derived Community Area access (ADR-037 / ADR-038). */
export {
  DEFAULT_RESIDENCY_ELIGIBILITY_ROLES,
  DEFAULT_ROLES_REQUIRING_VERIFICATION,
  PROPERTY_MEMBERSHIP_ROLES,
  isPropertyMembershipRole,
  propertyMembershipRoleLabel,
  createPropertyMembershipRecord,
  isRelationshipActiveAt,
  isVerifiedResidencyActiveAt,
  deriveCommunityAreaIdsFromResidencies,
  resolveResidencyAccessAreas,
  hasVerifiedResidencyInArea,
} from "./domain/property-person-relationship";

export {
  HOUSING_PROPERTY_TYPES,
  HOUSING_PROPERTY_STATUSES,
  HOUSING_AVAILABILITIES,
  isHousingPropertyType,
  isHousingPropertyStatus,
  isHousingAvailability,
  housingPropertyTypeLabel,
  housingPropertyStatusLabel,
  housingAvailabilityLabel,
  createPropertyRecord,
  toPropertyPublicView,
  isPropertyPubliclyListed,
} from "./domain/property";

/** Residency verification cases and evidence (ADR-038). */
export {
  validateResidencyVerification,
  canActivateRelationshipFromVerification,
} from "./domain/residency-verification";

/** Contribution recognition projection (Phase C.4) — not AuthZ. */
export {
  emptyContributionSignals,
  validateContributionSignals,
  deriveRecognitionState,
} from "./domain/contribution";

/** Platform Module Registry (Phase D.0.1) — tenant-neutral catalogue. */
export {
  PLATFORM_MODULE_REGISTRY_VERSION,
  PLATFORM_MODULE_REGISTRY,
  listPlatformModules,
  listRootPlatformModules,
  getPlatformModuleById,
  listPlatformModulesByFeatureFlag,
  validatePlatformModuleRegistry,
  getPlatformModuleRegistryDocument,
} from "./platform/module-registry";

/** Tenant Configuration adapter spine (Phase D.0.2). */
export {
  resolveModuleEnabledFromFeatures,
  tenantPackToTenantConfiguration,
  resolveTenantConfiguration,
  isTenantModuleEnabled,
  applyTenantConfigurationPreset,
  assertTenantConfigurationCoversRegistry,
} from "./platform/tenant-configuration";

export type {
  ProductCapabilityKey,
  ProductCapabilityMap,
  TenantHomeMode,
  TenantIdentityRecord,
  TenantContract,
  TenantLocationSeed,
  TenantCatalogDomain,
} from "./platform/tenant-contract";
export {
  PRODUCT_CAPABILITY_KEYS,
  EMPTY_PRODUCT_CAPABILITIES,
  productCapabilitiesFromFeatures,
  isProductCapabilityEnabled,
  resolveHostHintToSlug,
  territoryIdsForTenant,
} from "./platform/tenant-contract";

/** Housing settings on TenantConfiguration. */
export {
  mergeHousingTenantModuleConfig,
  housingTenantModuleConfigToRecord,
  resolveHousingTenantModuleConfig,
  isHousingEnabledInTenantConfiguration,
  withHousingTenantModuleConfig,
} from "./platform/housing-config";

export type {
  ConversationKind,
  ConversationMemberRole,
  ConversationMemberStatus,
  ConversationParticipantRecord,
  ConversationListItem,
  ConversationThread,
  MessageAttachment,
  MessageStatus,
  ProductCommunicationContextType,
} from "./platform/communication";

/** Contextual Conversation Layer (ADR-043) — contracts + context adapters. */
export {
  KNOWN_CONVERSATION_CONTEXT_TYPES,
  isKnownConversationContextType,
  validateConversationContext,
  validateConversation,
  validateMessage,
  REACTION_TYPES,
  REACTION_TYPE_GLYPH,
  isReactionType,
  emptyMessageReactionSummary,
  MESSAGE_ACTION_KINDS,
  isMessageActionKind,
  DEFAULT_MESSAGE_ACTION_AVAILABILITY,
  ATTACHMENT_PICKER_KINDS,
  isAttachmentPickerKind,
  ATTACHMENT_FOUNDATION_NOTE,
  VOICE_RECORDER_STATES,
  isVoiceRecorderState,
  VOICE_MESSAGE_FOUNDATION_NOTE,
  QUICK_ACTION_KINDS,
  isQuickActionKind,
  RETENTION_POLICY_TYPES,
  DEFAULT_RETENTION_POLICY_IDS,
  validateRetentionPolicy,
  isAdapterModuleAvailable,
  shouldProjectConversationContext,
  createConversationContextAdapterRegistry,
  createExperienceConversationAdapter,
  experienceContextMatches,
  createGroupConversationAdapter,
  createWorkConversationAdapter,
  createMarketplaceConversationAdapter,
  createPlaceConversationAdapter,
  localEntityToPlaceConversationSnapshot,
  createHousingConversationAdapter,
  createServiceRequestConversationAdapter,
  createCommunityDiscussionConversationAdapter,
  COMMUNITY_DISCUSSION_CREATE_CAPABILITY,
  createReservationConversationAdapter,
  createOfficialConversationAdapter,
  allowsOfficialResidentReplies,
  allowsOfficialReactions,
  createDefaultConversationContextAdapterRegistry,
  DEFAULT_CONVERSATION_PERSISTENCE_PLAN,
  COMMUNICATION_EVENT_TYPES,
  createNoopCommunicationEventPublisher,
  isCommunicationEventType,
  DELIVERY_CHANNEL_KINDS,
  isDeliveryChannelKind,
  COMMUNICATION_DELIVERY_ARCHITECTURE_NOTE,
  EPHEMERAL_MEDIA_TTL_PRESETS,
  CONVERSATION_KINDS,
  CONVERSATION_MEMBER_ROLES,
  MESSAGE_STATUSES,
  MESSAGE_ATTACHMENT_KINDS,
  PRODUCT_COMMUNICATION_CONTEXT_TYPES,
  isConversationKind,
  isConversationMemberRole,
  isMessageStatus,
  isMessageAttachmentKind,
  isProductCommunicationContextType,
  normalizeCommunicationContextType,
  moduleIdForCommunicationContext,
  directConversationContextId,
  createConversationRecord,
  createConversationParticipantRecord,
  createMessageRecord,
  createMessageAttachmentRecord,
  messageStatusFromRecord,
  conversationHref,
} from "./platform/communication";

/** Participation foundations — Reaction ≠ Support ≠ Vote (Phase 2.5). */
export {
  SOFT_REACTION_KINDS,
  isSoftReactionKind,
  emptySoftReactionSummary,
  PARTICIPATION_SEPARATION_NOTE,
  SUPPORT_VISIBILITY_MODES,
  isSupportVisibility,
  validateSupportRecord,
  VOTE_STATUSES,
  isVoteStatus,
  validateVoteDefinition,
  VOTE_FOUNDATION_NOTE,
} from "./platform/participation";

/** Platform Core Notifications spine (ADR-019 / Phase 2.2). */
export {
  NOTIFICATION_STATUSES,
  NOTIFICATION_CATEGORIES,
  isNotificationStatus,
  isNotificationCategory,
  markNotificationRead,
  markNotificationArchived,
  isNotificationUnread,
  NOTIFICATION_EVENT_TYPES,
  NOTIFICATION_EVENT_CATEGORY,
  isNotificationEventType,
  categoryForNotificationEvent,
  createEmptyNotificationInboxPort,
  createNoopNotificationRecipientResolver,
  createNoopNotificationDeliveryPort,
} from "./platform/notifications";

/** Platform Core Files & Media (ADR-020 / D.0.5c + Phase 10). */
export {
  FILE_TYPES,
  FILE_REFERENCE_STATUSES,
  isFileType,
  isFileReferenceStatus,
  isFileReferenceReady,
  validateFileReference,
  FILE_VARIANT_KINDS,
  PREFERRED_IMAGE_FORMATS,
  isFileVariantKind,
  validateFileVariant,
  pickDeliveryVariant,
  DEFAULT_IMAGE_OPTIMIZATION_CONTRACT,
  DEFAULT_MEDIA_PIPELINE_CONTRACT,
  shouldProjectFileReference,
  canDeliverFileReference,
  isFileEligibleForRetentionCleanup,
  MEDIA_ASSET_TYPES,
  MEDIA_ASSET_STATUSES,
  MEDIA_ENTITY_TYPES,
  MEDIA_PURPOSES,
  isMediaAssetType,
  isMediaAssetStatus,
  isMediaEntityType,
  isMediaPurpose,
  isPublicMediaPurpose,
  createMediaAsset,
  createMediaReference,
  validateMediaAsset,
  mediaAssetTypeFromMime,
  mediaAssetToFileReference,
} from "./platform/files";

export type {
  FileType,
  FileReferenceStatus,
  FileOwnerContext,
  FileReference,
  FileReferenceIssue,
  FileReferenceIssueCode,
  FileVariantKind,
  PreferredImageFormat,
  FileMediaFormat,
  FileVariant,
  FileVariantIssue,
  FileVariantIssueCode,
  MediaPipelineStage,
  ImageOptimizationOutputKind,
  ImageOptimizationContract,
  MediaPipelineContract,
  FileAccessEnv,
  MediaAssetType,
  MediaAssetStatus,
  MediaEntityType,
  MediaPurpose,
  MediaAsset,
  MediaReference,
  MediaAssetIssue,
  MediaAssetIssueCode,
  MediaStorageUploadInput,
  MediaStorageObject,
  MediaStorageProvider,
} from "./platform/files";

export {
  ADMIN_AUDIT_ACTIONS,
  isAdminAuditAction,
  sanitizeAuditMetadata,
  createAdminAuditLog,
  ADMIN_OPERATIONS_ROLES,
  ADMIN_SECTION_ROLES,
  canAccessAdminOperations,
  canMutateSaasControlPlane,
  SAAS_CONTROL_PLANE_FORBIDDEN,
  canAccessAdminSection,
  canAssignMembershipRole,
} from "./domain";
