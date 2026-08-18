# ADR — Membership roles on existing memberships table

## Status

Accepted — 2026-08-18

## Decision

1. Auth user (`identities.provider_reference`) links to `persons`.
2. Tenant belonging is `memberships` on the tenant territory.
3. Capability role is stored in `memberships.membership_type` using
   `MembershipRole` (`member` | `group_manager` | `moderator` | `administrator`).
4. When Supabase is unavailable, the same shape is mirrored under
   `apps/web/.data/memberships/{tenant}.json`.
5. Client `setRole` is a no-op once a membership session is active.

## Consequences

- `/api/auth/session` returns `role` + `personId` + `membership`.
- Local validation without Supabase uses `/api/auth/local-join`.
- Life Valley (`life-valley`) proves a second tenant pack + catalogs.
