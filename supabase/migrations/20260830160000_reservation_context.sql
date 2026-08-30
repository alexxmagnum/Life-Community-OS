-- Life Community OS — Reservation Context (Phase 17E)
-- One Reservation for Resource, Experience, Service and Event.
-- NEVER drop tenant_id. resource_id stays for physical inventory (now nullable).

-- ---------------------------------------------------------------------------
-- Additive columns
-- ---------------------------------------------------------------------------

alter table public.reservations
  alter column resource_id drop not null;

alter table public.reservations
  add column if not exists context_type text;

alter table public.reservations
  add column if not exists context_id text;

alter table public.reservations
  add column if not exists capacity integer;

alter table public.reservations
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.reservation_participants
  add column if not exists role text not null default 'participant';

-- ---------------------------------------------------------------------------
-- Backfill: legacy Resource bookings
-- ---------------------------------------------------------------------------

update public.reservations
set
  context_type = coalesce(context_type, 'resource'),
  context_id = coalesce(context_id, resource_id)
where resource_id is not null
  and (context_type is null or context_id is null);

update public.reservations
set
  context_type = 'experience',
  context_id = experience_id
where experience_id is not null
  and experience_id <> coalesce(resource_id, '')
  and (context_type is null or context_type = 'resource');

update public.reservation_participants
set role = 'creator'
where role = 'participant'
  and exists (
    select 1
    from public.reservations r
    where r.id = reservation_participants.reservation_id
      and r.created_by = reservation_participants.person_id
  );

alter table public.reservations
  alter column context_type set not null;

alter table public.reservations
  alter column context_id set not null;

alter table public.reservations
  drop constraint if exists reservations_context_type_allowed;

alter table public.reservations
  add constraint reservations_context_type_allowed check (
    context_type in ('resource', 'experience', 'service', 'event')
  );

alter table public.reservations
  drop constraint if exists reservations_context_inventory_consistent;

alter table public.reservations
  add constraint reservations_context_inventory_consistent check (
    (
      context_type in ('resource', 'service')
      and resource_id is not null
    )
    or context_type in ('experience', 'event')
  );

alter table public.reservation_participants
  drop constraint if exists reservation_participants_role_allowed;

alter table public.reservation_participants
  add constraint reservation_participants_role_allowed check (
    role in ('creator', 'participant', 'guest', 'waitlist')
  );

create index if not exists reservations_context_idx
  on public.reservations (tenant_id, context_type, context_id);

create index if not exists reservations_territory_idx
  on public.reservations (territory_id, status)
  where territory_id is not null;

comment on column public.reservations.context_type is
  'Universal booking target kind. resource_id remains for physical inventory.';

comment on column public.reservations.context_id is
  'Id of the Resource, Experience, Service or Event being reserved.';

-- ---------------------------------------------------------------------------
-- RLS: Territory GUC on top of tenant isolation
-- ---------------------------------------------------------------------------

drop policy if exists reservations_select_own_or_staff on public.reservations;
create policy reservations_select_own_or_staff
  on public.reservations for select
  using (
    public.app_user_has_tenant(tenant_id)
    and public.app_row_matches_territory(territory_id)
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

drop policy if exists reservations_insert_member on public.reservations;
create policy reservations_insert_member
  on public.reservations for insert
  with check (
    public.app_user_has_tenant(tenant_id)
    and public.app_user_person_id() is not null
    and created_by = public.app_user_person_id()::text
    and public.app_territory_owned_by_tenant(territory_id, tenant_id)
    and public.app_row_matches_territory(territory_id)
  );

drop policy if exists reservations_update_own_or_staff on public.reservations;
create policy reservations_update_own_or_staff
  on public.reservations for update
  using (
    public.app_user_has_tenant(tenant_id)
    and (
      created_by = public.app_user_person_id()::text
      or public.app_user_is_tenant_staff(tenant_id)
    )
  )
  with check (
    public.app_user_has_tenant(tenant_id)
    and public.app_territory_owned_by_tenant(territory_id, tenant_id)
  );
