/**
 * Contextual Conversation Layer — Platform Core contracts (ADR-043).
 *
 * D.0.5a — types / validators
 * D.0.5b — context adapters / registry
 *
 * No persistence, realtime, UI, uploads, or notification delivery.
 */

export type {
  ConversationContext,
  ConversationContextType,
  KnownConversationContextType,
  ConversationContextIssue,
  ConversationContextIssueCode,
} from "./conversation-context";
export {
  KNOWN_CONVERSATION_CONTEXT_TYPES,
  isKnownConversationContextType,
  validateConversationContext,
} from "./conversation-context";

export type {
  ConversationPersistenceMode,
  ConversationRepository,
  ConversationPersistencePlan,
} from "./conversation-persistence";
export { DEFAULT_CONVERSATION_PERSISTENCE_PLAN } from "./conversation-persistence";

export type {
  CommunicationEventType,
  CommunicationEvent,
  CommunicationEventPublisher,
} from "./communication-events";
export {
  COMMUNICATION_EVENT_TYPES,
  createNoopCommunicationEventPublisher,
  isCommunicationEventType,
} from "./communication-events";

export type {
  DeliveryChannelKind,
  DeliveryChannelAdapter,
} from "./delivery-channels";
export {
  DELIVERY_CHANNEL_KINDS,
  isDeliveryChannelKind,
  COMMUNICATION_DELIVERY_ARCHITECTURE_NOTE,
} from "./delivery-channels";

export type {
  Conversation,
  ConversationStatus,
  ConversationParticipantPolicy,
  ConversationIssue,
  ConversationIssueCode,
} from "./conversation";
export { validateConversation } from "./conversation";

export type {
  Message,
  MessageMediaRef,
  MessageIssue,
  MessageIssueCode,
} from "./message";
export { validateMessage } from "./message";

export type { ReactionType, MessageReactionSummary } from "./reactions";
export {
  REACTION_TYPES,
  REACTION_TYPE_GLYPH,
  isReactionType,
  emptyMessageReactionSummary,
} from "./reactions";

export type { QuickActionKind } from "./quick-actions";
export { QUICK_ACTION_KINDS, isQuickActionKind } from "./quick-actions";

export type {
  RetentionPolicy,
  RetentionPolicyType,
  RetentionPolicyIssue,
  RetentionPolicyIssueCode,
} from "./retention-policy";
export {
  RETENTION_POLICY_TYPES,
  DEFAULT_RETENTION_POLICY_IDS,
  EPHEMERAL_MEDIA_TTL_PRESETS,
  validateRetentionPolicy,
} from "./retention-policy";
export type { EphemeralMediaTtlPreset } from "./retention-policy";

export type {
  ContextLifecycleState,
  ConversationParticipantRole,
  ConversationParticipant,
  ConversationContextAdapterEnv,
  ConversationContextAdapter,
} from "./context-adapter";
export {
  isAdapterModuleAvailable,
  shouldProjectConversationContext,
} from "./context-adapter";

export type { ConversationContextAdapterRegistry } from "./adapter-registry";
export { createConversationContextAdapterRegistry } from "./adapter-registry";

export {
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
} from "./adapters";
export type {
  ExperienceConversationSnapshot,
  GroupConversationSnapshot,
  WorkConversationSnapshot,
  MarketplaceConversationSnapshot,
  PlaceConversationSnapshot,
  HousingConversationSnapshot,
  ServiceRequestConversationSnapshot,
  CommunityDiscussionSnapshot,
  ReservationConversationSnapshot,
  OfficialConversationSnapshot,
  OfficialEntityKind,
  OfficialInteractionMode,
} from "./adapters";
