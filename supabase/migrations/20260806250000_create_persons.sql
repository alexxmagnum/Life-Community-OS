-- Life Community OS — Person identity foundation (ADR-010)
-- ADR: docs/006_ARCHITECTURE_DECISIONS/ADR-010-PERSON-IDENTITY-MODEL.md
-- ADR: docs/006_ARCHITECTURE_DECISIONS/ADR-003-DATABASE-SECURITY-RLS-MODEL.md
--
-- Extends public.persons created by 20260806121000_foundation_identity_model.sql.
-- Does NOT recreate the table (would break identities / memberships FKs).
-- Does NOT modify prior migrations.
--
-- Person is an independent human identity entity (ADR-010):
--   - not a User Account / authentication credential store
--   - not a Business Profile
--   - not an Official Entity
--   - not a security boundary (isolation remains Tenant → Territory)
--
-- Does not create: users, auth tables, business profiles, official entities,
-- memberships, or RLS (RLS already exists via tenant_isolation_rls; unchanged here).

-- ---------------------------------------------------------------------------
-- Identity / display / contact / metadata / lifecycle columns
-- ---------------------------------------------------------------------------

alter table public.persons
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists display_name text,
  add column if not exists email text,
  add column if not exists phone text,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists status text not null default 'active';

-- ---------------------------------------------------------------------------
-- Checks
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'persons_status_allowed'
      and conrelid = 'public.persons'::regclass
  ) then
    alter table public.persons
      add constraint persons_status_allowed check (
        status in (
          'active',
          'inactive',
          'archived'
        )
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'persons_display_name_not_blank'
      and conrelid = 'public.persons'::regclass
  ) then
    alter table public.persons
      add constraint persons_display_name_not_blank check (
        display_name is null
        or length(trim(display_name)) > 0
      );
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index if not exists persons_email_idx
  on public.persons (email);

create index if not exists persons_phone_idx
  on public.persons (phone);

create index if not exists persons_status_idx
  on public.persons (status);

-- ---------------------------------------------------------------------------
-- Comments (ADR-010)
-- ---------------------------------------------------------------------------

comment on table public.persons is
  'Real human identity in the Domain (ADR-010). '
  'Independent identity entity — not a User Account, Business Profile, Official Entity, '
  'Membership, Role, or Permission. '
  'Person is not a security boundary; isolation remains Tenant → Territory (ADR-003). '
  'Authentication, businesses, official profiles and permissions are modeled separately. '
  'Tenant-scoped visibility remains relationship-derived (Membership → Territory → Tenant).';

comment on column public.persons.first_name is
  'Optional given name of the human.';

comment on column public.persons.last_name is
  'Optional family name of the human.';

comment on column public.persons.display_name is
  'Optional display label. Must not be blank when provided.';

comment on column public.persons.email is
  'Optional contact email on the Person domain record (not authentication credentials).';

comment on column public.persons.phone is
  'Optional contact phone on the Person domain record.';

comment on column public.persons.metadata is
  'Extensible non-relational attributes for Person.';

comment on column public.persons.status is
  'Lifecycle status: active, inactive, or archived.';
