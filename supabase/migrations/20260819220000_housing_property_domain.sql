-- Life Community OS — Phase 7: Housing residential domain
--
-- Extends ADR-007 properties + ADR-008 property_person_relationships.
-- Adds tenant_id, Location link, created_by, product copy, and tenant RLS.
-- Does not modify Life Map, Community Core, Auth bind RPCs, or business_profiles.

-- ---------------------------------------------------------------------------
-- properties — product columns
-- ---------------------------------------------------------------------------

alter table public.properties
  alter column address_id drop not null;

alter table public.properties
  add column if not exists tenant_id uuid references public.tenants (id) on delete restrict;

alter table public.properties
  add column if not exists location_id text;

alter table public.properties
  add column if not exists created_by text;

alter table public.properties
  add column if not exists title text;

alter table public.properties
  add column if not exists description text not null default '';

alter table public.properties
  add column if not exists images jsonb not null default '[]'::jsonb;

alter table public.properties
  add column if not exists availability text not null default 'private';

alter table public.properties
  add column if not exists bedrooms integer;

alter table public.properties
  add column if not exists bathrooms integer;

alter table public.properties
  add column if not exists built_area_m2 numeric;

alter table public.properties
  add column if not exists area_label text;

alter table public.properties
  add column if not exists unit_label text;

alter table public.properties
  drop constraint if exists properties_type_allowed;

alter table public.properties
  add constraint properties_type_allowed check (
    property_type in (
      'villa',
      'apartment',
      'townhouse',
      'plot',
      'other',
      'residential',
      'commercial',
      'garage',
      'storage',
      'land'
    )
  );

alter table public.properties
  drop constraint if exists properties_status_allowed;

alter table public.properties
  add constraint properties_status_allowed check (
    status in ('draft', 'active', 'inactive', 'archived')
  );

alter table public.properties
  drop constraint if exists properties_availability_allowed;

alter table public.properties
  add constraint properties_availability_allowed check (
    availability in ('private', 'rent', 'sale')
  );

create index if not exists properties_tenant_idx
  on public.properties (tenant_id, created_at desc);

create index if not exists properties_location_idx
  on public.properties (location_id);

create index if not exists properties_created_by_idx
  on public.properties (tenant_id, created_by);

comment on column public.properties.tenant_id is
  'SaaS tenant. Isolation key for product Housing (Phase 7).';

comment on column public.properties.location_id is
  'Geographic SoT. Coordinates never live on Property.';

comment on column public.properties.created_by is
  'Session person who registered the dwelling. Owner role is a membership, not this column alone.';

-- ---------------------------------------------------------------------------
-- property_person_relationships — PropertyMembership
-- ---------------------------------------------------------------------------

alter table public.property_person_relationships
  drop constraint if exists property_person_relationships_person_id_fkey;

alter table public.property_person_relationships
  alter column person_id type text using person_id::text;

alter table public.property_person_relationships
  add column if not exists tenant_id uuid references public.tenants (id) on delete restrict;

alter table public.property_person_relationships
  add column if not exists created_by text;

create index if not exists property_memberships_tenant_person_idx
  on public.property_person_relationships (tenant_id, person_id);

comment on table public.property_person_relationships is
  'PropertyMembership (ADR-008). Owner is not assumed to be resident. '
  'Tenant isolation uses tenant_id (Phase 7).';

-- ---------------------------------------------------------------------------
-- RLS — tenant_id path (Valley cannot read Panoramica)
-- ---------------------------------------------------------------------------

drop policy if exists properties_select_via_address_territory_tenant on public.properties;
drop policy if exists properties_insert_via_address_territory_tenant on public.properties;
drop policy if exists properties_update_via_address_territory_tenant on public.properties;
drop policy if exists properties_delete_via_address_territory_tenant on public.properties;

create policy properties_select_tenant
  on public.properties for select
  using (
    public.app_user_has_tenant(tenant_id)
    and (
      (status = 'active' and availability in ('rent', 'sale'))
      or created_by = public.app_user_person_id()::text
      or public.app_user_is_tenant_staff(tenant_id)
      or exists (
        select 1
        from public.property_person_relationships m
        where m.property_id = properties.id
          and m.person_id = public.app_user_person_id()::text
          and m.status = 'active'
      )
    )
  );

create policy properties_insert_member
  on public.properties for insert
  with check (
    public.app_user_has_tenant(tenant_id)
    and public.app_user_person_id() is not null
    and created_by = public.app_user_person_id()::text
  );

create policy properties_update_owner_or_staff
  on public.properties for update
  using (
    public.app_user_has_tenant(tenant_id)
    and (
      public.app_user_is_tenant_staff(tenant_id)
      or created_by = public.app_user_person_id()::text
      or exists (
        select 1
        from public.property_person_relationships m
        where m.property_id = properties.id
          and m.person_id = public.app_user_person_id()::text
          and m.relationship_type = 'owner'
          and m.status = 'active'
      )
    )
  )
  with check (public.app_user_has_tenant(tenant_id));

drop policy if exists property_person_relationships_select_via_property_tenant
  on public.property_person_relationships;
drop policy if exists property_person_relationships_insert_via_property_tenant
  on public.property_person_relationships;
drop policy if exists property_person_relationships_update_via_property_tenant
  on public.property_person_relationships;
drop policy if exists property_person_relationships_delete_via_property_tenant
  on public.property_person_relationships;

create policy property_memberships_select_household
  on public.property_person_relationships for select
  using (
    public.app_user_has_tenant(tenant_id)
    and (
      person_id = public.app_user_person_id()::text
      or public.app_user_is_tenant_staff(tenant_id)
      or exists (
        select 1
        from public.property_person_relationships self
        where self.property_id = property_person_relationships.property_id
          and self.person_id = public.app_user_person_id()::text
          and self.status = 'active'
      )
    )
  );

create policy property_memberships_insert_owner_or_staff
  on public.property_person_relationships for insert
  with check (
    public.app_user_has_tenant(tenant_id)
    and public.app_user_person_id() is not null
    and (
      created_by = public.app_user_person_id()::text
      or public.app_user_is_tenant_staff(tenant_id)
    )
  );

create policy property_memberships_update_owner_or_staff
  on public.property_person_relationships for update
  using (
    public.app_user_has_tenant(tenant_id)
    and (
      public.app_user_is_tenant_staff(tenant_id)
      or exists (
        select 1
        from public.property_person_relationships self
        where self.property_id = property_person_relationships.property_id
          and self.person_id = public.app_user_person_id()::text
          and self.relationship_type = 'owner'
          and self.status = 'active'
      )
    )
  )
  with check (public.app_user_has_tenant(tenant_id));
