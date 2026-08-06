-- Life Community OS — Tenant Isolation RLS (Foundation)
-- ADR: docs/006_ARCHITECTURE_DECISIONS/ADR-001-FOUNDATION-IDENTITY-MODEL.md
-- ADR: docs/006_ARCHITECTURE_DECISIONS/ADR-002-TENANT-ISOLATION-MODEL.md
-- ADR: docs/006_ARCHITECTURE_DECISIONS/ADR-003-DATABASE-SECURITY-RLS-MODEL.md
--
-- Enables Row Level Security for tenant-owned and relationship-derived domain tables.
-- Does not implement Authentication, Authorization, UI, seeds, or Identity RLS.
--
-- Defense in depth (ADR-003):
--   1. Application Tenant Context resolution + query scoping remain mandatory.
--   2. RLS is mandatory so mistaken/unscoped queries cannot cross tenants.
-- Database security does not replace application filtering.
-- Application filtering does not replace database security.
--
-- Tenant Context reaches the database through trusted backend binding of
-- PostgreSQL session variables (GUCs). JWT claims may assist application
-- resolution but are not the RLS source of truth (ADR-003).
--
-- Service Role can bypass RLS by design. It must never be exposed to clients.
-- This migration does not grant, embed, or document Service Role credentials.

-- ---------------------------------------------------------------------------
-- Tenant Context helpers (session variables)
--
-- Trusted backends bind context per execution unit, e.g.:
--   select set_config('app.tenant_id',    '<tenant-uuid>',    true);
--   select set_config('app.territory_id', '<territory-uuid>', true); -- optional
--
-- Empty / unbound tenant context fails closed in policies.
-- Clients must not be able to set these variables through an open public RPC.
-- ---------------------------------------------------------------------------

create or replace function public.app_current_tenant_id()
returns uuid
language sql
stable
parallel safe
as $$
  select nullif(current_setting('app.tenant_id', true), '')::uuid;
$$;

comment on function public.app_current_tenant_id() is
  'Reads trusted Tenant Context from session GUC app.tenant_id. Null means unbound (fail closed).';

create or replace function public.app_current_territory_id()
returns uuid
language sql
stable
parallel safe
as $$
  select nullif(current_setting('app.territory_id', true), '')::uuid;
$$;

comment on function public.app_current_territory_id() is
  'Optional Territory scope from session GUC app.territory_id. Application enforces when required.';

create or replace function public.app_has_tenant_context()
returns boolean
language sql
stable
parallel safe
as $$
  select public.app_current_tenant_id() is not null;
$$;

comment on function public.app_has_tenant_context() is
  'True when Tenant Context is bound. RLS policies fail closed when false.';

create or replace function public.app_person_in_current_tenant(p_person_id uuid)
returns boolean
language sql
stable
parallel safe
as $$
  select exists (
    select 1
    from public.memberships m
    inner join public.territories t on t.id = m.territory_id
    where m.person_id = p_person_id
      and t.tenant_id = public.app_current_tenant_id()
  );
$$;

comment on function public.app_person_in_current_tenant(uuid) is
  'Relationship-derived Person visibility: Person → Membership → Territory → Tenant (ADR-001/003).';

create or replace function public.app_set_tenant_context(
  p_tenant_id uuid,
  p_territory_id uuid default null
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if p_tenant_id is null then
    raise exception 'Tenant Context is required (fail closed)'
      using errcode = 'P0001';
  end if;

  perform set_config('app.tenant_id', p_tenant_id::text, true);

  if p_territory_id is null then
    perform set_config('app.territory_id', '', true);
  else
    perform set_config('app.territory_id', p_territory_id::text, true);
  end if;
end;
$$;

comment on function public.app_set_tenant_context(uuid, uuid) is
  'Binds Tenant Context (and optional Territory) to transaction-local session variables. '
  'Callable only from trusted backend SQL sessions. Do not expose as a public client RPC '
  'without Authorization that validates the declared tenant. Not a substitute for AuthZ.';

-- Fail closed: no broad EXECUTE grants. Trusted backends use set_config / this helper
-- over privileged server connections. Service Role credentials must never ship to clients.
revoke all on function public.app_current_tenant_id() from public;
revoke all on function public.app_current_territory_id() from public;
revoke all on function public.app_has_tenant_context() from public;
revoke all on function public.app_person_in_current_tenant(uuid) from public;
revoke all on function public.app_set_tenant_context(uuid, uuid) from public;

grant execute on function public.app_current_tenant_id() to anon, authenticated;
grant execute on function public.app_current_territory_id() to anon, authenticated;
grant execute on function public.app_has_tenant_context() to anon, authenticated;
grant execute on function public.app_person_in_current_tenant(uuid) to anon, authenticated;

-- Setter is intentionally not granted to anon/authenticated (prevents open tenant spoofing RPCs).
-- Server-side SQL may still call set_config('app.tenant_id', ..., true) directly.

-- ---------------------------------------------------------------------------
-- Enable RLS (FORCE so table owners in ordinary sessions cannot skip policies)
-- identities intentionally omitted — Security Platform responsibility (ADR-003)
-- ---------------------------------------------------------------------------

alter table public.tenants enable row level security;
alter table public.tenants force row level security;

alter table public.territories enable row level security;
alter table public.territories force row level security;

alter table public.memberships enable row level security;
alter table public.memberships force row level security;

alter table public.persons enable row level security;
alter table public.persons force row level security;

comment on table public.tenants is
  'SaaS customer / independent ecosystem. Isolation root per ADR-001. '
  'RLS: row visible only when id equals bound Tenant Context (ADR-003). '
  'Application Tenant Context filtering remains mandatory (defense in depth).';

comment on table public.territories is
  'Geographical or functional environment for community life. Belongs to exactly one Tenant. '
  'RLS: tenant_id must equal bound Tenant Context. Application filtering remains mandatory.';

comment on table public.memberships is
  'Domain belonging of a Person within a Territory. Not authorization. '
  'RLS: access via territory → tenant ownership matching bound Tenant Context. '
  'Application filtering remains mandatory.';

comment on table public.persons is
  'Stable human identity in the Domain. No tenant_id ownership column (ADR-001). '
  'RLS is relationship-derived: Person → Membership → Territory → Tenant. '
  'Person is not globally readable across tenants. Application filtering remains mandatory. '
  'RLS exists so unscoped queries cannot leak Persons across tenants; '
  'application filtering exists because Authorization, Automation and AI need explicit Tenant Context.';

comment on table public.identities is
  'Authentication identity (Security Platform). Not domain tenant Business Data. '
  'Intentionally excluded from this domain RLS migration (ADR-003). '
  'Access is governed by Identity/Authentication/Authorization — not Membership.';

comment on schema public is
  'Life Community OS public schema. Tenant isolation enforced via application Tenant Context '
  'and database RLS (ADR-002/ADR-003). identities remain outside domain RLS.';

-- ---------------------------------------------------------------------------
-- Policies: tenants
-- Access only the Tenant matching current Tenant Context
-- ---------------------------------------------------------------------------

create policy tenants_select_current_context
  on public.tenants
  for select
  using (
    public.app_has_tenant_context()
    and id = public.app_current_tenant_id()
  );

create policy tenants_insert_current_context
  on public.tenants
  for insert
  with check (
    public.app_has_tenant_context()
    and id = public.app_current_tenant_id()
  );

create policy tenants_update_current_context
  on public.tenants
  for update
  using (
    public.app_has_tenant_context()
    and id = public.app_current_tenant_id()
  )
  with check (
    public.app_has_tenant_context()
    and id = public.app_current_tenant_id()
  );

create policy tenants_delete_current_context
  on public.tenants
  for delete
  using (
    public.app_has_tenant_context()
    and id = public.app_current_tenant_id()
  );

-- ---------------------------------------------------------------------------
-- Policies: territories
-- Access only territories owned by current Tenant Context
-- ---------------------------------------------------------------------------

create policy territories_select_current_tenant
  on public.territories
  for select
  using (
    public.app_has_tenant_context()
    and tenant_id = public.app_current_tenant_id()
  );

create policy territories_insert_current_tenant
  on public.territories
  for insert
  with check (
    public.app_has_tenant_context()
    and tenant_id = public.app_current_tenant_id()
  );

create policy territories_update_current_tenant
  on public.territories
  for update
  using (
    public.app_has_tenant_context()
    and tenant_id = public.app_current_tenant_id()
  )
  with check (
    public.app_has_tenant_context()
    and tenant_id = public.app_current_tenant_id()
  );

create policy territories_delete_current_tenant
  on public.territories
  for delete
  using (
    public.app_has_tenant_context()
    and tenant_id = public.app_current_tenant_id()
  );

-- ---------------------------------------------------------------------------
-- Policies: memberships
-- Access through Territory tenant ownership (Membership → Territory → Tenant)
-- ---------------------------------------------------------------------------

create policy memberships_select_via_territory_tenant
  on public.memberships
  for select
  using (
    public.app_has_tenant_context()
    and exists (
      select 1
      from public.territories t
      where t.id = memberships.territory_id
        and t.tenant_id = public.app_current_tenant_id()
    )
  );

create policy memberships_insert_via_territory_tenant
  on public.memberships
  for insert
  with check (
    public.app_has_tenant_context()
    and exists (
      select 1
      from public.territories t
      where t.id = memberships.territory_id
        and t.tenant_id = public.app_current_tenant_id()
    )
  );

create policy memberships_update_via_territory_tenant
  on public.memberships
  for update
  using (
    public.app_has_tenant_context()
    and exists (
      select 1
      from public.territories t
      where t.id = memberships.territory_id
        and t.tenant_id = public.app_current_tenant_id()
    )
  )
  with check (
    public.app_has_tenant_context()
    and exists (
      select 1
      from public.territories t
      where t.id = memberships.territory_id
        and t.tenant_id = public.app_current_tenant_id()
    )
  );

create policy memberships_delete_via_territory_tenant
  on public.memberships
  for delete
  using (
    public.app_has_tenant_context()
    and exists (
      select 1
      from public.territories t
      where t.id = memberships.territory_id
        and t.tenant_id = public.app_current_tenant_id()
    )
  );

-- ---------------------------------------------------------------------------
-- Policies: persons
-- Relationship-derived access (no persons.tenant_id)
--
-- SELECT / UPDATE / DELETE: Person visible only when Membership links the
-- Person into a Territory owned by the active Tenant Context.
--
-- INSERT: require bound Tenant Context so Person creation is an explicit
-- tenant-scoped operation; visibility begins once Membership exists.
-- ---------------------------------------------------------------------------

create policy persons_select_via_membership_tenant
  on public.persons
  for select
  using (
    public.app_has_tenant_context()
    and public.app_person_in_current_tenant(id)
  );

create policy persons_insert_with_tenant_context
  on public.persons
  for insert
  with check (public.app_has_tenant_context());

create policy persons_update_via_membership_tenant
  on public.persons
  for update
  using (
    public.app_has_tenant_context()
    and public.app_person_in_current_tenant(id)
  )
  with check (
    public.app_has_tenant_context()
    and public.app_person_in_current_tenant(id)
  );

create policy persons_delete_via_membership_tenant
  on public.persons
  for delete
  using (
    public.app_has_tenant_context()
    and public.app_person_in_current_tenant(id)
  );
