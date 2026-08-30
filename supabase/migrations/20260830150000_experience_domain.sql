-- Life Community OS — Experience domain (Phase 17D)
-- Experience is a Territory-owned entity. Not a catalog, card, or tenant-pack seed.
-- NEVER drop tenant_id. Resource and Reservation remain the existing inventory / booking domains.

-- ---------------------------------------------------------------------------
-- experiences
-- ---------------------------------------------------------------------------

create table if not exists public.experiences (
  id text primary key,
  tenant_id uuid not null references public.tenants (id) on delete restrict,
  territory_id uuid not null references public.territories (id) on delete restrict,
  created_by text not null,
  owner_person_id text not null,
  resource_id text references public.resources (id) on delete set null,
  title text not null,
  description text not null default '',
  category text not null default 'custom',
  status text not null default 'draft',
  capacity integer not null default 8,
  schedule_starts_at timestamptz not null,
  schedule_ends_at timestamptz,
  location_label text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint experiences_status_allowed check (
    status in ('draft', 'published', 'cancelled', 'completed', 'archived')
  ),
  constraint experiences_capacity_positive check (capacity > 0),
  constraint experiences_territory_owned_by_tenant check (
    public.app_territory_owned_by_tenant(territory_id, tenant_id)
  )
);

create index if not exists experiences_tenant_idx
  on public.experiences (tenant_id, created_at desc);

create index if not exists experiences_territory_idx
  on public.experiences (territory_id, status);

create index if not exists experiences_status_idx
  on public.experiences (tenant_id, status);

create index if not exists experiences_resource_idx
  on public.experiences (resource_id)
  where resource_id is not null;

comment on table public.experiences is
  'Territory-owned organized activity. Optional resource_id links existing inventory. Not a tenant-pack catalog.';

-- ---------------------------------------------------------------------------
-- experience_participants
-- ---------------------------------------------------------------------------

create table if not exists public.experience_participants (
  id text primary key,
  tenant_id uuid not null references public.tenants (id) on delete restrict,
  experience_id text not null references public.experiences (id) on delete cascade,
  person_id text not null,
  created_by text not null,
  role text not null default 'participant',
  reservation_id text references public.reservations (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint experience_participants_role_allowed check (
    role in ('creator', 'participant', 'waitlist', 'cancelled')
  ),
  constraint experience_participants_person_uidx unique (experience_id, person_id)
);

create index if not exists experience_participants_experience_idx
  on public.experience_participants (experience_id, role);

create index if not exists experience_participants_person_idx
  on public.experience_participants (tenant_id, person_id);

comment on table public.experience_participants is
  'Participation in an Experience. Person is not duplicated. reservation_id reuses Reservation.';

-- ---------------------------------------------------------------------------
-- Media: Experience may attach cover / gallery via MediaReference
-- ---------------------------------------------------------------------------

alter table public.media_references
  drop constraint if exists media_references_entity_type_allowed;

alter table public.media_references
  add constraint media_references_entity_type_allowed check (
    entity_type in (
      'business',
      'property',
      'listing',
      'message',
      'event',
      'profile',
      'resource',
      'experience'
    )
  );

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.app_experience_belongs_to_territory(
  p_experience_id text,
  p_territory_id uuid
)
returns boolean
language sql
stable
parallel safe
as $$
  select exists (
    select 1
    from public.experiences e
    where e.id = p_experience_id
      and e.territory_id = p_territory_id
  );
$$;

comment on function public.app_experience_belongs_to_territory(text, uuid) is
  'True when the Experience is stamped with the given Territory.';

create or replace function public.app_user_can_manage_experience(p_experience_id text)
returns boolean
language sql
stable
parallel safe
as $$
  select exists (
    select 1
    from public.experiences e
    where e.id = p_experience_id
      and public.app_user_has_tenant(e.tenant_id)
      and (
        e.owner_person_id = public.app_user_person_id()::text
        or e.created_by = public.app_user_person_id()::text
        or public.app_user_is_tenant_staff(e.tenant_id)
        or public.app_jwt_membership_role(e.tenant_id) = 'group_manager'
      )
  );
$$;

comment on function public.app_user_can_manage_experience(text) is
  'Owner, group_manager, or tenant staff may manage the Experience.';

revoke all on function public.app_experience_belongs_to_territory(text, uuid) from public;
revoke all on function public.app_user_can_manage_experience(text) from public;
grant execute on function public.app_experience_belongs_to_territory(text, uuid) to anon, authenticated;
grant execute on function public.app_user_can_manage_experience(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.experiences enable row level security;
alter table public.experiences force row level security;
alter table public.experience_participants enable row level security;
alter table public.experience_participants force row level security;

create policy experiences_select_tenant
  on public.experiences for select
  using (
    public.app_user_has_tenant(tenant_id)
    and public.app_row_matches_territory(territory_id)
    and (
      status in ('published', 'cancelled', 'completed')
      or owner_person_id = public.app_user_person_id()::text
      or created_by = public.app_user_person_id()::text
      or public.app_user_is_tenant_staff(tenant_id)
      or public.app_jwt_membership_role(tenant_id) = 'group_manager'
    )
  );

create policy experiences_insert_member
  on public.experiences for insert
  with check (
    public.app_user_has_tenant(tenant_id)
    and public.app_user_person_id() is not null
    and owner_person_id = public.app_user_person_id()::text
    and created_by = public.app_user_person_id()::text
    and public.app_territory_owned_by_tenant(territory_id, tenant_id)
    and public.app_row_matches_territory(territory_id)
  );

create policy experiences_update_owner_or_staff
  on public.experiences for update
  using (public.app_user_can_manage_experience(id))
  with check (
    public.app_user_has_tenant(tenant_id)
    and public.app_territory_owned_by_tenant(territory_id, tenant_id)
  );

create policy experiences_delete_staff
  on public.experiences for delete
  using (public.app_user_is_tenant_staff(tenant_id));

create policy experience_participants_select_tenant
  on public.experience_participants for select
  using (
    public.app_user_has_tenant(tenant_id)
    and exists (
      select 1
      from public.experiences e
      where e.id = experience_participants.experience_id
        and public.app_row_matches_territory(e.territory_id)
    )
  );

create policy experience_participants_insert_member
  on public.experience_participants for insert
  with check (
    public.app_user_has_tenant(tenant_id)
    and public.app_user_person_id() is not null
    and created_by = public.app_user_person_id()::text
    and (
      person_id = public.app_user_person_id()::text
      or public.app_user_can_manage_experience(experience_id)
    )
  );

create policy experience_participants_update_self_or_manage
  on public.experience_participants for update
  using (
    public.app_user_has_tenant(tenant_id)
    and (
      person_id = public.app_user_person_id()::text
      or public.app_user_can_manage_experience(experience_id)
    )
  )
  with check (public.app_user_has_tenant(tenant_id));

create policy experience_participants_delete_staff
  on public.experience_participants for delete
  using (public.app_user_is_tenant_staff(tenant_id));

grant select, insert, update, delete on table public.experiences to authenticated;
grant select, insert, update, delete on table public.experience_participants to authenticated;

-- ---------------------------------------------------------------------------
-- Backfill: real member-created activity resources only.
-- Pack catalog seeds (system-seed) are never copied as production Experiences.
-- ---------------------------------------------------------------------------

insert into public.experiences (
  id,
  tenant_id,
  territory_id,
  created_by,
  owner_person_id,
  resource_id,
  title,
  description,
  category,
  status,
  capacity,
  schedule_starts_at,
  schedule_ends_at,
  location_label,
  metadata,
  created_at,
  updated_at
)
select
  'ex-res-' || r.id,
  r.tenant_id,
  r.territory_id,
  r.created_by,
  r.created_by,
  r.id,
  r.name,
  r.description,
  case
    when r.category = 'activity' then 'social'
    else 'custom'
  end,
  case
    when r.status in ('archived', 'retired') then 'archived'
    when r.status in ('inactive', 'maintenance') then 'cancelled'
    when r.status = 'draft' then 'draft'
    else 'published'
  end,
  greatest(coalesce(r.capacity, 8), 1),
  coalesce(r.schedule_starts_at, r.created_at, now()),
  r.schedule_ends_at,
  coalesce(r.location_label, ''),
  jsonb_build_object('source', 'activity_resource_backfill'),
  r.created_at,
  r.updated_at
from public.resources r
where r.category = 'activity'
  and r.territory_id is not null
  and r.created_by is not null
  and r.created_by not in ('system-seed', 'system')
  and r.created_by not like 'system%'
  and public.app_territory_owned_by_tenant(r.territory_id, r.tenant_id)
  and not exists (
    select 1 from public.experiences e where e.resource_id = r.id
  )
on conflict (id) do nothing;

insert into public.experience_participants (
  id,
  tenant_id,
  experience_id,
  person_id,
  created_by,
  role,
  created_at,
  updated_at
)
select
  'exp-creator-' || e.id,
  e.tenant_id,
  e.id,
  e.owner_person_id,
  e.created_by,
  'creator',
  e.created_at,
  e.updated_at
from public.experiences e
where not exists (
  select 1
  from public.experience_participants p
  where p.experience_id = e.id
    and p.person_id = e.owner_person_id
)
on conflict (experience_id, person_id) do nothing;
