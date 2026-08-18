# ADR — Location is the Place Source of Truth

## Status

Accepted — 2026-08-18

## Context

The product had two parallel “place” systems:

- **Location** — map SoT (geocoded, Life Map, business register, fichas)
- **LocalEntity** — discovery catalog for `/near` (in-memory tenant TS)

## Decision

1. **Location** is the single place aggregate for map + discovery + business.
2. **LocalEntity** is a *view projection* of Location (`locationToLocalEntity`), not a SoT.
3. Persistence is server-side (`/api/locations` → file store and/or Supabase `locations` table). Browser cache is not authoritative.
4. Tenant packs (e.g. Life Panorámica) may seed Locations; they do not own a second place database.

## Consequences

- `/near` hubs read Locations and open `/locations/[id]`.
- Legacy `/near/place/:id` redirects to Location fichas.
- Future tenants register packs; they do not fork place persistence.
