-- CommunityEvent → Experience(kind=event) backfill (ADR-027 Phase 3).
-- Does NOT drop community_events. Idempotent via stable id + metadata key.
-- Product SoT for new Events is Experience(kind=event).

-- Unique legacy mapping when metadata carries legacyCommunityEventId.
create unique index if not exists experiences_legacy_community_event_uidx
  on public.experiences ((metadata->>'legacyCommunityEventId'))
  where metadata->>'legacyCommunityEventId' is not null;

comment on index public.experiences_legacy_community_event_uidx is
  'Idempotent CommunityEvent → Experience migration mapping.';

-- Backfill rows that have a territory_id.
insert into public.experiences (
  id,
  tenant_id,
  territory_id,
  created_by,
  owner_person_id,
  title,
  description,
  category,
  kind,
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
  'ex-ce-' || ce.id::text,
  ce.tenant_id,
  ce.territory_id,
  ce.created_by,
  ce.author_person_id,
  ce.title,
  case
    when nullif(trim(ce.description), '') is null then ce.title
    else ce.description
  end,
  'custom',
  'event',
  case
    when ce.status = 'draft' then 'draft'
    when ce.status = 'cancelled' then 'cancelled'
    when ce.status = 'archived' then 'archived'
    else 'published'
  end,
  8,
  ce.starts_at,
  ce.ends_at,
  coalesce(ce.location_label, ''),
  jsonb_strip_nulls(
    jsonb_build_object(
      'migratedFrom', 'community_event',
      'legacyCommunityEventId', ce.id::text,
      'legacyGroupId', ce.group_id,
      'legacyAuthorDisplayName', nullif(trim(ce.author_display_name), ''),
      'legacyCreatedAt', ce.created_at,
      'legacyUpdatedAt', ce.updated_at
    )
  ),
  ce.created_at,
  ce.updated_at
from public.community_events ce
where ce.territory_id is not null
  and not exists (
    select 1
    from public.experiences e
    where e.id = 'ex-ce-' || ce.id::text
       or e.metadata->>'legacyCommunityEventId' = ce.id::text
  );

-- Creator participation for backfilled experiences (when missing).
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
  'exp-ce-' || ce.id::text,
  ce.tenant_id,
  'ex-ce-' || ce.id::text,
  ce.author_person_id,
  ce.created_by,
  'creator',
  ce.created_at,
  ce.updated_at
from public.community_events ce
where ce.territory_id is not null
  and exists (
    select 1 from public.experiences e where e.id = 'ex-ce-' || ce.id::text
  )
  and not exists (
    select 1
    from public.experience_participants p
    where p.experience_id = 'ex-ce-' || ce.id::text
      and p.person_id = ce.author_person_id
  );

comment on table public.community_events is
  'LEGACY — transitional. New Events write Experience(kind=event). Rows kept for compatibility until readers finish converging. Do not use as product SoT.';
