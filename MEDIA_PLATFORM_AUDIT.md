# Media Platform audit (Phase 10.1)

Scope: one tenant-owned MediaAsset → Storage → Permissions layer for the whole platform. Does not modify Life Map, MapLibre, Territory Objects, Tenant Factory, Auth Foundation, Community Core schema, or Business / Housing / Reservation domain tables.

## What exists

### Platform contracts (ADR-020 / D.0.5c)

- `FileReference` + `FileVariant` in `packages/types/src/platform/files/`
- Lifecycle: temporary → processing → ready → archived → deleted
- Types: `image | video | document` only
- `ownerContext` is module/conversation metadata — **no person owner, no storage_key**
- `media-pipeline.ts` documents a future processor; **no runtime upload**
- `media-access.ts` is a projection helper (tenant + module ON), **not AuthZ**

### Communication

- `MessageAttachment` stores `fileId` + optional `url` (Phase 9)
- `message_attachments` table is **metadata only** — no bytes
- Attachment picker / `MediaCapturePlaceholder` are UX foundations
- Conversation `MediaPreview` is a bubble stub (“foundation”)

### Domain image fields (string URLs, not a file graph)

| Surface | Pattern | Runtime source |
|---|---|---|
| BusinessProfile | `imageUrl` | pack / Unsplash / empty |
| Property | `images[]` | pack / empty |
| MarketplaceListing | `images[]` | pack Unsplash |
| Location | `imageUrl` | catalog + Unsplash enrich |
| Resource / Experience | `imageUrl` / `images[]` | pack Unsplash |
| Community group / post | `imageUrl` / `authorAvatarUrl` | pack Unsplash |
| Profile / Avatar | `src` string | demo member Unsplash |
| Home nearby / intents | hardcoded Unsplash fallback | **runtime** |

### Storage providers

- **None.** No Supabase Storage bucket, no S3 adapter, no local blob store
- Durable JSON (`.data/`) holds domain records, not file bytes
- `localStorage` is used for housing-saves **IDs**, not files
- No CDN contract

### Demo / fake assets

- `images.unsplash.com` in tenant packs (Panoramica, Valley), HomeScreen fallback, location demo profiles, marketplace seed, work-posts avatars
- Hardcoded URLs in `enrich-location-presentation.ts` (Valley catalog)
- No base64 persistence found as a file SoT
- No per-module tables (`BusinessImages`, `HousingImages`, …) — good; the problem is **loose URL columns**

## What is demo

1. Unsplash URLs in tenant packs and location enrichers
2. HomeScreen nearby fallback Unsplash
3. Demo member avatars
4. Marketplace / work-post seed photography
5. Attachment picker “coming soon”
6. FileReference without storage

Pack JSON may keep Unsplash as **fixture illustration**. It must not be the runtime source of truth once MediaAsset exists.

## What must migrate

1. Introduce **MediaAsset** as the product persistence record (extends ADR-020; `FileReference` remains the delivery contract via mapper).
2. Introduce **MediaReference** `{ media_id, entity_type, entity_id, purpose }` instead of new image columns.
3. Server-issued `storage_key` only — never from the client.
4. Abstract storage: local development + Supabase Storage + S3-compatible interface.
5. APIs: upload / metadata / signed URL / delete with session + tenant + ownership.
6. Overlay Business / Housing / Marketplace / Profile / Message display from MediaReference without rewriting those domain tables.
7. Drop Unsplash as display SoT (`preferEntityMediaUrl` ignores demo hosts).
8. Wire reusable UI: MediaUploader, MediaGallery, MediaPreview, Avatar.

## Target graph

```
Entity (business | property | listing | message | event | profile | resource)
  → MediaReference (purpose: cover | gallery | avatar | attachment)
    → MediaAsset (owner_person_id, tenant_id, storage_key, status)
      → MediaStorageProvider (local | supabase | s3)
        → Permissions (owner manages; public purpose exposed to tenant; external DENIED)
```
