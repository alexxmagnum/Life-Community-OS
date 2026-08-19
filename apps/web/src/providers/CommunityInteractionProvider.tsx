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
import {
  contentTypeLabel,
  getCommunityContentById,
  listPublishedCommunityContent,
  type CommunityAuthor,
  type CommunityComment,
  type CommunityContent,
  type CommunityContentType,
  type PublishingStatus,
  type ReactionKind,
} from "@life-community-os/tenant-life-panoramica";
import { useTenant } from "./TenantProvider";
import { useTenantCatalogs } from "./CatalogProvider";
import {
  hydrateDurableState,
  pushDurableState,
} from "@/lib/durable/client";

const STORAGE_KEY = "lcos:community-interactions";
const DURABLE_KEY = "community-interactions";

type LocalOverrides = {
  /** User-created published posts */
  created: CommunityContent[];
  reactions: Record<string, ReactionKind | null>;
  /** Extra comments keyed by content id */
  comments: Record<string, CommunityComment[]>;
  savedIds: string[];
  reportedIds: string[];
};

const emptyOverrides = (): LocalOverrides => ({
  created: [],
  reactions: {},
  comments: {},
  savedIds: [],
  reportedIds: [],
});

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

function readStorage(): LocalOverrides {
  if (typeof window === "undefined") return emptyOverrides();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyOverrides();
    return { ...emptyOverrides(), ...(JSON.parse(raw) as LocalOverrides) };
  } catch {
    return emptyOverrides();
  }
}

function writeStorage(data: LocalOverrides) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  pushDurableState(DURABLE_KEY, data);
}

function mergeContent(
  base: CommunityContent,
  overrides: LocalOverrides,
): CommunityContent {
  const extraComments = overrides.comments[base.id] ?? [];
  const myReaction = overrides.reactions[base.id];
  const reactionCounts = { ...base.reactionCounts };
  if (myReaction) {
    reactionCounts[myReaction] = (reactionCounts[myReaction] ?? 0) + 1;
  }
  return {
    ...base,
    comments: [...base.comments, ...extraComments],
    commentCount: base.commentCount + extraComments.length,
    reactionCounts,
  };
}

export function CommunityInteractionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { demoPersonId, demoMember, tenantSlug, homeMode } = useTenant();
  const { catalogs, ready: catalogReady } = useTenantCatalogs();
  const [overrides, setOverrides] = useState<LocalOverrides>(emptyOverrides);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setHydrated(false);
    void (async () => {
      const remote = await hydrateDurableState<LocalOverrides>(
        DURABLE_KEY,
        tenantSlug,
      );
      if (cancelled) return;
      if (remote) {
        const merged = { ...emptyOverrides(), ...remote };
        setOverrides(merged);
        window.localStorage.setItem(
          `${STORAGE_KEY}:${tenantSlug}`,
          JSON.stringify(merged),
        );
      } else {
        try {
          const raw = window.localStorage.getItem(
            `${STORAGE_KEY}:${tenantSlug}`,
          );
          if (raw) {
            setOverrides({
              ...emptyOverrides(),
              ...(JSON.parse(raw) as LocalOverrides),
            });
          } else {
            setOverrides(emptyOverrides());
          }
        } catch {
          setOverrides(emptyOverrides());
        }
      }
      setHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [tenantSlug]);

  useEffect(() => {
    if (!hydrated) return;
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      `${STORAGE_KEY}:${tenantSlug}`,
      JSON.stringify(overrides),
    );
    pushDurableState(DURABLE_KEY, overrides, tenantSlug);
  }, [overrides, hydrated, tenantSlug]);

  const getContent = useCallback(
    (id: string) => {
      const created = overrides.created.find((c) => c.id === id);
      if (created) return mergeContent(created, overrides);
      const fromCatalog = (catalogs.community as CommunityContent[]).find(
        (c) => c.id === id,
      );
      if (fromCatalog) return mergeContent(fromCatalog, overrides);
      // Premium pack fallback — never leak reference catalogs into catalog tenants.
      if (homeMode !== "premium") return undefined;
      const base = getCommunityContentById(id);
      if (!base) return undefined;
      return mergeContent(base, overrides);
    },
    [overrides, catalogs.community, homeMode],
  );

  const feedItems = useMemo(() => {
    const publishedCreated = overrides.created.filter(
      (c) => c.status === "published",
    );
    const baseCatalog =
      catalogReady && catalogs.community.length > 0
        ? (catalogs.community as CommunityContent[]).filter(
            (c) => c.status === "published",
          )
        : homeMode === "premium"
          ? listPublishedCommunityContent()
          : [];
    const catalog = baseCatalog.map((c) => mergeContent(c, overrides));
    const seen = new Set<string>();
    const merged: CommunityContent[] = [];
    for (const item of [
      ...publishedCreated.map((c) => mergeContent(c, overrides)),
      ...catalog,
    ]) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      merged.push(item);
    }
    return merged.sort(
      (a, b) =>
        new Date(b.publishedAt ?? b.createdAt).getTime() -
        new Date(a.publishedAt ?? a.createdAt).getTime(),
    );
  }, [overrides, catalogs.community, catalogReady, homeMode]);

  const getMyReaction = useCallback(
    (contentId: string) => overrides.reactions[contentId] ?? null,
    [overrides.reactions],
  );

  const isSaved = useCallback(
    (contentId: string) => overrides.savedIds.includes(contentId),
    [overrides.savedIds],
  );

  const isReported = useCallback(
    (contentId: string) => overrides.reportedIds.includes(contentId),
    [overrides.reportedIds],
  );

  const toggleReaction = useCallback((contentId: string, kind: ReactionKind) => {
    setOverrides((prev) => {
      const current = prev.reactions[contentId] ?? null;
      const next = current === kind ? null : kind;
      return {
        ...prev,
        reactions: { ...prev.reactions, [contentId]: next },
      };
    });
  }, []);

  const addComment = useCallback(
    (contentId: string, body: string) => {
      const trimmed = body.trim();
      if (!trimmed) return;
      const author: CommunityAuthor = {
        id: demoPersonId,
        name: demoMember.displayName,
        avatarUrl: demoMember.avatarUrl,
      };
      const mentionNames = Array.from(
        trimmed.matchAll(/@([A-Za-zÀ-ÿ]+)/g),
        (m) => m[1]!,
      );
      const comment: CommunityComment = {
        id: `local-c-${Date.now()}`,
        author,
        body: trimmed,
        createdAt: new Date().toISOString(),
        mentionNames: mentionNames.length ? mentionNames : undefined,
      };
      setOverrides((prev) => ({
        ...prev,
        comments: {
          ...prev.comments,
          [contentId]: [...(prev.comments[contentId] ?? []), comment],
        },
      }));
    },
    [demoMember.avatarUrl, demoMember.displayName, demoPersonId],
  );

  const toggleSave = useCallback((contentId: string) => {
    setOverrides((prev) => {
      const has = prev.savedIds.includes(contentId);
      return {
        ...prev,
        savedIds: has
          ? prev.savedIds.filter((id) => id !== contentId)
          : [...prev.savedIds, contentId],
      };
    });
  }, []);

  const reportContent = useCallback((contentId: string) => {
    setOverrides((prev) => ({
      ...prev,
      reportedIds: prev.reportedIds.includes(contentId)
        ? prev.reportedIds
        : [...prev.reportedIds, contentId],
    }));
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
      if (!title || !body) return null;
      const now = new Date().toISOString();
      const status: PublishingStatus = "published";
      const item: CommunityContent = {
        id: `cc-local-${Date.now()}`,
        type: input.type ?? "member_update",
        title,
        body,
        status,
        isOfficial: false,
        author: {
          id: demoPersonId,
          name: demoMember.fullName,
          avatarUrl: demoMember.avatarUrl,
        },
        areaLabel: input.areaLabel ?? demoMember.areaLabel,
        createdAt: now,
        publishedAt: now,
        commentCount: 0,
        reactionCounts: { acknowledge: 0, support: 0 },
        comments: [],
      };
      setOverrides((prev) => ({
        ...prev,
        created: [item, ...prev.created],
      }));
      return item;
    },
    [
      demoMember.areaLabel,
      demoMember.avatarUrl,
      demoMember.fullName,
      demoPersonId,
    ],
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

export { contentTypeLabel };
