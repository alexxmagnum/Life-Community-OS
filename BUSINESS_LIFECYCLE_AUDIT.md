# Business Lifecycle Audit — Phase 18L-FIX-C

Reference: `REAL_USER_JOURNEY_AUDIT.md` (B-01, B-04)

## Product principle

A business is a **local entity** within **tenant + territory**, not generic content. It requires a **trust state** before public discovery.

## Lifecycle model

| Product phase | Persisted status | Public visibility |
|---------------|------------------|-------------------|
| DRAFT | `draft` | Hidden |
| SUBMITTED | `pending_review` | Hidden |
| REVIEWING | `pending_review` | Hidden |
| PUBLISHED | `published` | Visible |
| SUSPENDED | `suspended` | Hidden |

Helpers: `packages/types/src/domain/business-lifecycle.ts`

## Current creation flow (before fix)

| Step | Component / API | Behaviour |
|------|-----------------|-----------|
| Entry | `/business/register` | `BusinessRegistrationScreen` |
| Create | `POST /api/businesses` | `createRegisteredBusiness()` → `draft`, location `private` |
| **Bug** | Same screen `onSave()` | Called `publishBusinessRequest()` immediately after create |
| Publish API | `POST /api/businesses/[id]/publish` | Owner → `pending_review`; **staff → `published` (bypass review)** |
| Copy | Screen subtitle | “Quedará en borrador hasta que un administrador lo publique” |
| Button | Primary action | “Enviar a revisión” while auto-submitting on save |

**Inconsistency (B-01):** UI promised draft-first admin approval, but save always submitted for review (and staff could auto-publish).

## Publication & visibility (existing, mostly correct)

| Surface | Filter | Notes |
|---------|--------|-------|
| `businessVisibleToActor` | Only `published` for guests/members | Owners/staff see non-published |
| `DiscoverScreen` | `status: "published"` | OK |
| `listLocationsForMapVisibility` | Synced via `locationVisibilityForStatus` | OK |
| `GET /api/businesses` | `businessVisibleToActor` + optional status | OK |

## Permissions (existing)

| Actor | Create | Edit own | Submit review | Approve | Public view |
|-------|--------|----------|---------------|---------|-------------|
| Visitor | No | No | No | No | Published only |
| Member | Yes | Yes | Yes (draft) | No | Published only |
| Admin/Mod | Yes | All tenant | Via review API | Yes | All statuses |

## Admin review (existing)

- `AdminBusinessesScreen` — lists pending, draft, published, suspended
- `POST /api/businesses/[id]/review` — `approve` → published, `reject` → draft, `suspend` → suspended
- `LocationDetailScreen` — staff “Publicar” uses review API (correct)

## Domain boundaries (unchanged)

| Domain | Route / surface | Lifecycle |
|--------|-----------------|-----------|
| Business | `/business/register`, `/locations/[id]` | Full lifecycle |
| Services (work post) | `/services/work/create` | Separate work-offer flow — not business lifecycle |
| Help | `/help/create` | Community help — not business |
| Experience | `/experiences/create` | May reference a business as context — Business ≠ Experience |

## Fixes applied (Phase 18L-FIX-C)

1. Registration saves **draft only** — no auto-submit on create
2. Owner submits via “Solicitar presencia en la comunidad” from location manage panel
3. Publish route: owners **draft → pending_review** only; staff use review endpoint
4. Product copy aligned (`businessLifecycleLabel`, `businessOwnerStatusMessage`)
5. Admin queue: approve/reject only for `pending_review`; lifecycle labels in admin UI
6. Public ficha hides internal status; owners see clear status message
7. Isolation tests: `business-lifecycle-isolation.test.ts`

## Explicit non-goals

- No GlobalBusinessEntity, social feed, ranking, reviews, likes, followers
- Business ≠ Post ≠ Experience ≠ Service request
