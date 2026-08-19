-- Life Community OS — Phase 5: Business Profile commercial domain
--
-- Business = commercial identity (who).
-- Location = physical presence / map SoT (where).
-- Coordinates stay on locations. Never duplicate them here.
-- Does not modify Life Map, Community Core, Auth bind RPCs, or tenant factory.

-- ---------------------------------------------------------------------------
-- Business profiles
-- ---------------------------------------------------------------------------

create table if not exists public.business_profiles (
  id text primary key,
  tenant_id uuid not null references public.tenants (id) on delete restrict,
  owner_person_id text not null,
  location_id text not null references public.locations (id) on delete restrict,
  name text not null,
  category text not null,
  description text not null default '',
  contact text,
  hours text,
  image_url text,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint business_profiles_status_allowed check (
    status in ('draft', 'pending_review', 'published', 'suspended', 'archived')
  )
);

create unique index if not exists business_profiles_location_uidx
  on public.business_profiles (location_id);

create index if not exists business_profiles_tenant_idx
  on public.business_profiles (tenant_id, updated_at desc);

create index if not exists business_profiles_tenant_status_idx
  on public.business_profiles (tenant_id, status);

create index if not exists business_profiles_owner_idx
  on public.business_profiles (tenant_id, owner_person_id);

comment on table public.business_profiles is
  'Commercial identity of a member-owned business. Presence is locations via location_id.';

-- Location → Business (optional). Coordinates remain on locations.
alter table public.locations
  add column if not exists business_id text;

create index if not exists locations_business_id_idx
  on public.locations (business_id)
  where business_id is not null;

comment on column public.locations.business_id is
  'Optional Business Profile id. Location remains the map Source of Truth.';

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.business_profiles enable row level security;

create policy business_profiles_select_tenant
  on public.business_profiles for select
  using (
    public.app_user_has_tenant(tenant_id)
    and (
      status = 'published'
      or owner_person_id = public.app_user_person_id()::text
      or public.app_user_is_tenant_staff(tenant_id)
    )
  );

create policy business_profiles_insert_member
  on public.business_profiles for insert
  with check (
    public.app_user_has_tenant(tenant_id)
    and public.app_user_person_id() is not null
    and owner_person_id = public.app_user_person_id()::text
  );

create policy business_profiles_update_owner_or_staff
  on public.business_profiles for update
  using (
    public.app_user_has_tenant(tenant_id)
    and (
      public.app_user_is_tenant_staff(tenant_id)
      or owner_person_id = public.app_user_person_id()::text
    )
  )
  with check (public.app_user_has_tenant(tenant_id));

create policy business_profiles_delete_staff
  on public.business_profiles for delete
  using (public.app_user_is_tenant_staff(tenant_id));

grant select, insert, update, delete on table public.business_profiles to authenticated;
