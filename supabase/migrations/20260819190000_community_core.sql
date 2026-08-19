-- Life Community OS — Phase 4: Community Core domain
--
-- First-class tenant-owned community records.
-- Does not replace community_areas, memberships, or tenant_documents.
-- Does not modify Life Map, Location, Auth bind RPCs, or tenant factory.

-- ---------------------------------------------------------------------------
-- Groups
-- ---------------------------------------------------------------------------

create table if not exists public.community_groups (
  id uuid primary key,
  tenant_id uuid not null references public.tenants (id) on delete restrict,
  name text not null,
  description text not null default '',
  image_url text,
  category_label text,
  group_type text not null default 'custom',
  visibility text not null default 'territory',
  status text not null default 'active',
  created_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint community_groups_status_allowed check (
    status in ('draft', 'active', 'archived')
  ),
  constraint community_groups_visibility_allowed check (
    visibility in ('territory', 'area', 'members', 'hidden')
  )
);

create index if not exists community_groups_tenant_idx
  on public.community_groups (tenant_id, updated_at desc);

comment on table public.community_groups is
  'Social groups inside a tenant community. Not a security boundary.';

-- ---------------------------------------------------------------------------
-- Posts
-- ---------------------------------------------------------------------------

create table if not exists public.community_posts (
  id uuid primary key,
  tenant_id uuid not null references public.tenants (id) on delete restrict,
  group_id uuid references public.community_groups (id) on delete set null,
  author_person_id text not null,
  author_display_name text not null default '',
  kind text not null default 'member_update',
  title text not null,
  body text not null,
  status text not null default 'published',
  created_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint community_posts_status_allowed check (
    status in ('draft', 'published', 'hidden', 'archived')
  ),
  constraint community_posts_kind_allowed check (
    kind in ('member_update', 'discussion', 'announcement', 'proposal')
  )
);

create index if not exists community_posts_tenant_idx
  on public.community_posts (tenant_id, created_at desc);

comment on table public.community_posts is
  'Published community content. Ownership is tenant_id + created_by.';

-- ---------------------------------------------------------------------------
-- Events
-- ---------------------------------------------------------------------------

create table if not exists public.community_events (
  id uuid primary key,
  tenant_id uuid not null references public.tenants (id) on delete restrict,
  group_id uuid references public.community_groups (id) on delete set null,
  author_person_id text not null,
  author_display_name text not null default '',
  title text not null,
  description text not null default '',
  starts_at timestamptz not null,
  ends_at timestamptz,
  location_label text,
  status text not null default 'published',
  created_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint community_events_status_allowed check (
    status in ('draft', 'published', 'cancelled', 'archived')
  )
);

create index if not exists community_events_tenant_idx
  on public.community_events (tenant_id, starts_at);

-- ---------------------------------------------------------------------------
-- Comments
-- ---------------------------------------------------------------------------

create table if not exists public.community_comments (
  id uuid primary key,
  tenant_id uuid not null references public.tenants (id) on delete restrict,
  post_id uuid references public.community_posts (id) on delete cascade,
  event_id uuid references public.community_events (id) on delete cascade,
  author_person_id text not null,
  author_display_name text not null default '',
  body text not null,
  status text not null default 'published',
  created_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint community_comments_target check (
    post_id is not null or event_id is not null
  ),
  constraint community_comments_status_allowed check (
    status in ('published', 'hidden', 'archived')
  )
);

create index if not exists community_comments_tenant_idx
  on public.community_comments (tenant_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Notifications
-- ---------------------------------------------------------------------------

create table if not exists public.community_notifications (
  id uuid primary key,
  tenant_id uuid not null references public.tenants (id) on delete restrict,
  recipient_person_id text not null,
  kind text not null,
  title text not null,
  body text not null default '',
  entity_type text,
  entity_id text,
  read_at timestamptz,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists community_notifications_inbox_idx
  on public.community_notifications (tenant_id, recipient_person_id, created_at desc);

-- ---------------------------------------------------------------------------
-- P1: reactions + saves
-- ---------------------------------------------------------------------------

create table if not exists public.community_reactions (
  id uuid primary key,
  tenant_id uuid not null references public.tenants (id) on delete restrict,
  person_id text not null,
  target_type text not null,
  target_id text not null,
  kind text not null,
  created_by text not null,
  created_at timestamptz not null default now(),
  constraint community_reactions_unique unique (tenant_id, person_id, target_type, target_id, kind)
);

create table if not exists public.community_saves (
  id uuid primary key,
  tenant_id uuid not null references public.tenants (id) on delete restrict,
  person_id text not null,
  target_type text not null,
  target_id text not null,
  created_by text not null,
  created_at timestamptz not null default now(),
  constraint community_saves_unique unique (tenant_id, person_id, target_type, target_id)
);

-- ---------------------------------------------------------------------------
-- RLS — reuse Phase 2 membership helpers. Do not replace bind RPCs.
-- ---------------------------------------------------------------------------

alter table public.community_groups enable row level security;
alter table public.community_groups force row level security;
alter table public.community_posts enable row level security;
alter table public.community_posts force row level security;
alter table public.community_events enable row level security;
alter table public.community_events force row level security;
alter table public.community_comments enable row level security;
alter table public.community_comments force row level security;
alter table public.community_notifications enable row level security;
alter table public.community_notifications force row level security;
alter table public.community_reactions enable row level security;
alter table public.community_reactions force row level security;
alter table public.community_saves enable row level security;
alter table public.community_saves force row level security;

create policy community_groups_select_tenant
  on public.community_groups for select
  using (public.app_user_has_tenant(tenant_id));

create policy community_groups_insert_member
  on public.community_groups for insert
  with check (
    public.app_user_has_tenant(tenant_id)
    and public.app_user_person_id() is not null
    and created_by = public.app_user_person_id()::text
  );

create policy community_groups_update_owner_or_staff
  on public.community_groups for update
  using (
    public.app_user_has_tenant(tenant_id)
    and (
      public.app_user_is_tenant_staff(tenant_id)
      or created_by = public.app_user_person_id()::text
    )
  )
  with check (public.app_user_has_tenant(tenant_id));

create policy community_groups_delete_staff
  on public.community_groups for delete
  using (public.app_user_is_tenant_staff(tenant_id));

create policy community_posts_select_tenant
  on public.community_posts for select
  using (
    public.app_user_has_tenant(tenant_id)
    and (
      status = 'published'
      or created_by = public.app_user_person_id()::text
      or public.app_user_is_tenant_staff(tenant_id)
    )
  );

create policy community_posts_insert_member
  on public.community_posts for insert
  with check (
    public.app_user_has_tenant(tenant_id)
    and public.app_user_person_id() is not null
    and created_by = public.app_user_person_id()::text
    and author_person_id = public.app_user_person_id()::text
  );

create policy community_posts_update_owner_or_staff
  on public.community_posts for update
  using (
    public.app_user_has_tenant(tenant_id)
    and (
      public.app_user_is_tenant_staff(tenant_id)
      or created_by = public.app_user_person_id()::text
    )
  )
  with check (public.app_user_has_tenant(tenant_id));

create policy community_posts_delete_staff
  on public.community_posts for delete
  using (public.app_user_is_tenant_staff(tenant_id));

create policy community_events_select_tenant
  on public.community_events for select
  using (
    public.app_user_has_tenant(tenant_id)
    and (
      status = 'published'
      or created_by = public.app_user_person_id()::text
      or public.app_user_is_tenant_staff(tenant_id)
    )
  );

create policy community_events_insert_member
  on public.community_events for insert
  with check (
    public.app_user_has_tenant(tenant_id)
    and public.app_user_person_id() is not null
    and created_by = public.app_user_person_id()::text
    and author_person_id = public.app_user_person_id()::text
  );

create policy community_events_update_owner_or_staff
  on public.community_events for update
  using (
    public.app_user_has_tenant(tenant_id)
    and (
      public.app_user_is_tenant_staff(tenant_id)
      or created_by = public.app_user_person_id()::text
    )
  )
  with check (public.app_user_has_tenant(tenant_id));

create policy community_events_delete_staff
  on public.community_events for delete
  using (public.app_user_is_tenant_staff(tenant_id));

create policy community_comments_select_tenant
  on public.community_comments for select
  using (
    public.app_user_has_tenant(tenant_id)
    and (
      status = 'published'
      or created_by = public.app_user_person_id()::text
      or public.app_user_is_tenant_staff(tenant_id)
    )
  );

create policy community_comments_insert_member
  on public.community_comments for insert
  with check (
    public.app_user_has_tenant(tenant_id)
    and public.app_user_person_id() is not null
    and created_by = public.app_user_person_id()::text
  );

create policy community_comments_update_owner_or_staff
  on public.community_comments for update
  using (
    public.app_user_has_tenant(tenant_id)
    and (
      public.app_user_is_tenant_staff(tenant_id)
      or created_by = public.app_user_person_id()::text
    )
  )
  with check (public.app_user_has_tenant(tenant_id));

create policy community_notifications_select_own
  on public.community_notifications for select
  using (
    public.app_user_has_tenant(tenant_id)
    and (
      recipient_person_id = public.app_user_person_id()::text
      or public.app_user_is_tenant_staff(tenant_id)
    )
  );

create policy community_notifications_insert_member
  on public.community_notifications for insert
  with check (
    public.app_user_has_tenant(tenant_id)
    and public.app_user_person_id() is not null
  );

create policy community_notifications_update_own
  on public.community_notifications for update
  using (
    public.app_user_has_tenant(tenant_id)
    and (
      recipient_person_id = public.app_user_person_id()::text
      or public.app_user_is_tenant_staff(tenant_id)
    )
  )
  with check (public.app_user_has_tenant(tenant_id));

create policy community_reactions_select_tenant
  on public.community_reactions for select
  using (public.app_user_has_tenant(tenant_id));

create policy community_reactions_insert_own
  on public.community_reactions for insert
  with check (
    public.app_user_has_tenant(tenant_id)
    and created_by = public.app_user_person_id()::text
    and person_id = public.app_user_person_id()::text
  );

create policy community_reactions_delete_own
  on public.community_reactions for delete
  using (
    public.app_user_has_tenant(tenant_id)
    and (
      created_by = public.app_user_person_id()::text
      or public.app_user_is_tenant_staff(tenant_id)
    )
  );

create policy community_saves_select_own
  on public.community_saves for select
  using (
    public.app_user_has_tenant(tenant_id)
    and person_id = public.app_user_person_id()::text
  );

create policy community_saves_insert_own
  on public.community_saves for insert
  with check (
    public.app_user_has_tenant(tenant_id)
    and created_by = public.app_user_person_id()::text
    and person_id = public.app_user_person_id()::text
  );

create policy community_saves_delete_own
  on public.community_saves for delete
  using (
    public.app_user_has_tenant(tenant_id)
    and person_id = public.app_user_person_id()::text
  );

grant select, insert, update, delete on table public.community_groups to authenticated;
grant select, insert, update, delete on table public.community_posts to authenticated;
grant select, insert, update, delete on table public.community_events to authenticated;
grant select, insert, update, delete on table public.community_comments to authenticated;
grant select, insert, update, delete on table public.community_notifications to authenticated;
grant select, insert, update, delete on table public.community_reactions to authenticated;
grant select, insert, update, delete on table public.community_saves to authenticated;
