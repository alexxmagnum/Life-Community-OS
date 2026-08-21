-- Life Community OS — Phase 10: Media Platform
--
-- One MediaAsset + MediaReference graph for every product file.
-- Does not modify Life Map, Auth bind RPCs, tenant factory,
-- business_profiles, properties, marketplace_listings, or reservations tables.

-- ---------------------------------------------------------------------------
-- media_assets
-- ---------------------------------------------------------------------------

create table if not exists public.media_assets (
  id text primary key,
  tenant_id uuid not null references public.tenants (id) on delete restrict,
  created_by text not null,
  owner_person_id text not null,
  storage_key text not null,
  filename text not null,
  mime_type text not null default 'application/octet-stream',
  size bigint not null default 0,
  type text not null default 'file',
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint media_assets_type_allowed check (
    type in ('image', 'video', 'document', 'file', 'avatar', 'attachment')
  ),
  constraint media_assets_status_allowed check (
    status in ('pending', 'ready', 'failed', 'deleted')
  ),
  constraint media_assets_size_non_negative check (size >= 0),
  constraint media_assets_owner_matches_created_by check (
    owner_person_id = created_by
  )
);

create unique index if not exists media_assets_storage_key_uidx
  on public.media_assets (storage_key);

create index if not exists media_assets_tenant_owner_idx
  on public.media_assets (tenant_id, owner_person_id, created_at desc);

comment on table public.media_assets is
  'Tenant-owned file record. storage_key is server-issued; never accepted from the client.';

-- ---------------------------------------------------------------------------
-- media_references
-- ---------------------------------------------------------------------------

create table if not exists public.media_references (
  id text primary key,
  tenant_id uuid not null references public.tenants (id) on delete restrict,
  created_by text not null,
  media_id text not null references public.media_assets (id) on delete cascade,
  entity_type text not null,
  entity_id text not null,
  purpose text not null default 'gallery',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint media_references_entity_type_allowed check (
    entity_type in (
      'business',
      'property',
      'listing',
      'message',
      'event',
      'profile',
      'resource'
    )
  ),
  constraint media_references_purpose_allowed check (
    purpose in ('cover', 'gallery', 'avatar', 'attachment')
  )
);

create unique index if not exists media_references_link_uidx
  on public.media_references (media_id, entity_type, entity_id, purpose);

create index if not exists media_references_entity_idx
  on public.media_references (tenant_id, entity_type, entity_id);

comment on table public.media_references is
  'Generic link from a domain entity to a MediaAsset. Replaces per-module image tables.';

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

create or replace function public.media_asset_has_public_reference(asset_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.media_references r
    where r.media_id = asset_id
      and r.purpose in ('cover', 'gallery', 'avatar')
  );
$$;

create or replace function public.media_reference_owned_by_person(
  media_id text,
  person_id text
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.media_assets a
    where a.id = media_id
      and a.owner_person_id = person_id
  );
$$;

alter table public.media_assets enable row level security;
alter table public.media_references enable row level security;

-- Tenant member may read own files, staff may read tenant files,
-- and public-purpose references expose ready assets to the same tenant.
create policy media_assets_select_tenant
  on public.media_assets for select
  using (
    public.app_user_has_tenant(tenant_id)
    and status <> 'deleted'
    and (
      owner_person_id = public.app_user_person_id()::text
      or public.app_user_is_tenant_staff(tenant_id)
      or (
        status = 'ready'
        and public.media_asset_has_public_reference(id)
      )
    )
  );

create policy media_assets_insert_owner
  on public.media_assets for insert
  with check (
    public.app_user_has_tenant(tenant_id)
    and public.app_user_person_id() is not null
    and created_by = public.app_user_person_id()::text
    and owner_person_id = public.app_user_person_id()::text
  );

create policy media_assets_update_owner_or_staff
  on public.media_assets for update
  using (
    public.app_user_has_tenant(tenant_id)
    and (
      owner_person_id = public.app_user_person_id()::text
      or public.app_user_is_tenant_staff(tenant_id)
    )
  )
  with check (
    public.app_user_has_tenant(tenant_id)
    and owner_person_id = created_by
  );

create policy media_references_select_tenant
  on public.media_references for select
  using (
    public.app_user_has_tenant(tenant_id)
    and (
      created_by = public.app_user_person_id()::text
      or public.app_user_is_tenant_staff(tenant_id)
      or purpose in ('cover', 'gallery', 'avatar')
      or public.media_reference_owned_by_person(
        media_id,
        public.app_user_person_id()::text
      )
    )
  );

create policy media_references_insert_member
  on public.media_references for insert
  with check (
    public.app_user_has_tenant(tenant_id)
    and public.app_user_person_id() is not null
    and created_by = public.app_user_person_id()::text
    and exists (
      select 1
      from public.media_assets a
      where a.id = media_id
        and a.tenant_id = media_references.tenant_id
        and a.status <> 'deleted'
        and (
          a.owner_person_id = public.app_user_person_id()::text
          or public.app_user_is_tenant_staff(tenant_id)
        )
    )
  );

create policy media_references_delete_owner_or_staff
  on public.media_references for delete
  using (
    public.app_user_has_tenant(tenant_id)
    and (
      created_by = public.app_user_person_id()::text
      or public.app_user_is_tenant_staff(tenant_id)
      or exists (
        select 1
        from public.media_assets a
        where a.id = media_references.media_id
          and a.owner_person_id = public.app_user_person_id()::text
      )
    )
  );

grant select, insert, update, delete on table public.media_assets to authenticated;
grant select, insert, update, delete on table public.media_references to authenticated;
