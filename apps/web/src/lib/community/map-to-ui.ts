/**
 * Map Community Core records to existing hub UI shapes.
 */

import type {
  CommunityCommentRecord,
  CommunityEvent,
  CommunityGroupRecord,
  CommunityPost,
  CommunityReaction,
} from "@life-community-os/types";
import type {
  CommunityComment,
  CommunityContent,
  ReactionKind,
} from "@life-community-os/tenant-life-panoramica";

export function postToHubContent(
  post: CommunityPost,
  comments: CommunityCommentRecord[],
  reactions: CommunityReaction[],
): CommunityContent {
  const postComments = comments.filter(
    (item) => item.postId === post.id && item.status === "published",
  );
  const postReactions = reactions.filter(
    (item) => item.targetType === "post" && item.targetId === post.id,
  );
  const acknowledge = postReactions.filter((item) => item.kind === "acknowledge")
    .length;
  const support = postReactions.filter((item) => item.kind === "support").length;
  const mappedComments: CommunityComment[] = postComments.map((item) => ({
    id: item.id,
    author: { id: item.authorPersonId, name: item.authorDisplayName },
    body: item.body,
    createdAt: item.createdAt,
  }));
  return {
    id: post.id,
    type: post.kind === "announcement" ? "announcement" : post.kind === "proposal" ? "proposal" : post.kind === "discussion" ? "discussion" : "member_update",
    title: post.title,
    body: post.body,
    status: post.status === "published" ? "published" : "archived",
    isOfficial: post.kind === "announcement",
    author: {
      id: post.authorPersonId,
      name: post.authorDisplayName,
    },
    createdAt: post.createdAt,
    publishedAt: post.createdAt,
    commentCount: mappedComments.length,
    reactionCounts: {
      acknowledge,
      support,
    } as Record<ReactionKind, number>,
    comments: mappedComments,
  };
}

export function groupToHubCard(group: CommunityGroupRecord): {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  imageUrl: string;
  categoryLabel: string;
  tenantId: string;
  ownerPersonId: string;
  status: "draft" | "active" | "archived";
} {
  return {
    id: group.id,
    name: group.name,
    description: group.description,
    memberCount: 0,
    imageUrl: group.imageUrl ?? "",
    categoryLabel: group.categoryLabel ?? "Grupo",
    tenantId: group.tenantId,
    ownerPersonId: group.createdBy,
    status: group.status,
  };
}

export function eventToHubCard(event: CommunityEvent): {
  id: string;
  title: string;
  description: string;
  startsAt: string;
  location: string;
  tenantId: string;
} {
  return {
    id: event.id,
    title: event.title,
    description: event.description,
    startsAt: event.startsAt,
    location: event.locationLabel ?? "",
    tenantId: event.tenantId,
  };
}
