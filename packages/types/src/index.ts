export type * from "./domain";
export type * from "./platform";

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

/** Channel boundary validators (ADR-035) — required before persistence. */
export {
  CHANNEL_OWNER_COMPATIBILITY,
  validateChannelBoundaries,
  assertChannelBoundaries,
} from "./domain/channel";

/** Resource ownership and area access guards (ADR-031 / ADR-036). */
export {
  validateResourceOwnership,
  validateResourceAccessPolicy,
  evaluateResourceAccess,
} from "./domain/resource";

/** Residency-derived Community Area access (ADR-037 / ADR-038). */
export {
  DEFAULT_RESIDENCY_ELIGIBILITY_ROLES,
  DEFAULT_ROLES_REQUIRING_VERIFICATION,
  isRelationshipActiveAt,
  isVerifiedResidencyActiveAt,
  deriveCommunityAreaIdsFromResidencies,
  resolveResidencyAccessAreas,
  hasVerifiedResidencyInArea,
} from "./domain/property-person-relationship";

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

/** Platform Core Files & Media (ADR-020 / D.0.5c) — contracts only. */
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
} from "./platform/files";
