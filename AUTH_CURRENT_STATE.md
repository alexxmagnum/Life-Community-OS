# Auth current state — Phase 2 (data plane)

**Date:** 2026-08-19  
**Phase 1:** User → Session → Person → Membership → Role → Permissions.  
**Phase 2:** Membership and domain data resolve from PostgreSQL when configured. `.data/` is a development fixture only. See `DATA_PERSISTENCE_AUDIT.md`.

---

## Where identity is born

| Source | Location | What it creates |
|--------|----------|-----------------|
| Supabase Auth | `POST /api/auth/login`, `POST /api/auth/register` | User (provider `user.id` + email). Cookies `lcos-access-token` / `lcos-refresh-token`. |
| Local fallback | `POST /api/auth/local-join` | Cookie `lcos-local-identity` = `local:{tenant}:{email}`. No password. |
| Membership ensure | `ensureDomainMembership` | Person + Identity + Membership (file, optional Supabase). |
| Session GET | `GET /api/auth/session` | **Also called ensure** (creates membership on every session hit). |
| TenantProvider | client default | **Marta** (`DEMO_PERSON_MARTA`) before/without session. |

Canonical domain (already in types, not wired as app context):

- **User** — technical login (`identities.provider_reference` / Supabase user id).
- **Person** — human in the community (`persons.id`). Not an auth account.
- **Membership** — Person + Tenant + Role (`memberships`).
- **Identity** — link User → Person.

---

## Where identity is lost

1. `TenantProvider` fetches `/api/auth/session` and stores `personId` / `role`, then **ignores them for product acting identity**.
2. Screens and providers use `demoMember.personId` (Marta or switchable demo catalog).
3. Refresh token is stored and never rotated/used.
4. Middleware treats any non-empty `lcos-access-token` as a session (no JWT expiry / signature check).

---

## Where identity is simulated

| Mechanism | Gate | Production risk |
|-----------|------|-----------------|
| `demoMember` / Marta | always on for Panorámica | **High** — UI actor is fake |
| `setRole` / `setDemoPersonId` | `NEXT_PUBLIC_LCOS_DEMO_ROLES` | Medium if left on |
| `roleSource: "demo"` when session fails | implicit | High |
| `local-join` `body.role` | none | **Critical** — escalation |
| Session auto-`ensureDomainMembership` | cookie presence | **Critical** — forged local id becomes member/admin |
| First empty-directory membership → administrator | bootstrap | Acceptable only for true first join |

---

## Where identity is duplicated

- Session fetch in `TenantProvider` **and** `ProfileScreen`.
- Tenant slug: header, cookie, query, env, default — **client-controlled**, not membership-bound.
- Memberships in Supabase **and** `.data/memberships/{slug}.json`.
- Capability checks on the client (`hasCapability`); mutation gates skip role when `LCOS_AUTH_REQUIRED` is off.
- `RequestActor` vs session JSON vs `demoMember` — three actors.

---

## Cookies

| Cookie | Flags (before) | Notes |
|--------|----------------|-------|
| `lcos-access-token` | httpOnly, lax, secure in production | Set on login/register. Middleware only checks presence. |
| `lcos-refresh-token` | same | Unused. |
| `lcos-local-identity` | httpOnly, lax, **not secure** | Local join. |
| `lcos-tenant-slug` | **not** httpOnly | Spoofable; not allowlisted. |

---

## Target after Phase 1

```
User → Auth provider → Session → Person → Membership → Role → Permissions → Application Context
```

Single client/server contract: `CurrentUserContext`.  
Demo identities: development-only.  
Tenant for an authenticated user: bound from memberships; manual switch to a tenant without membership → denied.
