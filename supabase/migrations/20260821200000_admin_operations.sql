-- Life Community OS — Phase 13: Admin Operations Center
--
-- Operational overlays + audit trail. Does not clone Business / Housing /
-- Reservations into Admin* tables. Staff still mutate those domains in place.

-- ---------------------------------------------------------------------------
-- admin_audit_logs
-- ---------------------------------------------------------------------------

create table if not exists public.admin_audit_logs (
  id text primary key,
  tenant_id uuid not null references public.tenants (id) on delete restrict,
  created_by text not null,
  actor_person_id text not null,
  actor_role text not null,
  action text not null,
  entity_type text not null,
  entity_id text not null,
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint admin_audit_actor_matches_created_by check (
    actor_person_id = created_by
  )
);

create index if not exists admin_audit_logs_tenant_created_idx
  on public.admin_audit_logs (tenant_id, created_at desc);

comment on table public.admin_audit_logs is
  'Tenant-scoped staff action trail. Actor is the session Person.';

-- ---------------------------------------------------------------------------
-- tenant_operation_settings
-- ---------------------------------------------------------------------------

create table if not exists public.tenant_operation_settings (
  tenant_id uuid primary key references public.tenants (id) on delete restrict,
  created_by text not null,
  branding_name text,
  tagline text,
  primary_color text,
  locale text,
  timezone text,
  contact_email text,
  contact_phone text,
  capabilities jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.tenant_operation_settings is
  'Tenant overlay for locale, contact and display branding. Does not change product identity.';

-- ---------------------------------------------------------------------------
-- membership_invitations
-- ---------------------------------------------------------------------------

create table if not exists public.membership_invitations (
  id text primary key,
  tenant_id uuid not null references public.tenants (id) on delete restrict,
  created_by text not null,
  email text not null,
  role text not null default 'member',
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint membership_invitations_status_allowed check (
    status in ('pending', 'accepted', 'cancelled')
  )
);

create index if not exists membership_invitations_tenant_email_idx
  on public.membership_invitations (tenant_id, email);

-- ---------------------------------------------------------------------------
-- territory_object_asset_assignments
-- ---------------------------------------------------------------------------

create table if not exists public.territory_object_asset_assignments (
  tenant_id uuid not null references public.tenants (id) on delete restrict,
  territory_object_id text not null,
  spatial_asset_id text not null,
  created_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (tenant_id, territory_object_id)
);

comment on table public.territory_object_asset_assignments is
  'Admin assignment TerritoryObject → SpatialAsset. Renderer is not modified.';

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.admin_audit_logs enable row level security;
alter table public.tenant_operation_settings enable row level security;
alter table public.membership_invitations enable row level security;
alter table public.territory_object_asset_assignments enable row level security;

create policy admin_audit_logs_staff_select
  on public.admin_audit_logs for select
  using (public.app_user_is_tenant_staff(tenant_id));

create policy admin_audit_logs_staff_insert
  on public.admin_audit_logs for insert
  with check (
    public.app_user_is_tenant_staff(tenant_id)
    and created_by = public.app_user_person_id()::text
  );

create policy tenant_operation_settings_member_select
  on public.tenant_operation_settings for select
  using (public.app_user_has_tenant(tenant_id));

create policy tenant_operation_settings_admin_write
  on public.tenant_operation_settings for all
  using (public.app_user_is_tenant_staff(tenant_id))
  with check (public.app_user_is_tenant_staff(tenant_id));

create policy membership_invitations_staff
  on public.membership_invitations for all
  using (public.app_user_is_tenant_staff(tenant_id))
  with check (public.app_user_is_tenant_staff(tenant_id));

create policy territory_assignments_member_select
  on public.territory_object_asset_assignments for select
  using (public.app_user_has_tenant(tenant_id));

create policy territory_assignments_admin_write
  on public.territory_object_asset_assignments for all
  using (public.app_user_is_tenant_staff(tenant_id))
  with check (public.app_user_is_tenant_staff(tenant_id));
