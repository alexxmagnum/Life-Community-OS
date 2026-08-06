-- Life Community OS — Database grants for tenant-domain tables
-- ADR: docs/006_ARCHITECTURE_DECISIONS/ADR-003-DATABASE-SECURITY-RLS-MODEL.md
-- Depends on: 20260806130000_tenant_isolation_rls.sql
--
-- Privilege model (defense in depth):
--   GRANT  = table-level access (can the role touch this relation at all?)
--   RLS    = row-level visibility/mutation (which rows are allowed?)
--
-- Granting SELECT/INSERT/UPDATE/DELETE to `authenticated` does NOT weaken
-- tenant isolation. Unbound Tenant Context still fails closed; policies still
-- restrict rows to the bound Tenant Context (ADR-002 / ADR-003).
--
-- Does not modify existing RLS policies.
-- Does not grant table access to `identities` (Security Platform responsibility).
-- Does not expose Service Role credentials.

-- ---------------------------------------------------------------------------
-- Tenant-domain tables: authenticated may operate; RLS still enforces isolation
-- ---------------------------------------------------------------------------

grant select, insert, update, delete
  on table public.tenants
  to authenticated;

grant select, insert, update, delete
  on table public.territories
  to authenticated;

grant select, insert, update, delete
  on table public.memberships
  to authenticated;

grant select, insert, update, delete
  on table public.persons
  to authenticated;

comment on table public.tenants is
  'SaaS customer / independent ecosystem. Isolation root per ADR-001. '
  'RLS: row visible only when id equals bound Tenant Context (ADR-003). '
  'Application Tenant Context filtering remains mandatory (defense in depth). '
  'GRANT to authenticated enables table access; RLS policies still control which tenant rows are visible.';

comment on table public.territories is
  'Geographical or functional environment for community life. Belongs to exactly one Tenant. '
  'RLS: tenant_id must equal bound Tenant Context. Application filtering remains mandatory. '
  'GRANT to authenticated enables table access; RLS policies still enforce tenant isolation.';

comment on table public.memberships is
  'Domain belonging of a Person within a Territory. Not authorization. '
  'RLS: access via territory → tenant ownership matching bound Tenant Context. '
  'Application filtering remains mandatory. '
  'GRANT to authenticated enables table access; RLS policies still enforce tenant isolation.';

comment on table public.persons is
  'Stable human identity in the Domain. No tenant_id ownership column (ADR-001). '
  'RLS is relationship-derived: Person → Membership → Territory → Tenant. '
  'Person is not globally readable across tenants. Application filtering remains mandatory. '
  'RLS exists so unscoped queries cannot leak Persons across tenants; '
  'application filtering exists because Authorization, Automation and AI need explicit Tenant Context. '
  'GRANT to authenticated enables table access; RLS policies still control relationship-derived visibility.';

-- ---------------------------------------------------------------------------
-- identities: intentionally no table GRANT to authenticated
-- Security Platform owns Identity access (ADR-003).
-- ---------------------------------------------------------------------------

comment on table public.identities is
  'Authentication identity (Security Platform). Not domain tenant Business Data. '
  'Intentionally excluded from domain RLS and from authenticated table GRANTs (ADR-003). '
  'Access is governed by Identity/Authentication/Authorization — not Membership. '
  'GRANT allows table access on tenant-domain tables only; identities remain ungated here.';
