-- Life Community OS — Foundation Identity Model
-- ADR: docs/006_ARCHITECTURE_DECISIONS/ADR-001-FOUNDATION-IDENTITY-MODEL.md
--
-- Creates Tenant, Territory, Person, Identity, Membership.
-- No product UI. No future domains. No full RLS policies yet.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- tenants
-- SaaS customer / independent ecosystem
-- ---------------------------------------------------------------------------

create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  public_slug text not null,
  display_name text not null,
  configuration jsonb not null default '{}'::jsonb,
  status text not null default 'provisioned',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint tenants_public_slug_unique unique (public_slug),
  constraint tenants_public_slug_format check (
    public_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
  ),
  constraint tenants_status_allowed check (
    status in (
      'provisioned',
      'trial',
      'active',
      'suspended',
      'archived',
      'deleted'
    )
  )
);

comment on table public.tenants is
  'SaaS customer / independent ecosystem. Isolation root per ADR-001.';
comment on column public.tenants.public_slug is
  'Public tenant slug. Technical identity remains immutable; slug uniqueness enforced.';
comment on column public.tenants.configuration is
  'Tenant configuration placeholder (branding, languages, modules, etc.).';
comment on column public.tenants.status is
  'Tenant lifecycle status from Tenant Model documentation.';

create index tenants_status_idx on public.tenants (status);

-- ---------------------------------------------------------------------------
-- territories
-- Geographical / functional community environment
-- Tenant 1 --- * Territory
-- ---------------------------------------------------------------------------

create table public.territories (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint territories_tenant_id_fkey
    foreign key (tenant_id) references public.tenants (id)
    on delete restrict
);

comment on table public.territories is
  'Geographical or functional environment for community life. Belongs to exactly one Tenant.';
comment on column public.territories.tenant_id is
  'Owning Tenant. Enables tenant isolation for territory-scoped data.';
comment on column public.territories.description is
  'Optional description placeholder for Territory identity.';

create index territories_tenant_id_idx on public.territories (tenant_id);

-- ---------------------------------------------------------------------------
-- persons
-- Stable human domain identity (no tenant_id, not an auth account)
-- ---------------------------------------------------------------------------

create table public.persons (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.persons is
  'Stable human identity in the Domain. No tenant ownership. Not User Account, Membership, Role, or Permission.';

-- ---------------------------------------------------------------------------
-- identities
-- Authentication identity (Security Platform), linked to Person
-- ---------------------------------------------------------------------------

create table public.identities (
  id uuid primary key default gen_random_uuid(),
  provider_reference text not null,
  person_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint identities_person_id_fkey
    foreign key (person_id) references public.persons (id)
    on delete restrict,
  constraint identities_provider_reference_unique unique (provider_reference)
);

comment on table public.identities is
  'Authentication identity. Answers who is performing an action. Separate from domain Person.';
comment on column public.identities.provider_reference is
  'External auth provider subject/reference placeholder (replaceable infrastructure).';
comment on column public.identities.person_id is
  'Domain Person represented by this authentication identity.';

create index identities_person_id_idx on public.identities (person_id);

-- ---------------------------------------------------------------------------
-- memberships
-- Person belongs to Territory through Membership (belonging only)
-- ---------------------------------------------------------------------------

create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null,
  territory_id uuid not null,
  membership_type text not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint memberships_person_id_fkey
    foreign key (person_id) references public.persons (id)
    on delete restrict,
  constraint memberships_territory_id_fkey
    foreign key (territory_id) references public.territories (id)
    on delete restrict,
  constraint memberships_person_territory_unique unique (person_id, territory_id),
  constraint memberships_type_not_empty check (length(trim(membership_type)) > 0),
  constraint memberships_status_allowed check (
    status in ('active', 'inactive', 'ended')
  )
);

comment on table public.memberships is
  'Domain belonging of a Person within a Territory. Not authorization. Type is configurable.';
comment on column public.memberships.membership_type is
  'Configurable belonging classification (e.g. resident, visitor). Not a permission or role.';
comment on column public.memberships.status is
  'Membership lifecycle status (begin/change/end reflected as active/inactive/ended).';

create index memberships_person_id_idx on public.memberships (person_id);
create index memberships_territory_id_idx on public.memberships (territory_id);
create index memberships_type_idx on public.memberships (membership_type);
create index memberships_status_idx on public.memberships (status);

-- ---------------------------------------------------------------------------
-- Future tenant isolation preparation (no full RLS policies yet)
-- Tenant-owned rows carry tenant_id (territories) or inherit via territory.
-- Person has no tenant_id; tenant visibility is derived:
--   memberships -> territories.tenant_id
-- ---------------------------------------------------------------------------

comment on schema public is
  'Life Community OS public schema. Tenant isolation will be enforced via Security Platform / RLS in a later ADR.';
