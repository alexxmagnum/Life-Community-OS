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
} from "./community/action-composer";

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
  createAdminAuditLog,
  ADMIN_OPERATIONS_ROLES,
  ADMIN_SECTION_ROLES,
  canAccessAdminOperations,
  canAccessAdminSection,
  canAssignMembershipRole,
} from "./domain";
