-- Life Community OS — Territory domain propagation (additive)
-- Tenant remains the SaaS isolation root. Territory is the geographic world.
-- NEVER drop tenant_id. Columns stay nullable until backfill is validated.

-- ---------------------------------------------------------------------------
-- Integrity: Territory must belong to the same Tenant as the row
-- ---------------------------------------------------------------------------

create or replace function public.app_territory_owned_by_tenant(
  p_territory_id uuid,
  p_tenant_id uuid
)
returns boolean
language sql
stable
parallel safe
as $$
  select p_territory_id is null
    or exists (
      select 1
      from public.territories t
      where t.id = p_territory_id
        and t.tenant_id = p_tenant_id
    );
$$;

comment on function public.app_territory_owned_by_tenant(uuid, uuid) is
  'True when territory_id is null or the Territory is owned by the row tenant_id.';

create or replace function public.app_row_matches_territory(p_territory_id uuid)
returns boolean
language sql
stable
parallel safe
as $$
  select public.app_current_territory_id() is null
    or p_territory_id is null
    or p_territory_id = public.app_current_territory_id();
$$;

comment on function public.app_row_matches_territory(uuid) is
  'Optional Territory GUC filter. Unbound territory context stays tenant-only (backward compatible).';

revoke all on function public.app_territory_owned_by_tenant(uuid, uuid) from public;
revoke all on function public.app_row_matches_territory(uuid) from public;
grant execute on function public.app_territory_owned_by_tenant(uuid, uuid) to anon, authenticated;
grant execute on function public.app_row_matches_territory(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Add nullable territory_id + FK + backfill from the tenant's first Territory
-- ---------------------------------------------------------------------------

do $$
declare
  tbl text;
  tables text[] := array[
    'business_profiles',
    'resources',
    'reservations',
    'marketplace_listings',
    'community_help_requests',
    'community_groups',
    'community_posts',
    'community_events',
    'conversations',
    'media_assets',
    'properties'
  ];
begin
  foreach tbl in array tables
  loop
    if to_regclass('public.' || tbl) is null then
      continue;
    end if;

    execute format(
      'alter table public.%I add column if not exists territory_id uuid',
      tbl
    );

    if not exists (
      select 1
      from pg_constraint
      where conname = tbl || '_territory_id_fkey'
    ) then
      execute format(
        'alter table public.%I
           add constraint %I
           foreign key (territory_id) references public.territories (id)
           on delete restrict',
        tbl,
        tbl || '_territory_id_fkey'
      );
    end if;

    execute format(
      'update public.%I as row_data
         set territory_id = owned.id
         from (
           select distinct on (tenant_id) id, tenant_id
           from public.territories
           order by tenant_id, created_at asc
         ) as owned
       where row_data.tenant_id = owned.tenant_id
         and row_data.territory_id is null',
      tbl
    );

    execute format(
      'create index if not exists %I on public.%I (territory_id)',
      tbl || '_territory_id_idx',
      tbl
    );

    if not exists (
      select 1
      from pg_constraint
      where conname = tbl || '_territory_tenant_match'
    ) then
      execute format(
        'alter table public.%I
           add constraint %I
           check (public.app_territory_owned_by_tenant(territory_id, tenant_id))',
        tbl,
        tbl || '_territory_tenant_match'
      );
    end if;

    execute format(
      'comment on column public.%I.territory_id is %L',
      tbl,
      'Geographic Territory inside the Tenant. tenant_id remains the SaaS isolation key.'
    );
  end loop;
end $$;

-- Reservations inherit Territory from their Resource when still null
update public.reservations as rv
set territory_id = res.territory_id
from public.resources as res
where rv.resource_id = res.id
  and rv.territory_id is null
  and res.territory_id is not null
  and rv.tenant_id = res.tenant_id;

update public.business_profiles as biz
set territory_id = loc.territory_id
from public.locations as loc
where biz.location_id = loc.id
  and biz.territory_id is null
  and loc.territory_id is not null
  and biz.tenant_id = loc.tenant_id;

update public.properties as prop
set territory_id = loc.territory_id
from public.locations as loc
where prop.location_id = loc.id::text
  and prop.territory_id is null
  and loc.territory_id is not null
  and prop.tenant_id is not null
  and prop.tenant_id = loc.tenant_id;
