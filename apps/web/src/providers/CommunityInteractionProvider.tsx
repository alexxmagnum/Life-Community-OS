"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  CommunityCommentRecord,
  CommunityPost,
  CommunityReaction,
} from "@life-community-os/types";
import {
  type CommunityAuthor,
  type CommunityComment,
  type CommunityContent,
  type CommunityContentType,
  type ReactionKind,
} from "@life-community-os/tenant-life-panoramica";
import { useTenant } from "./TenantProvider";
import { useCurrentUser } from "./CurrentUserProvider";
import { postToHubContent } from "@/lib/community/map-to-ui";
import {
  addCommunityCommentRequest,
  createCommunityPostRequest,
  fetchCommunityFeed,
  toggleCommunityReactionRequest,
} from "@/lib/community/community-client";

type CommunityInteractionContextValue = {
  feedItems: CommunityContent[];
  getContent: (id: string) => CommunityContent | undefined;
  getMyReaction: (contentId: string) => ReactionKind | null;
  isSaved: (contentId: string) => boolean;
  isReported: (contentId: string) => boolean;
  toggleReaction: (contentId: string, kind: ReactionKind) => void;
  addComment: (contentId: string, body: string) => void;
  toggleSave: (contentId: string) => void;
  reportContent: (contentId: string) => void;
  createPublication: (input: {
    title: string;
    body: string;
    type?: Extract<CommunityContentType, "member_update" | "discussion">;
    areaLabel?: string;
  }) => CommunityContent | null;
};

const CommunityInteractionContext =
  createContext<CommunityInteractionContextValue | null>(null);

export function CommunityInteractionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { tenantSlug, hasMembership } = useTenant();
  const { currentUser } = useCurrentUser();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [comments, setComments] = useState<CommunityCommentRecord[]>([]);
  const [reactions, setReactions] = useState<CommunityReaction[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [reportedIds, setReportedIds] = useState<string[]>([]);
  const [localComments, setLocalComments] = useState<
    Record<string, CommunityComment[]>
  >({});

  const personId = currentUser.personId;
  const displayName =
    currentUser.displayName?.trim() ||
    currentUser.email?.split("@")[0] ||
    "Vecino";

  useEffect(() => {
    let cancelled = false;
    if (!hasMembership) {
      setPosts([]);
      setComments([]);
      setReactions([]);
      return;
    }
    void (async () => {
      const data = await fetchCommunityFeed(tenantSlug);
      if (cancelled) return;
      setPosts((data.posts as CommunityPost[]) ?? []);
      setComments((data.comments as CommunityCommentRecord[]) ?? []);
      setReactions((data.reactions as CommunityReaction[]) ?? []);
    })();
    return () => {
      cancelled = true;
    };
  }, [tenantSlug, hasMembership]);

  const feedItems = useMemo(() => {
    return posts
      .filter((post) => post.status === "published")
      .map((post) => {
        const mapped = postToHubContent(post, comments, reactions);
        const extra = localComments[post.id] ?? [];
        return {
          ...mapped,
          comments: [...mapped.comments, ...extra],
          commentCount: mapped.commentCount + extra.length,
        };
      })
      .sort(
        (a, b) =>
          new Date(b.publishedAt ?? b.createdAt).getTime() -
          new Date(a.publishedAt ?? a.createdAt).getTime(),
      );
  }, [posts, comments, reactions, localComments]);

  const getContent = useCallback(
    (id: string) => feedItems.find((item) => item.id === id),
    [feedItems],
  );

  const getMyReaction = useCallback(
    (contentId: string) => {
      if (!personId) return null;
      const mine = reactions.find(
        (item) =>
          item.personId === personId &&
          item.targetId === contentId &&
          item.targetType === "post",
      );
      return (mine?.kind as ReactionKind | undefined) ?? null;
    },
    [personId, reactions],
  );

  const isSaved = useCallback(
    (contentId: string) => savedIds.includes(contentId),
    [savedIds],
  );

  const isReported = useCallback(
    (contentId: string) => reportedIds.includes(contentId),
    [reportedIds],
  );

  const toggleReaction = useCallback(
    (contentId: string, kind: ReactionKind) => {
      if (!personId) return;
      setReactions((prev) => {
        const existing = prev.find(
          (item) =>
            item.personId === personId &&
            item.targetId === contentId &&
            item.kind === kind,
        );
        if (existing) {
          return prev.filter((item) => item.id !== existing.id);
        }
        return [
          {
            id: `local-r-${Date.now()}`,
            tenantId: tenantSlug,
            personId,
            targetType: "post",
            targetId: contentId,
            kind,
            createdBy: personId,
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ];
      });
      void toggleCommunityReactionRequest({
        tenantId: tenantSlug,
        targetId: contentId,
        kind,
      });
    },
    [personId, tenantSlug],
  );

  const addComment = useCallback(
    (contentId: string, body: string) => {
      const trimmed = body.trim();
      if (!trimmed || !personId) return;
      const author: CommunityAuthor = {
        id: personId,
        name: displayName,
      };
      const comment: CommunityComment = {
        id: `local-c-${Date.now()}`,
        author,
        body: trimmed,
        createdAt: new Date().toISOString(),
      };
      setLocalComments((prev) => ({
        ...prev,
        [contentId]: [...(prev[contentId] ?? []), comment],
      }));
      void addCommunityCommentRequest({
        tenantId: tenantSlug,
        postId: contentId,
        body: trimmed,
      });
    },
    [displayName, personId, tenantSlug],
  );

  const toggleSave = useCallback((contentId: string) => {
    setSavedIds((prev) =>
      prev.includes(contentId)
        ? prev.filter((id) => id !== contentId)
        : [...prev, contentId],
    );
  }, []);

  const reportContent = useCallback((contentId: string) => {
    setReportedIds((prev) =>
      prev.includes(contentId) ? prev : [...prev, contentId],
    );
  }, []);

  const createPublication = useCallback(
    (input: {
      title: string;
      body: string;
      type?: Extract<CommunityContentType, "member_update" | "discussion">;
      areaLabel?: string;
    }) => {
      const title = input.title.trim();
      const body = input.body.trim();
      if (!title || !body || !personId) return null;
      const now = new Date().toISOString();
      const optimistic: CommunityPost = {
        id: `local-post-${Date.now()}`,
        tenantId: tenantSlug,
        authorPersonId: personId,
        authorDisplayName: displayName,
        kind: input.type ?? "member_update",
        title,
        body,
        status: "published",
        createdBy: personId,
        createdAt: now,
        updatedAt: now,
      };
      setPosts((prev) => [optimistic, ...prev]);
      void createCommunityPostRequest({
        tenantId: tenantSlug,
        title,
        body,
        kind: input.type,
      }).then((result) => {
        if ("post" in result && result.post) {
          const created = result.post as CommunityPost;
          setPosts((prev) =>
            prev.map((item) => (item.id === optimistic.id ? created : item)),
          );
        }
      });
      return postToHubContent(optimistic, [], []);
    },
    [displayName, personId, tenantSlug],
  );

  const value = useMemo(
    () => ({
      feedItems,
      getContent,
      getMyReaction,
      isSaved,
      isReported,
      toggleReaction,
      addComment,
      toggleSave,
      reportContent,
      createPublication,
    }),
    [
      feedItems,
      getContent,
      getMyReaction,
      isSaved,
      isReported,
      toggleReaction,
      addComment,
      toggleSave,
      reportContent,
      createPublication,
    ],
  );

  return (
    <CommunityInteractionContext.Provider value={value}>
      {children}
    </CommunityInteractionContext.Provider>
  );
}

export function useCommunityInteractions() {
  const ctx = useContext(CommunityInteractionContext);
  if (!ctx) {
    throw new Error(
      "useCommunityInteractions must be used within CommunityInteractionProvider",
    );
  }
  return ctx;
}
