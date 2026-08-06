-- Life Community OS — Property foundation (real estate unit)
-- ADR: docs/006_ARCHITECTURE_DECISIONS/ADR-007-PROPERTY-MODEL.md
-- ADR: docs/006_ARCHITECTURE_DECISIONS/ADR-006-PHYSICAL-LOCATION-MODEL.md
-- ADR: docs/006_ARCHITECTURE_DECISIONS/ADR-003-DATABASE-SECURITY-RLS-MODEL.md
--
-- Creates public.properties as a real estate unit located at an Address.
--
-- Security (ADR-003 / ADR-006 / ADR-007):
--   - Property is NOT a security boundary.
--   - Isolation path: Property → Address → Territory → Tenant.
--   - No tenant_id column; no RLS in this migration (follow-up).
--
-- Property does not own people. Future Property ↔ Person links use roles
-- (owner, resident, tenant, authorized_person) in a separate model.
--
-- Does not create: persons, owners, residents, memberships, user accounts.

-- ---------------------------------------------------------------------------
-- properties
-- Real estate unit located at an Address
-- ---------------------------------------------------------------------------

create table public.properties (
  id uuid primary key default gen_random_uuid(),
  address_id uuid not null,
  property_type text not null,
  name text,
  metadata jsonb not null default '{}'::jsonb,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint properties_address_id_fkey
    foreign key (address_id) references public.addresses (id)
    on delete restrict,

  constraint properties_type_allowed check (
    property_type in (
      'residential',
      'commercial',
      'garage',
      'storage',
      'land',
      'other'
    )
  ),

  constraint properties_status_allowed check (
    status in (
      'active',
      'inactive',
      'archived'
    )
  ),

  constraint properties_name_not_blank check (
    name is null
    or length(trim(name)) > 0
  )
);

comment on table public.properties is
  'Real estate unit located at an Address (ADR-007). '
  'Property is NOT a security boundary; isolation path is '
  'Property → Address → Territory → Tenant. '
  'Property does not own people. Future relationships with Person will be '
  'modeled separately through roles: owner, resident, tenant, authorized_person. '
  'RLS is intentionally deferred; future policies must resolve through Address → Territory → Tenant.';

comment on column public.properties.address_id is
  'Owning Address (mandatory). Isolation inherits via addresses → territories.tenant_id.';

comment on column public.properties.property_type is
  'Unit classification only (residential, commercial, garage, storage, land, other). '
  'Never a permission or isolation key.';

comment on column public.properties.name is
  'Optional display label (e.g. Casa principal, Garaje 15, Apartamento 2B).';

comment on column public.properties.metadata is
  'Extensible non-relational attributes for unit details.';

comment on column public.properties.status is
  'Lifecycle status: active, inactive, or archived.';

create index properties_address_id_idx
  on public.properties (address_id);

create index properties_property_type_idx
  on public.properties (property_type);

create index properties_status_idx
  on public.properties (status);
