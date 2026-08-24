create table if not exists public.incidents (
  id text primary key,
  tenant_id uuid not null references public.tenants (id) on delete restrict,
  created_by text not null,
  category text not null default 'other',
  priority text not null default 'normal',
  status text not null default 'open',
  description text not null,
  location_id text,
  attachment_ids jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint incidents_status_allowed check (status in ('open', 'reviewing', 'resolved', 'closed')),
  constraint incidents_priority_allowed check (priority in ('low', 'normal', 'high', 'urgent'))
);

create index if not exists incidents_tenant_created_idx
  on public.incidents (tenant_id, created_at desc);

create index if not exists incidents_tenant_creator_idx
  on public.incidents (tenant_id, created_by, created_at desc);

alter table public.incidents enable row level security;

create policy incidents_member_select_own
  on public.incidents for select
  using (
    public.app_user_has_tenant(tenant_id)
    and (
      created_by = public.app_user_person_id()::text
      or public.app_user_is_tenant_staff(tenant_id)
    )
  );

create policy incidents_member_insert
  on public.incidents for insert
  with check (
    public.app_user_has_tenant(tenant_id)
    and created_by = public.app_user_person_id()::text
  );

create policy incidents_staff_update
  on public.incidents for update
  using (public.app_user_is_tenant_staff(tenant_id))
  with check (public.app_user_is_tenant_staff(tenant_id));
