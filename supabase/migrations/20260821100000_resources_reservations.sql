-- Life Community OS — Phase 8: Resources + Reservations
--
-- One bookable Resource inventory and one Reservation table for every
-- facility / sport / hospitality / activity / service.
-- Does not modify Life Map, Community Core tables, Auth bind RPCs,
-- tenant factory, business_profiles, or properties.

-- ---------------------------------------------------------------------------
-- resources
-- ---------------------------------------------------------------------------

create table if not exists public.resources (
  id text primary key,
  tenant_id uuid not null references public.tenants (id) on delete restrict,
  created_by text not null,
  location_id text,
  name text not null,
  category text not null,
  description text not null default '',
  images jsonb not null default '[]'::jsonb,
  status text not null default 'active',
  booking_rules jsonb not null default '[]'::jsonb,
  resource_type text not null default 'custom',
  owner_kind text not null default 'territory_authority',
  owner_id text not null,
  bookable boolean not null default true,
  slot_minutes integer not null default 60,
  capacity integer not null default 1,
  requires_approval boolean not null default false,
  location_label text not null default '',
  area_label text,
  linked_resource_id text,
  schedule_starts_at timestamptz,
  schedule_ends_at timestamptz,
  community_event_id text,
  organizer_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint resources_category_allowed check (
    category in ('sport', 'facility', 'hospitality', 'activity', 'service')
  ),
  constraint resources_status_allowed check (
    status in ('draft', 'active', 'inactive', 'archived', 'maintenance', 'retired')
  )
);

create index if not exists resources_tenant_idx
  on public.resources (tenant_id, created_at desc);

create index if not exists resources_category_idx
  on public.resources (tenant_id, category, status);

comment on table public.resources is
  'Tenant-owned bookable inventory. One table for courts, rooms, pool, golf, activities.';

-- ---------------------------------------------------------------------------
-- resource_availability
-- ---------------------------------------------------------------------------

create table if not exists public.resource_availability (
  id text primary key,
  tenant_id uuid not null references public.tenants (id) on delete restrict,
  created_by text not null,
  resource_id text not null references public.resources (id) on delete cascade,
  slot_date date not null,
  start_time text not null,
  end_time text not null,
  capacity integer not null default 1,
  status text not null default 'available',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint resource_availability_status_allowed check (
    status in ('available', 'blocked')
  )
);

create index if not exists resource_availability_resource_idx
  on public.resource_availability (tenant_id, resource_id, slot_date);

comment on table public.resource_availability is
  'Bookable slots, hours, capacity and blocks for a Resource.';

-- ---------------------------------------------------------------------------
-- reservations
-- ---------------------------------------------------------------------------

create table if not exists public.reservations (
  id text primary key,
  tenant_id uuid not null references public.tenants (id) on delete restrict,
  created_by text not null,
  resource_id text not null references public.resources (id) on delete restrict,
  participant_count integer not null default 1,
  start_time timestamptz not null,
  end_time timestamptz not null,
  status text not null default 'confirmed',
  experience_id text,
  slot_date date not null,
  start_hhmm text not null,
  end_hhmm text not null,
  resource_name text,
  resource_image_url text,
  location_label text,
  area_label text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reservations_status_allowed check (
    status in (
      'pending',
      'confirmed',
      'cancelled',
      'completed',
      'rejected',
      'reserved',
      'expired'
    )
  )
);

create index if not exists reservations_tenant_idx
  on public.reservations (tenant_id, created_at desc);

create index if not exists reservations_resource_idx
  on public.reservations (tenant_id, resource_id, slot_date);

create index if not exists reservations_actor_idx
  on public.reservations (tenant_id, created_by);

comment on table public.reservations is
  'Single reservation record for any Resource. No per-module reservation tables.';

-- ---------------------------------------------------------------------------
-- reservation_participants
-- ---------------------------------------------------------------------------

create table if not exists public.reservation_participants (
  id text primary key,
  tenant_id uuid not null references public.tenants (id) on delete restrict,
  created_by text not null,
  reservation_id text not null references public.reservations (id) on delete cascade,
  person_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists reservation_participants_reservation_idx
  on public.reservation_participants (tenant_id, reservation_id);

create unique index if not exists reservation_participants_unique
  on public.reservation_participants (reservation_id, person_id);

comment on table public.reservation_participants is
  'People occupying a Reservation. Owner is always a participant.';

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.resources enable row level security;
alter table public.resource_availability enable row level security;
alter table public.reservations enable row level security;
alter table public.reservation_participants enable row level security;

create policy resources_select_tenant
  on public.resources for select
  using (
    public.app_user_has_tenant(tenant_id)
    and (
      status = 'active'
      or created_by = public.app_user_person_id()::text
      or public.app_user_is_tenant_staff(tenant_id)
    )
  );

create policy resources_insert_member
  on public.resources for insert
  with check (
    public.app_user_has_tenant(tenant_id)
    and public.app_user_person_id() is not null
    and created_by = public.app_user_person_id()::text
  );

create policy resources_update_owner_or_staff
  on public.resources for update
  using (
    public.app_user_has_tenant(tenant_id)
    and (
      public.app_user_is_tenant_staff(tenant_id)
      or created_by = public.app_user_person_id()::text
    )
  )
  with check (public.app_user_has_tenant(tenant_id));

create policy resources_delete_staff
  on public.resources for delete
  using (public.app_user_is_tenant_staff(tenant_id));

create policy resource_availability_select_tenant
  on public.resource_availability for select
  using (public.app_user_has_tenant(tenant_id));

create policy resource_availability_insert_member
  on public.resource_availability for insert
  with check (
    public.app_user_has_tenant(tenant_id)
    and public.app_user_person_id() is not null
    and created_by = public.app_user_person_id()::text
  );

create policy resource_availability_update_staff
  on public.resource_availability for update
  using (
    public.app_user_has_tenant(tenant_id)
    and (
      public.app_user_is_tenant_staff(tenant_id)
      or created_by = public.app_user_person_id()::text
    )
  )
  with check (public.app_user_has_tenant(tenant_id));

create policy reservations_select_own_or_staff
  on public.reservations for select
  using (
    public.app_user_has_tenant(tenant_id)
    and (
      created_by = public.app_user_person_id()::text
      or public.app_user_is_tenant_staff(tenant_id)
      or exists (
        select 1
        from public.reservation_participants p
        where p.reservation_id = reservations.id
          and p.person_id = public.app_user_person_id()::text
      )
    )
  );

create policy reservations_insert_member
  on public.reservations for insert
  with check (
    public.app_user_has_tenant(tenant_id)
    and public.app_user_person_id() is not null
    and created_by = public.app_user_person_id()::text
  );

create policy reservations_update_own_or_staff
  on public.reservations for update
  using (
    public.app_user_has_tenant(tenant_id)
    and (
      created_by = public.app_user_person_id()::text
      or public.app_user_is_tenant_staff(tenant_id)
    )
  )
  with check (public.app_user_has_tenant(tenant_id));

create policy reservation_participants_select_tenant
  on public.reservation_participants for select
  using (
    public.app_user_has_tenant(tenant_id)
    and (
      person_id = public.app_user_person_id()::text
      or created_by = public.app_user_person_id()::text
      or public.app_user_is_tenant_staff(tenant_id)
    )
  );

create policy reservation_participants_insert_member
  on public.reservation_participants for insert
  with check (
    public.app_user_has_tenant(tenant_id)
    and public.app_user_person_id() is not null
    and created_by = public.app_user_person_id()::text
  );

grant select, insert, update, delete on table public.resources to authenticated;
grant select, insert, update, delete on table public.resource_availability to authenticated;
grant select, insert, update, delete on table public.reservations to authenticated;
grant select, insert, update, delete on table public.reservation_participants to authenticated;
