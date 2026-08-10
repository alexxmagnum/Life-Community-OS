"use client";

import type { ReactNode } from "react";

import { ContextHeader, type ContextHeaderProps } from "./ContextHeader";
import {
  ConversationInfoSheet,
  type ConversationInfoMember,
} from "./ConversationInfoSheet";
import { ConversationShell } from "./ConversationShell";
import {
  MessageComposer,
  type MessageComposerProps,
} from "./MessageComposer";
import {
  MessageList,
  type MessageListItem,
  type MessageListProps,
} from "./MessageList";

export type ConversationExperienceProps = {
  /** Who / why — identical chrome everywhere. */
  header: Omit<ContextHeaderProps, "context"> & {
    contextTitle: string;
    contextSubtitle?: string;
    contextImageUrl?: string;
  };
  onBack: () => void;
  /** Opens conversation info (not a pre-chat page). */
  infoOpen: boolean;
  onInfoOpenChange: (open: boolean) => void;
  infoDescription?: string;
  infoMembers?: ConversationInfoMember[];
  messages: MessageListItem[];
  viewerPersonId: string;
  composer?: MessageComposerProps;
  /** When set, replaces composer (e.g. archived read-only). */
  footerOverride?: ReactNode;
  selectionMode?: boolean;
  firstUnreadMessageId?: string | null;
  emptyTitle?: string;
  emptyDescription?: string;
  listProps?: Partial<
    Pick<
      MessageListProps,
      "unreadLabel" | "groupWindowMs" | "showAvatars" | "avatarSide"
    >
  >;
  trailing?: ReactNode;
};

/**
 * ONE universal Conversation Experience for the SaaS.
 * Context only changes header / participants / permissions / actions —
 * never a separate chat system.
 */
export function ConversationExperience({
  header,
  onBack,
  infoOpen,
  onInfoOpenChange,
  infoDescription,
  infoMembers,
  messages,
  viewerPersonId,
  composer,
  footerOverride,
  selectionMode = false,
  firstUnreadMessageId = null,
  emptyTitle,
  emptyDescription,
  listProps,
  trailing,
}: ConversationExperienceProps) {
  const {
    name,
    avatarUrl,
    reason,
    contextTitle,
    contextSubtitle,
    contextImageUrl,
  } = header;

  return (
    <ConversationShell
      header={
        <ContextHeader
          name={name}
          avatarUrl={avatarUrl}
          reason={reason}
          onBack={onBack}
          trailing={trailing}
          context={{
            title: contextTitle,
            subtitle: contextSubtitle,
            imageUrl: contextImageUrl,
            onClick: () => onInfoOpenChange(!infoOpen),
          }}
        />
      }
      headerOverlay={
        <ConversationInfoSheet
          open={infoOpen}
          onClose={() => onInfoOpenChange(false)}
          name={name}
          avatarUrl={avatarUrl}
          description={infoDescription ?? reason}
          members={infoMembers}
        />
      }
      footer={
        footerOverride ??
        (composer ? <MessageComposer {...composer} /> : undefined)
      }
    >
      <MessageList
        messages={messages}
        viewerPersonId={viewerPersonId}
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
        firstUnreadMessageId={firstUnreadMessageId}
        selectionMode={selectionMode}
        {...listProps}
      />
    </ConversationShell>
  );
}
