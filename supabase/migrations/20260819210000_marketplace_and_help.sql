-- Life Community OS — Phase 6: Marketplace + Community Help
--
-- Goods exchange and neighbour/work help as tenant-owned records.
-- Does not modify Life Map, Community Core tables, Auth bind RPCs,
-- tenant factory, or business_profiles.

-- ---------------------------------------------------------------------------
-- Marketplace listings
-- ---------------------------------------------------------------------------

create table if not exists public.marketplace_listings (
  id text primary key,
  tenant_id uuid not null references public.tenants (id) on delete restrict,
  owner_person_id text not null,
  created_by text not null,
  type text not null,
  category text not null default 'general',
  title text not null,
  description text not null,
  images jsonb not null default '[]'::jsonb,
  price numeric,
  status text not null default 'published',
  location_id text,
  author_display_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint marketplace_listings_type_allowed check (
    type in ('sale', 'rent', 'giveaway', 'exchange')
  ),
  constraint marketplace_listings_status_allowed check (
    status in ('draft', 'published', 'reserved', 'completed', 'archived')
  )
);

create index if not exists marketplace_listings_tenant_idx
  on public.marketplace_listings (tenant_id, created_at desc);

create index if not exists marketplace_listings_owner_idx
  on public.marketplace_listings (tenant_id, owner_person_id);

comment on table public.marketplace_listings is
  'Neighbour goods exchange. Ownership is tenant_id + owner_person_id.';

-- ---------------------------------------------------------------------------
-- Community help requests (help + work board)
-- ---------------------------------------------------------------------------

create table if not exists public.community_help_requests (
  id text primary key,
  tenant_id uuid not null references public.tenants (id) on delete restrict,
  created_by text not null,
  type text not null,
  category text not null default 'general',
  title text not null,
  description text not null,
  status text not null default 'open',
  author_display_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint community_help_requests_type_allowed check (
    type in ('offer_help', 'need_help')
  ),
  constraint community_help_requests_status_allowed check (
    status in ('open', 'accepted', 'completed', 'closed')
  )
);

create index if not exists community_help_requests_tenant_idx
  on public.community_help_requests (tenant_id, created_at desc);

create index if not exists community_help_requests_author_idx
  on public.community_help_requests (tenant_id, created_by);

comment on table public.community_help_requests is
  'Neighbour help and work board. Ownership is tenant_id + created_by.';

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.marketplace_listings enable row level security;
alter table public.community_help_requests enable row level security;

create policy marketplace_listings_select_tenant
  on public.marketplace_listings for select
  using (
    public.app_user_has_tenant(tenant_id)
    and (
      status = 'published'
      or status = 'reserved'
      or owner_person_id = public.app_user_person_id()::text
      or public.app_user_is_tenant_staff(tenant_id)
    )
  );

create policy marketplace_listings_insert_member
  on public.marketplace_listings for insert
  with check (
    public.app_user_has_tenant(tenant_id)
    and public.app_user_person_id() is not null
    and owner_person_id = public.app_user_person_id()::text
    and created_by = public.app_user_person_id()::text
  );

create policy marketplace_listings_update_owner_or_staff
  on public.marketplace_listings for update
  using (
    public.app_user_has_tenant(tenant_id)
    and (
      public.app_user_is_tenant_staff(tenant_id)
      or owner_person_id = public.app_user_person_id()::text
    )
  )
  with check (public.app_user_has_tenant(tenant_id));

create policy marketplace_listings_delete_staff
  on public.marketplace_listings for delete
  using (public.app_user_is_tenant_staff(tenant_id));

create policy community_help_select_tenant
  on public.community_help_requests for select
  using (
    public.app_user_has_tenant(tenant_id)
    and (
      status in ('open', 'accepted')
      or created_by = public.app_user_person_id()::text
      or public.app_user_is_tenant_staff(tenant_id)
    )
  );

create policy community_help_insert_member
  on public.community_help_requests for insert
  with check (
    public.app_user_has_tenant(tenant_id)
    and public.app_user_person_id() is not null
    and created_by = public.app_user_person_id()::text
  );

create policy community_help_update_owner_or_staff
  on public.community_help_requests for update
  using (
    public.app_user_has_tenant(tenant_id)
    and (
      public.app_user_is_tenant_staff(tenant_id)
      or created_by = public.app_user_person_id()::text
    )
  )
  with check (public.app_user_has_tenant(tenant_id));

grant select, insert, update, delete on table public.marketplace_listings to authenticated;
grant select, insert, update, delete on table public.community_help_requests to authenticated;
