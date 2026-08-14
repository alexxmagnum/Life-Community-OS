/**
 * Shared Product — universal Conversation Experience (Phase 2.5.5).
 *
 * No tenant imports. Prop-driven only.
 * ONE chat system. Context changes header / participants / permissions only.
 */

export {
  ConversationShell,
  type ConversationShellProps,
} from "./ConversationShell";
export {
  ConversationExperience,
  type ConversationExperienceProps,
} from "./ConversationExperience";
export {
  ConversationInfoSheet,
  type ConversationInfoSheetProps,
  type ConversationInfoMember,
} from "./ConversationInfoSheet";
export {
  ContextHeader,
  type ContextHeaderProps,
  type ContextHeaderCard,
} from "./ContextHeader";
export {
  MessageBubble,
  type MessageBubbleProps,
  type MessageBubbleReactor,
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
  type MessageComposerReplyTarget,
} from "./MessageComposer";
export {
  MessageActionMenu,
  type MessageActionMenuProps,
} from "./MessageActionMenu";
export {
  AttachmentSheet,
  type AttachmentSheetProps,
  type AttachmentSheetItem,
} from "./AttachmentSheet";
export {
  VoiceRecorderControl,
  type VoiceRecorderControlProps,
} from "./VoiceRecorderControl";
export {
  MediaPreview,
  type MediaPreviewProps,
  type MediaPreviewKind,
} from "./MediaPreview";
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
