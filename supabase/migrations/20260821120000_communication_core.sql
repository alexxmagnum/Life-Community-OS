-- Life Community OS — Phase 9: Communication Core
--
-- One Conversation graph for every product context.
-- Does not modify Life Map, Community Core, Auth bind RPCs, tenant factory,
-- business_profiles, properties, or reservations tables.

-- ---------------------------------------------------------------------------
-- conversations
-- ---------------------------------------------------------------------------

create table if not exists public.conversations (
  id text primary key,
  tenant_id uuid not null references public.tenants (id) on delete restrict,
  created_by text not null,
  type text not null default 'context',
  context_type text not null,
  context_id text not null,
  title text,
  status text not null default 'active',
  participant_policy text not null default 'invited',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint conversations_type_allowed check (
    type in ('direct', 'group', 'context')
  ),
  constraint conversations_status_allowed check (
    status in ('draft', 'active', 'completed', 'archived', 'locked')
  ),
  constraint conversations_policy_allowed check (
    participant_policy in ('open_context', 'invited', 'role_gated')
  )
);

create unique index if not exists conversations_context_uidx
  on public.conversations (tenant_id, context_type, context_id);

create index if not exists conversations_tenant_idx
  on public.conversations (tenant_id, created_at desc);

comment on table public.conversations is
  'Tenant-owned communication thread. One table for community, business, reservation, marketplace, help, administration.';

-- ---------------------------------------------------------------------------
-- conversation_participants
-- ---------------------------------------------------------------------------

create table if not exists public.conversation_participants (
  id text primary key,
  tenant_id uuid not null references public.tenants (id) on delete restrict,
  created_by text not null,
  conversation_id text not null references public.conversations (id) on delete cascade,
  person_id text not null,
  role text not null default 'participant',
  status text not null default 'active',
  display_name text,
  joined_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint conversation_participants_role_allowed check (
    role in ('owner', 'participant', 'moderator')
  ),
  constraint conversation_participants_status_allowed check (
    status in ('active', 'left', 'removed')
  )
);

create unique index if not exists conversation_participants_uidx
  on public.conversation_participants (conversation_id, person_id);

create index if not exists conversation_participants_person_idx
  on public.conversation_participants (tenant_id, person_id, status);

comment on table public.conversation_participants is
  'People who may read and write a Conversation. Roles are server-assigned.';

-- ---------------------------------------------------------------------------
-- messages
-- ---------------------------------------------------------------------------

create table if not exists public.messages (
  id text primary key,
  tenant_id uuid not null references public.tenants (id) on delete restrict,
  created_by text not null,
  conversation_id text not null references public.conversations (id) on delete cascade,
  sender_person_id text not null,
  content text not null default '',
  reply_to_message_id text,
  status text not null default 'sent',
  edited_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint messages_status_allowed check (
    status in ('sent', 'edited', 'deleted')
  ),
  constraint messages_sender_matches_created_by check (
    sender_person_id = created_by
  )
);

create index if not exists messages_conversation_idx
  on public.messages (tenant_id, conversation_id, created_at);

comment on table public.messages is
  'Conversation messages. sender_person_id is always the session person.';

-- ---------------------------------------------------------------------------
-- message_attachments
-- ---------------------------------------------------------------------------

create table if not exists public.message_attachments (
  id text primary key,
  tenant_id uuid not null references public.tenants (id) on delete restrict,
  created_by text not null,
  message_id text not null references public.messages (id) on delete cascade,
  kind text not null default 'file',
  file_name text not null,
  mime_type text not null default 'application/octet-stream',
  file_id text,
  url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint message_attachments_kind_allowed check (
    kind in ('image', 'document', 'file')
  )
);

create index if not exists message_attachments_message_idx
  on public.message_attachments (tenant_id, message_id);

comment on table public.message_attachments is
  'Prepared attachment metadata for messages. File bytes use Core Files later.';

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages enable row level security;
alter table public.message_attachments enable row level security;

create policy conversations_select_participant
  on public.conversations for select
  using (
    public.app_user_has_tenant(tenant_id)
    and (
      public.app_user_is_tenant_staff(tenant_id)
      or created_by = public.app_user_person_id()::text
      or exists (
        select 1
        from public.conversation_participants p
        where p.conversation_id = conversations.id
          and p.person_id = public.app_user_person_id()::text
          and p.status = 'active'
      )
    )
  );

create policy conversations_insert_member
  on public.conversations for insert
  with check (
    public.app_user_has_tenant(tenant_id)
    and public.app_user_person_id() is not null
    and created_by = public.app_user_person_id()::text
  );

create policy conversations_update_owner_or_staff
  on public.conversations for update
  using (
    public.app_user_has_tenant(tenant_id)
    and (
      created_by = public.app_user_person_id()::text
      or public.app_user_is_tenant_staff(tenant_id)
    )
  )
  with check (public.app_user_has_tenant(tenant_id));

create policy conversation_participants_select
  on public.conversation_participants for select
  using (
    public.app_user_has_tenant(tenant_id)
    and (
      person_id = public.app_user_person_id()::text
      or public.app_user_is_tenant_staff(tenant_id)
      or exists (
        select 1
        from public.conversation_participants self
        where self.conversation_id = conversation_participants.conversation_id
          and self.person_id = public.app_user_person_id()::text
          and self.status = 'active'
      )
    )
  );

create policy conversation_participants_insert
  on public.conversation_participants for insert
  with check (
    public.app_user_has_tenant(tenant_id)
    and public.app_user_person_id() is not null
    and created_by = public.app_user_person_id()::text
  );

create policy conversation_participants_update_staff_or_owner
  on public.conversation_participants for update
  using (
    public.app_user_has_tenant(tenant_id)
    and (
      public.app_user_is_tenant_staff(tenant_id)
      or created_by = public.app_user_person_id()::text
    )
  )
  with check (public.app_user_has_tenant(tenant_id));

create policy messages_select_participant
  on public.messages for select
  using (
    public.app_user_has_tenant(tenant_id)
    and (
      public.app_user_is_tenant_staff(tenant_id)
      or sender_person_id = public.app_user_person_id()::text
      or exists (
        select 1
        from public.conversation_participants p
        where p.conversation_id = messages.conversation_id
          and p.person_id = public.app_user_person_id()::text
          and p.status = 'active'
      )
    )
  );

create policy messages_insert_participant
  on public.messages for insert
  with check (
    public.app_user_has_tenant(tenant_id)
    and public.app_user_person_id() is not null
    and created_by = public.app_user_person_id()::text
    and sender_person_id = public.app_user_person_id()::text
    and exists (
      select 1
      from public.conversation_participants p
      where p.conversation_id = messages.conversation_id
        and p.person_id = public.app_user_person_id()::text
        and p.status = 'active'
    )
  );

create policy messages_update_sender_or_staff
  on public.messages for update
  using (
    public.app_user_has_tenant(tenant_id)
    and (
      sender_person_id = public.app_user_person_id()::text
      or public.app_user_is_tenant_staff(tenant_id)
    )
  )
  with check (
    public.app_user_has_tenant(tenant_id)
    and sender_person_id = created_by
  );

create policy message_attachments_select_participant
  on public.message_attachments for select
  using (
    public.app_user_has_tenant(tenant_id)
    and exists (
      select 1
      from public.messages m
      where m.id = message_attachments.message_id
        and (
          m.sender_person_id = public.app_user_person_id()::text
          or public.app_user_is_tenant_staff(tenant_id)
          or exists (
            select 1
            from public.conversation_participants p
            where p.conversation_id = m.conversation_id
              and p.person_id = public.app_user_person_id()::text
              and p.status = 'active'
          )
        )
    )
  );

create policy message_attachments_insert_sender
  on public.message_attachments for insert
  with check (
    public.app_user_has_tenant(tenant_id)
    and public.app_user_person_id() is not null
    and created_by = public.app_user_person_id()::text
  );

grant select, insert, update, delete on table public.conversations to authenticated;
grant select, insert, update, delete on table public.conversation_participants to authenticated;
grant select, insert, update, delete on table public.messages to authenticated;
grant select, insert, update, delete on table public.message_attachments to authenticated;
