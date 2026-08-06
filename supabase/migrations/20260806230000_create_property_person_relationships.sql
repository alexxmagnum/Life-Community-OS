-- Life Community OS — Property Person Relationship foundation
-- ADR: docs/006_ARCHITECTURE_DECISIONS/ADR-008-PROPERTY-PERSON-RELATIONSHIP-MODEL.md
-- ADR: docs/006_ARCHITECTURE_DECISIONS/ADR-009-PROPERTY-PERSON-RELATIONSHIP-SCHEMA.md
-- ADR: docs/006_ARCHITECTURE_DECISIONS/ADR-007-PROPERTY-MODEL.md
--
-- Creates public.property_person_relationships as an independent domain entity
-- linking Property ↔ Person through typed, time-aware roles.
--
-- Property does not own Person. No owner_id / resident_id columns on properties.
-- Relationship is NOT a security boundary.
-- Isolation inherits: Relationship → Property → Address → Territory → Tenant.
--
-- Does not create: permissions, RLS, owner/resident columns, or new security boundaries.

-- ---------------------------------------------------------------------------
-- property_person_relationships
-- Roles between People and Properties (many-to-many, time-aware)
-- ---------------------------------------------------------------------------

create table public.property_person_relationships (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null,
  person_id uuid not null,
  relationship_type text not null,
  start_date date,
  end_date date,
  status text not null default 'active',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint property_person_relationships_property_id_fkey
    foreign key (property_id) references public.properties (id)
    on delete restrict,

  constraint property_person_relationships_person_id_fkey
    foreign key (person_id) references public.persons (id)
    on delete restrict,

  constraint property_person_relationships_type_allowed check (
    relationship_type in (
      'owner',
      'resident',
      'tenant',
      'authorized_person',
      'manager'
    )
  ),

  constraint property_person_relationships_status_allowed check (
    status in (
      'active',
      'inactive',
      'archived'
    )
  ),

  constraint property_person_relationships_date_order check (
    start_date is null
    or end_date is null
    or end_date >= start_date
  )
);

comment on table public.property_person_relationships is
  'Roles between People and Properties (ADR-008 / ADR-009). '
  'Independent relationship entity: Property → Property Person Relationship → Person. '
  'Property does not own Person. Relationship is NOT a security boundary. '
  'Tenant isolation is inherited through Relationship → Property → Address → Territory → Tenant. '
  'Domain type tenant means renter — never SaaS Tenant. '
  'RLS is intentionally deferred; future policies must use the Property → Address → Territory path.';

comment on column public.property_person_relationships.property_id is
  'Related Property (mandatory). Isolation inherits via properties → addresses → territories.';

comment on column public.property_person_relationships.person_id is
  'Related Person (mandatory). Person remains independent; not owned by Property.';

comment on column public.property_person_relationships.relationship_type is
  'Role classification only (owner, resident, tenant/renter, authorized_person, manager). '
  'Never a permission or isolation key.';

comment on column public.property_person_relationships.start_date is
  'Optional date when the relationship begins.';

comment on column public.property_person_relationships.end_date is
  'Optional date when the relationship ends. Must not be before start_date.';

comment on column public.property_person_relationships.status is
  'Lifecycle status: active, inactive, or archived.';

comment on column public.property_person_relationships.metadata is
  'Extensible non-relational attributes for the relationship.';

create index property_person_relationships_property_id_idx
  on public.property_person_relationships (property_id);

create index property_person_relationships_person_id_idx
  on public.property_person_relationships (person_id);

create index property_person_relationships_relationship_type_idx
  on public.property_person_relationships (relationship_type);

create index property_person_relationships_status_idx
  on public.property_person_relationships (status);
