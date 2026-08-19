-- Life Community OS — Phase 2: data ownership + real RLS bind
--
-- Goals:
--   1. Membership carries tenant_id (SaaS ownership) while keeping territory_id (ADR-011).
--   2. Location carries owner_id / created_by. FORCE RLS. Visibility-aware SELECT.
--   3. tenant_documents holds P1/P2 operational JSON (conversations, reservations, housing, catalogs).
--   4. Trusted bind RPCs that VALIDATE membership — never grant open tenant spoofing.
--
-- Does not modify Life Map visuals, Territory Objects, or tenant packs.

-- ---------------------------------------------------------------------------
-- Session person / role helpers
-- ---------------------------------------------------------------------------

create or replace function public.app_current_person_id()
returns uuid
language sql
stable
parallel safe
as $$
  select nullif(current_setting('app.person_id', true), '')::uuid;
$$;

create or replace function public.app_current_membership_role()
returns text
language sql
stable
parallel safe
as $$
  select nullif(current_setting('app.membership_role', true), '');
$$;

create or replace function public.app_is_tenant_staff()
returns boolean
language sql
stable
parallel safe
as $$
  select public.app_current_membership_role() in ('moderator', 'administrator');
$$;

-- JWT helpers: PostgREST issues one transaction per HTTP call, so GUC bind
-- cannot carry from rpc() to from(). Policies must also key off auth.uid().

create or replace function public.app_jwt_person_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select i.person_id
  from public.identities i
  where auth.uid() is not null
    and i.provider_reference = auth.uid()::text
  limit 1;
$$;

create or replace function public.app_jwt_membership_role(p_tenant_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select m.membership_type
  from public.identities i
  inner join public.memberships m
    on m.person_id = i.person_id
   and m.status = 'active'
  where auth.uid() is not null
    and i.provider_reference = auth.uid()::text
    and m.tenant_id = p_tenant_id
  limit 1;
$$;

create or replace function public.app_user_has_tenant(p_tenant_id uuid)
returns boolean
language sql
stable
parallel safe
as $$
  select
    (
      public.app_has_tenant_context()
      and public.app_current_tenant_id() = p_tenant_id
    )
    or public.app_jwt_membership_role(p_tenant_id) is not null;
$$;

create or replace function public.app_user_is_tenant_staff(p_tenant_id uuid)
returns boolean
language sql
stable
parallel safe
as $$
  select
    (
      public.app_has_tenant_context()
      and public.app_current_tenant_id() = p_tenant_id
      and public.app_is_tenant_staff()
    )
    or public.app_jwt_membership_role(p_tenant_id) in (
      'moderator',
      'administrator'
    );
$$;

create or replace function public.app_user_person_id()
returns uuid
language sql
stable
parallel safe
as $$
  select coalesce(
    public.app_current_person_id(),
    public.app_jwt_person_id()
  );
$$;

comment on function public.app_current_person_id() is
  'Bound Person from GUC app.person_id. Null when unbound (anonymous public tenant bind).';

comment on function public.app_current_membership_role() is
  'Bound membership_type for the current person in the bound tenant.';

comment on function public.app_is_tenant_staff() is
  'True when bound role is moderator or administrator.';

revoke all on function public.app_current_person_id() from public;
revoke all on function public.app_current_membership_role() from public;
revoke all on function public.app_is_tenant_staff() from public;
revoke all on function public.app_jwt_person_id() from public;
revoke all on function public.app_jwt_membership_role(uuid) from public;
revoke all on function public.app_user_has_tenant(uuid) from public;
revoke all on function public.app_user_is_tenant_staff(uuid) from public;
revoke all on function public.app_user_person_id() from public;

grant execute on function public.app_current_person_id() to anon, authenticated;
grant execute on function public.app_current_membership_role() to anon, authenticated;
grant execute on function public.app_is_tenant_staff() to anon, authenticated;
grant execute on function public.app_jwt_person_id() to anon, authenticated;
grant execute on function public.app_jwt_membership_role(uuid) to anon, authenticated;
grant execute on function public.app_user_has_tenant(uuid) to anon, authenticated;
grant execute on function public.app_user_is_tenant_staff(uuid) to anon, authenticated;
grant execute on function public.app_user_person_id() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- memberships.tenant_id (denormalized ownership, kept in sync with territory)
-- ---------------------------------------------------------------------------

alter table public.memberships
  add column if not exists tenant_id uuid references public.tenants (id) on delete restrict;

update public.memberships m
set tenant_id = t.tenant_id
from public.territories t
where t.id = m.territory_id
  and m.tenant_id is null;

alter table public.memberships
  alter column tenant_id set not null;

create index if not exists memberships_tenant_id_idx
  on public.memberships (tenant_id);

create unique index if not exists memberships_person_tenant_active_uidx
  on public.memberships (person_id, tenant_id)
  where status = 'active';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'memberships_role_allowed'
      and conrelid = 'public.memberships'::regclass
  ) then
    alter table public.memberships
      add constraint memberships_role_allowed check (
        membership_type in (
          'member',
          'group_manager',
          'moderator',
          'administrator'
        )
      );
  end if;
end $$;

create or replace function public.memberships_assign_tenant_id()
returns trigger
language plpgsql
as $$
begin
  select t.tenant_id
    into new.tenant_id
  from public.territories t
  where t.id = new.territory_id;

  if new.tenant_id is null then
    raise exception 'membership territory has no tenant'
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists memberships_assign_tenant_id on public.memberships;

create trigger memberships_assign_tenant_id
  before insert or update of territory_id
  on public.memberships
  for each row
  execute procedure public.memberships_assign_tenant_id();

comment on column public.memberships.tenant_id is
  'Owning Tenant. Denormalized from territories.tenant_id. Required SaaS ownership. '
  'membership_type is the capability role (member | group_manager | moderator | administrator).';

-- Membership SELECT/DML also match tenant_id directly (defense in depth).
drop policy if exists memberships_select_via_territory_tenant on public.memberships;
drop policy if exists memberships_insert_via_territory_tenant on public.memberships;
drop policy if exists memberships_update_via_territory_tenant on public.memberships;
drop policy if exists memberships_delete_via_territory_tenant on public.memberships;

create policy memberships_select_via_tenant
  on public.memberships
  for select
  using (public.app_user_has_tenant(tenant_id));

create policy memberships_insert_via_tenant
  on public.memberships
  for insert
  with check (public.app_user_is_tenant_staff(tenant_id));

create policy memberships_update_via_tenant
  on public.memberships
  for update
  using (public.app_user_is_tenant_staff(tenant_id))
  with check (public.app_user_is_tenant_staff(tenant_id));

create policy memberships_delete_via_tenant
  on public.memberships
  for delete
  using (public.app_user_is_tenant_staff(tenant_id));

-- ---------------------------------------------------------------------------
-- Location ownership
-- ---------------------------------------------------------------------------

alter table public.locations
  add column if not exists owner_id uuid references public.persons (id) on delete set null;

alter table public.locations
  add column if not exists created_by uuid references public.persons (id) on delete set null;

create index if not exists locations_owner_id_idx on public.locations (owner_id);
create index if not exists locations_created_by_idx on public.locations (created_by);

comment on column public.locations.owner_id is
  'Person who owns this Location when it is member-created. Null for catalog / tenant fixtures.';
comment on column public.locations.created_by is
  'Person who first persisted this Location.';

alter table public.locations enable row level security;
alter table public.locations force row level security;

drop policy if exists locations_tenant_select on public.locations;
drop policy if exists locations_tenant_insert on public.locations;
drop policy if exists locations_tenant_update on public.locations;
drop policy if exists locations_tenant_delete on public.locations;

create policy locations_select_visible
  on public.locations
  for select
  using (
    public.app_user_has_tenant(tenant_id)
    and (
      visibility = 'public'
      or owner_id = public.app_user_person_id()
      or created_by = public.app_user_person_id()
      or (
        visibility = 'members'
        and public.app_user_person_id() is not null
      )
      or (
        visibility = 'private'
        and public.app_user_is_tenant_staff(tenant_id)
      )
    )
  );

create policy locations_insert_member
  on public.locations
  for insert
  with check (
    public.app_user_has_tenant(tenant_id)
    and public.app_user_person_id() is not null
    and (created_by is null or created_by = public.app_user_person_id())
    and (
      owner_id is null
      or owner_id = public.app_user_person_id()
      or public.app_user_is_tenant_staff(tenant_id)
    )
  );

create policy locations_update_owner_or_staff
  on public.locations
  for update
  using (
    public.app_user_has_tenant(tenant_id)
    and (
      public.app_user_is_tenant_staff(tenant_id)
      or owner_id = public.app_user_person_id()
      or created_by = public.app_user_person_id()
    )
  )
  with check (public.app_user_has_tenant(tenant_id));

create policy locations_delete_owner_or_staff
  on public.locations
  for delete
  using (
    public.app_user_has_tenant(tenant_id)
    and (
      public.app_user_is_tenant_staff(tenant_id)
      or owner_id = public.app_user_person_id()
    )
  );

-- ---------------------------------------------------------------------------
-- tenant_documents — operational JSON per tenant (P1/P2)
-- ---------------------------------------------------------------------------

create table if not exists public.tenant_documents (
  tenant_id uuid not null references public.tenants (id) on delete restrict,
  doc_key text not null,
  payload jsonb not null default '{}'::jsonb,
  updated_by uuid references public.persons (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (tenant_id, doc_key),
  constraint tenant_documents_key_format check (
    doc_key ~ '^(durable|catalog|housing):[a-z0-9._-]+$'
  )
);

comment on table public.tenant_documents is
  'Tenant-owned operational documents (conversations, reservations, housing state, catalogs). '
  'Not a second Location store. Isolation via tenant_id + RLS.';

create index if not exists tenant_documents_updated_at_idx
  on public.tenant_documents (tenant_id, updated_at desc);

alter table public.tenant_documents enable row level security;
alter table public.tenant_documents force row level security;

create policy tenant_documents_select_tenant
  on public.tenant_documents
  for select
  using (
    public.app_user_has_tenant(tenant_id)
    and public.app_user_person_id() is not null
  );

create policy tenant_documents_insert_tenant
  on public.tenant_documents
  for insert
  with check (
    public.app_user_has_tenant(tenant_id)
    and public.app_user_person_id() is not null
  );

create policy tenant_documents_update_tenant
  on public.tenant_documents
  for update
  using (
    public.app_user_has_tenant(tenant_id)
    and public.app_user_person_id() is not null
  )
  with check (public.app_user_has_tenant(tenant_id));

create policy tenant_documents_delete_staff
  on public.tenant_documents
  for delete
  using (public.app_user_is_tenant_staff(tenant_id));

grant select, insert, update, delete
  on table public.tenant_documents
  to authenticated;

-- Catalog reads for anonymous visitors still go through the application bootstrap
-- (pack seed). Member writes require bind + membership.

-- ---------------------------------------------------------------------------
-- Trusted bind RPCs
-- ---------------------------------------------------------------------------

create or replace function public.app_bind_request_context(
  p_person_id uuid,
  p_tenant_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_territory uuid;
  v_role text;
begin
  if p_person_id is null or p_tenant_id is null then
    raise exception 'person and tenant are required (fail closed)'
      using errcode = 'P0001';
  end if;

  if auth.uid() is not null then
    if not exists (
      select 1
      from public.identities i
      where i.person_id = p_person_id
        and i.provider_reference = auth.uid()::text
    ) then
      raise exception 'forbidden'
        using errcode = '42501';
    end if;
  end if;

  select m.territory_id, m.membership_type
    into v_territory, v_role
  from public.memberships m
  where m.person_id = p_person_id
    and m.tenant_id = p_tenant_id
    and m.status = 'active'
  limit 1;

  if v_territory is null then
    raise exception 'membership required'
      using errcode = 'P0001';
  end if;

  perform set_config('app.tenant_id', p_tenant_id::text, true);
  perform set_config('app.person_id', p_person_id::text, true);
  perform set_config('app.territory_id', v_territory::text, true);
  perform set_config('app.membership_role', v_role, true);
end;
$$;

comment on function public.app_bind_request_context(uuid, uuid) is
  'Binds Tenant + Person GUCs after verifying an active membership. '
  'JWT callers may only bind their own Person. Not a client-declared tenant grant.';

create or replace function public.app_bind_public_tenant(
  p_tenant_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_tenant_id is null then
    raise exception 'Tenant Context is required (fail closed)'
      using errcode = 'P0001';
  end if;

  if not exists (select 1 from public.tenants t where t.id = p_tenant_id) then
    raise exception 'unknown tenant'
      using errcode = 'P0001';
  end if;

  perform set_config('app.tenant_id', p_tenant_id::text, true);
  perform set_config('app.person_id', '', true);
  perform set_config('app.territory_id', '', true);
  perform set_config('app.membership_role', '', true);
end;
$$;

comment on function public.app_bind_public_tenant(uuid) is
  'Anonymous / public bind: tenant GUC only. Location SELECT then exposes public rows. '
  'Does not grant member or private data.';

create or replace function public.app_resolve_identity_memberships(
  p_provider_reference text
)
returns table (
  person_id uuid,
  membership_id uuid,
  tenant_id uuid,
  tenant_slug text,
  territory_id uuid,
  role text,
  display_name text,
  email text
)
language plpgsql
security definer
stable
set search_path = public
as $$
begin
  if p_provider_reference is null or length(trim(p_provider_reference)) = 0 then
    raise exception 'provider_reference is required'
      using errcode = 'P0001';
  end if;

  if auth.uid() is not null
     and p_provider_reference is distinct from auth.uid()::text then
    raise exception 'forbidden'
      using errcode = '42501';
  end if;

  return query
    select
      p.id,
      m.id,
      m.tenant_id,
      tn.public_slug,
      m.territory_id,
      m.membership_type,
      p.display_name,
      p.email
    from public.identities i
    inner join public.persons p on p.id = i.person_id
    inner join public.memberships m
      on m.person_id = p.id
     and m.status = 'active'
    inner join public.tenants tn on tn.id = m.tenant_id
    where i.provider_reference = p_provider_reference;
end;
$$;

comment on function public.app_resolve_identity_memberships(text) is
  'Lists active memberships for an authentication identity. '
  'JWT callers may only resolve auth.uid(). Used before tenant bind.';

revoke all on function public.app_bind_request_context(uuid, uuid) from public;
revoke all on function public.app_bind_public_tenant(uuid) from public;
revoke all on function public.app_resolve_identity_memberships(text) from public;

grant execute on function public.app_bind_request_context(uuid, uuid)
  to authenticated;

grant execute on function public.app_bind_public_tenant(uuid)
  to anon, authenticated;

grant execute on function public.app_resolve_identity_memberships(text)
  to authenticated;

-- service_role already bypasses RLS; EXECUTE lets bootstrap code call the resolver.
grant execute on function public.app_bind_request_context(uuid, uuid)
  to service_role;
grant execute on function public.app_resolve_identity_memberships(text)
  to service_role;
grant execute on function public.app_bind_public_tenant(uuid)
  to service_role;
