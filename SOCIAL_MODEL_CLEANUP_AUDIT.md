# Social Model Cleanup Audit — Phase 18M-FIX-A

**Date:** 2026-09-02  
**Scope:** Identify social-network vestiges; confirm Experience ≠ Post, Community ≠ Social Network  
**Action:** Audit + targeted cleanup where safe without domain changes

---

## Search terms

`like`, `liked`, `reaction`, `followers`, `feed`, `post`, `engagement`

---

## Findings

| Location | Signal | Verdict | Action |
|----------|--------|---------|--------|
| `HomeScreen.tsx` | `HomeMoveCard liked` prop | Vestige | **Removed** — no like UI on home moves |
| `HomePremium.tsx` | `liked` optional on move card | Legacy component API | Keep optional prop unused; no product loop |
| `CommunityInteractionProvider` | `reactions` state | Data layer for plaza content detail | **Keep** — not primary feed loop; document as legacy |
| `CommunityContentDetailScreen` | `reactionCounts` display | Ack/support on official content | **Keep for now** — not likes/followers; rename candidate P3 |
| `map-to-ui.ts` | `reactionCounts` projection | Maps posts to hub content | **Keep** — internal; not surfaced as social feed |
| `/api/community/reactions` | Reaction API | Exists for content detail | **Keep** — not exposed in Magic Plus or primary nav |
| `community-feed.ts` | Feed projection | Domain entities, not social wall | **Correct** — feed = typed actions |
| Magic Plus | No `post_create` | ✓ | None |
| Navigation | No followers/likes/ranking | ✓ | None |

---

## Confirmed invariants

```
Experience ≠ Post
Announcement ≠ Post
Community ≠ Social Network
Business ≠ Post
Help ≠ Post
Activity metrics ≠ Engagement metrics
```

---

## Remaining P2/P3 (not blocking)

1. Rename reaction semantics to `acknowledge` / `support` in UI copy (content detail only).
2. Remove unused `liked` from `HomeMoveCard` component API when safe for all consumers.
3. Audit plaza `posts` table usage — legacy path, not primary activation loop.

---

## Phase 18M-FIX-A cleanup applied

- Home community moves no longer pass `liked` prop.
- Activation metrics explicitly exclude engagement fields (`FORBIDDEN_ACTIVATION_METRIC_KEYS`).
- No new social features added.

---

*Audit complete. No social feed, ranking, or follower graph introduced.*
