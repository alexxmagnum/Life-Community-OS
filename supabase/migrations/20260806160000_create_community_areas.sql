-- Life Community OS — Community Areas foundation
-- ADR: docs/006_ARCHITECTURE_DECISIONS/ADR-004-COMMUNITY-GEOGRAPHIC-MODEL.md
-- ADR: docs/006_ARCHITECTURE_DECISIONS/ADR-005-COMMUNITY-AREA-MODEL.md
-- ADR: docs/006_ARCHITECTURE_DECISIONS/ADR-002-TENANT-ISOLATION-MODEL.md
-- ADR: docs/006_ARCHITECTURE_DECISIONS/ADR-003-DATABASE-SECURITY-RLS-MODEL.md
--
-- Creates public.community_areas as an optional organizational geographic layer
-- inside a Territory.
--
-- Security (ADR-002 / ADR-003 / ADR-004 / ADR-005):
--   - Community Area is NOT a Tenant, NOT a security boundary, NOT AuthZ.
--   - Isolation inherits through territory_id → territories.tenant_id.
--   - No tenant_id column on this table.
--   - No RLS in this migration (follow-up; policies must use Territory path).
--
-- Does not seed Life Panoramica areas.
-- Does not create addresses, properties, persons, or memberships.

-- ---------------------------------------------------------------------------
-- community_areas
-- Geographic subdivision inside a Territory (organizational only)
-- ---------------------------------------------------------------------------

create table public.community_areas (
  id uuid primary key default gen_random_uuid(),
  territory_id uuid not null,
  parent_area_id uuid,
  name text not null,
  slug text not null,
  type text not null,
  description text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint community_areas_territory_id_fkey
    foreign key (territory_id) references public.territories (id)
    on delete restrict,

  constraint community_areas_parent_area_id_fkey
    foreign key (parent_area_id) references public.community_areas (id)
    on delete restrict,

  constraint community_areas_territory_slug_unique
    unique (territory_id, slug),

  constraint community_areas_slug_format check (
    slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
  ),

  constraint community_areas_name_not_empty check (
    length(trim(name)) > 0
  ),

  constraint community_areas_type_allowed check (
    type in (
      'urbanization',
      'neighborhood',
      'zone',
      'sector',
      'development',
      'custom'
    )
  ),

  constraint community_areas_status_allowed check (
    status in (
      'active',
      'inactive',
      'archived'
    )
  ),

  constraint community_areas_parent_not_self check (
    parent_area_id is null
    or parent_area_id <> id
  )
);

comment on table public.community_areas is
  'Organizational geographic subdivision inside a Territory (ADR-004 / ADR-005). '
  'NOT a Tenant, NOT a security boundary, NOT an authorization boundary. '
  'Tenant/Territory remain the isolation boundary; Area inherits security via territory_id. '
  'Membership remains Territory-scoped, never Area-scoped. '
  'RLS is intentionally deferred; future policies must resolve through Territory → Tenant.';

comment on column public.community_areas.territory_id is
  'Owning Territory. Mandatory isolation path: community_areas → territories.tenant_id.';

comment on column public.community_areas.parent_area_id is
  'Optional parent Community Area for nesting within the same Territory (ADR-005). '
  'Same-territory parent enforcement is application/trigger responsibility until added.';

comment on column public.community_areas.name is
  'Display name of the Community Area (e.g. Aldea Golf).';

comment on column public.community_areas.slug is
  'Stable slug unique within a Territory (e.g. aldea-golf).';

comment on column public.community_areas.type is
  'Organizational category only (urbanization, neighborhood, zone, sector, development, custom). '
  'Never a permission or isolation key.';

comment on column public.community_areas.description is
  'Optional description for operators and local context.';

comment on column public.community_areas.status is
  'Lifecycle status: active, inactive, or archived.';

create index community_areas_territory_id_idx
  on public.community_areas (territory_id);

create index community_areas_parent_area_id_idx
  on public.community_areas (parent_area_id);

create index community_areas_status_idx
  on public.community_areas (status);
