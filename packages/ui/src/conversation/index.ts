/**
 * Shared Product — contextual conversation experience (Phase 2.5).
 *
 * No tenant imports. No Panoramica data. Prop-driven only.
 */

export {
  ConversationShell,
  type ConversationShellProps,
} from "./ConversationShell";
export {
  ContextHeader,
  type ContextHeaderProps,
  type ContextHeaderCard,
} from "./ContextHeader";
export {
  MessageBubble,
  type MessageBubbleProps,
  type MessageDeliveryState,
} from "./MessageBubble";
export {
  MessageList,
  type MessageListProps,
  type MessageListItem,
  type MessageListAuthor,
} from "./MessageList";
export {
  MessageComposer,
  type MessageComposerProps,
} from "./MessageComposer";
export {
  EmojiPicker,
  type EmojiPickerProps,
  DEFAULT_COMPOSER_EMOJIS,
} from "./EmojiPicker";
export {
  ReactionPicker,
  type ReactionPickerProps,
  type ReactionPickerOption,
} from "./ReactionPicker";
export {
  ConversationParticipantList,
  type ConversationParticipantListProps,
  type ConversationParticipant,
} from "./ParticipantList";
export {
  SupportCard,
  type SupportCardProps,
} from "./SupportCard";
export {
  SupportersList,
  type SupportersListProps,
  type SupporterListItem,
} from "./SupportersList";
export {
  VoteCard,
  type VoteCardProps,
  type VoteCardOption,
} from "./VoteCard";
export {
  VoteResults,
  type VoteResultsProps,
  type VoteResultRow,
} from "./VoteResults";
