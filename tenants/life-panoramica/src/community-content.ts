/**
 * Community content — tenant-neutral publishing model (ADR-026).
 * Lifecycle: draft → pending_review → published → expired → archived
 * Interactions attach per ADR-028 (content-centric, not a social network).
 */

export type PublishingStatus =
  | "draft"
  | "pending_review"
  | "published"
  | "expired"
  | "archived";

export type CommunityContentType =
  | "announcement"
  | "news"
  | "discussion"
  | "proposal"
  | "member_update";

export type ReactionKind = "acknowledge" | "support";

export type CommunityAuthor = {
  id: string;
  name: string;
  avatarUrl?: string;
};

export type CommunityComment = {
  id: string;
  author: CommunityAuthor;
  body: string;
  createdAt: string;
  replyToId?: string;
  mentionNames?: string[];
};

export type CommunityContent = {
  id: string;
  type: CommunityContentType;
  title: string;
  body: string;
  status: PublishingStatus;
  isOfficial: boolean;
  author: CommunityAuthor;
  areaLabel?: string;
  createdAt: string;
  publishedAt?: string;
  imageUrl?: string;
  /** Optional link to Experience capability (ADR-027) — not a separate domain */
  linkedExperienceId?: string;
  commentCount: number;
  reactionCounts: Record<ReactionKind, number>;
  comments: CommunityComment[];
  /** Proposal-only display hint */
  decisionStatus?: "open" | "closing_soon" | "closed";
};

function hoursAgo(hours: number): string {
  const d = new Date();
  d.setHours(d.getHours() - hours);
  return d.toISOString();
}

function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

/** Life Panoramica reference catalog — same shape for any tenant. */
export const communityContentCatalog: CommunityContent[] = [
  {
    id: "cc-official-lighting",
    type: "announcement",
    title: "Pathway lighting update",
    body: "Phase 2 is complete around Aldea Golf paths. Thank you for your patience during the works.",
    status: "published",
    isOfficial: true,
    author: {
      id: "org-community",
      name: "Life Panoramica",
    },
    areaLabel: "Aldea Golf",
    createdAt: hoursAgo(5),
    publishedAt: hoursAgo(5),
    commentCount: 3,
    reactionCounts: { acknowledge: 18, support: 7 },
    comments: [
      {
        id: "c1",
        author: { id: "p-elena", name: "Elena" },
        body: "Looks much safer at night — thank you.",
        createdAt: hoursAgo(3),
      },
      {
        id: "c2",
        author: { id: "p-jordi", name: "Jordi" },
        body: "Will Pinar be next?",
        createdAt: hoursAgo(2),
        replyToId: "c1",
      },
    ],
  },
  {
    id: "cc-water",
    type: "announcement",
    title: "Water maintenance Saturday",
    body: "Works from 10:00–14:00 in Aldea Golf. Please store a little water for the morning.",
    status: "published",
    isOfficial: true,
    author: { id: "org-community", name: "Life Panoramica" },
    areaLabel: "Aldea Golf",
    createdAt: daysAgo(1),
    publishedAt: daysAgo(1),
    imageUrl:
      "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=900&q=80",
    commentCount: 5,
    reactionCounts: { acknowledge: 24, support: 4 },
    comments: [],
  },
  {
    id: "cc-walk-invite",
    type: "discussion",
    title: "Anyone for an evening walk?",
    body: "Toward Detinsa around 19:00 — join if you’d like. Easy pace, all welcome.",
    status: "published",
    isOfficial: false,
    author: {
      id: "p-ana",
      name: "Ana",
      avatarUrl:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
    },
    areaLabel: "Detinsa",
    createdAt: hoursAgo(8),
    publishedAt: hoursAgo(8),
    linkedExperienceId: "exp-sunset-walk",
    commentCount: 4,
    reactionCounts: { acknowledge: 9, support: 12 },
    comments: [
      {
        id: "c3",
        author: { id: "p-marta", name: "Marta" },
        body: "I’m in — see you at the path entrance.",
        createdAt: hoursAgo(6),
        mentionNames: ["Ana"],
      },
    ],
  },
  {
    id: "cc-pool-hours",
    type: "discussion",
    title: "Pool hours for August",
    body: "Thread for questions before the community decision closes. Keep it useful and kind.",
    status: "published",
    isOfficial: false,
    author: {
      id: "p-luis",
      name: "Luis",
      avatarUrl:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80",
    },
    areaLabel: "All Panoramica",
    createdAt: daysAgo(2),
    publishedAt: daysAgo(2),
    commentCount: 11,
    reactionCounts: { acknowledge: 6, support: 3 },
    comments: [],
  },
  {
    id: "cc-proposal-pool",
    type: "proposal",
    title: "Extend pool summer hours",
    body: "Proposal to keep the pool open until 21:00 on weekdays through August. Share your view in Decide.",
    status: "published",
    isOfficial: false,
    author: {
      id: "p-clara",
      name: "Clara",
    },
    areaLabel: "All Panoramica",
    createdAt: daysAgo(3),
    publishedAt: daysAgo(3),
    commentCount: 8,
    reactionCounts: { acknowledge: 15, support: 21 },
    comments: [],
    decisionStatus: "closing_soon",
  },
  {
    id: "cc-news-gardens",
    type: "news",
    title: "Spring garden tips from neighbours",
    body: "A short roundup of watering and plant care ideas shared in the Walking circle — practical, local, no sales pitch.",
    status: "published",
    isOfficial: false,
    author: {
      id: "p-ines",
      name: "Inés",
      avatarUrl:
        "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80",
    },
    areaLabel: "Valle Golf",
    createdAt: daysAgo(4),
    publishedAt: daysAgo(4),
    commentCount: 2,
    reactionCounts: { acknowledge: 11, support: 5 },
    comments: [],
  },
  {
    id: "cc-pending",
    type: "member_update",
    title: "Found keys near Court 2",
    body: "Left with the community office — ask for Marta if they’re yours.",
    status: "pending_review",
    isOfficial: false,
    author: { id: "p-tom", name: "Tom" },
    areaLabel: "Aldea Golf",
    createdAt: hoursAgo(1),
    commentCount: 0,
    reactionCounts: { acknowledge: 0, support: 0 },
    comments: [],
  },
];

export function listPublishedCommunityContent(): CommunityContent[] {
  return communityContentCatalog
    .filter((c) => c.status === "published")
    .sort(
      (a, b) =>
        new Date(b.publishedAt ?? b.createdAt).getTime() -
        new Date(a.publishedAt ?? a.createdAt).getTime(),
    );
}

export function getCommunityContentById(
  id: string,
): CommunityContent | undefined {
  return communityContentCatalog.find((c) => c.id === id);
}

export function listDiscussions(): CommunityContent[] {
  return listPublishedCommunityContent().filter(
    (c) => c.type === "discussion" || c.type === "member_update",
  );
}

export function listProposals(): CommunityContent[] {
  return listPublishedCommunityContent().filter((c) => c.type === "proposal");
}

export function listOfficialContent(): CommunityContent[] {
  return listPublishedCommunityContent().filter((c) => c.isOfficial);
}

export function formatContentWhen(iso: string): string {
  const d = new Date(iso);
  const diffH = Math.round((Date.now() - d.getTime()) / (1000 * 60 * 60));
  if (diffH < 1) return "Just now";
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.round(diffH / 24);
  if (diffD === 1) return "Yesterday";
  if (diffD < 7) return `${diffD}d ago`;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
  }).format(d);
}

export function contentTypeLabel(type: CommunityContentType): string {
  switch (type) {
    case "announcement":
      return "Official";
    case "news":
      return "News";
    case "discussion":
      return "Discussion";
    case "proposal":
      return "Proposal";
    case "member_update":
      return "Update";
    default:
      return "Community";
  }
}
