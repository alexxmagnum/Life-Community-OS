# COMMUNITY_EXPERIENCE_EVOLUTION_AUDIT.md

**Phase:** 18C — Community Experience Evolution  
**Date:** 2026-09-01  
**Constraint:** No GlobalSocialNetworkEntity, UniversalCommunityFeed, UserEngagementScore, ResidentRanking, SocialGraph, PersonalBehaviorTracking, CommunityClone, or CrossTenantExperienceEntity. Never `if tenant === panoramica`.

Hierarchy: PLATFORM → TENANT → TERRITORY → PERSON → MEMBERSHIP → DOMAIN DATA.

---

## 1. LifeHomeContext

`packages/types/src/community/life-home.ts`

Territory Home Experience projection: hero, moments, now, upcoming, places, actions. Magic Plus eligibility from membership + capability, not plan.

---

## 2. DiscoverExperienceContext

`packages/types/src/community/discover-experience.ts`

Discover life near me — now, upcoming, living places, services, help. Not a catalog or user ranking.

---

## 3. LifePlaceExperienceView

`packages/types/src/platform/life-place-experience-view.ts`

Living place presentation over LifePlaceContext. Location remains SoT.

---

## 4. APIs

- `GET /api/community/home`
- `GET /api/community/discover`
- `GET /api/life-places/[locationId]` (+ `experienceView`)

---

## 5. Validation

- `pnpm -r typecheck` — PASS
- `pnpm lint` — PASS
- `pnpm --filter @life-community-os/types test` — 260 PASS
- `pnpm --filter @life-community-os/web test:isolation` — 400 PASS
- `pnpm --filter @life-community-os/web build` — PASS

---

## 6. Invariants

Community ≠ Social Network · Person ≠ Profile Feed · Experience ≠ Post · Location ≠ Place Entity · Privacy ≠ Permission
