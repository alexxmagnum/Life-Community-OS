-- Experience.kind — first-class product discriminator (ADR-027 addendum)
-- Technical aggregate remains Experience. Product kinds: plan | experience | event.
-- Legacy meeting (never persisted on this table) maps to plan when encountered in metadata.

alter table public.experiences
  add column if not exists kind text not null default 'experience';

-- Backfill from metadata hints when present (catalog / transitional clients).
update public.experiences
set kind = case
  when lower(coalesce(metadata->>'kind', metadata->>'type', '')) = 'event'
    then 'event'
  when lower(coalesce(metadata->>'kind', metadata->>'type', '')) in ('plan', 'meeting')
    then 'plan'
  when kind in ('plan', 'experience', 'event')
    then kind
  else 'experience'
end;

alter table public.experiences
  drop constraint if exists experiences_kind_allowed;

alter table public.experiences
  add constraint experiences_kind_allowed check (
    kind in ('plan', 'experience', 'event')
  );

create index if not exists experiences_kind_idx
  on public.experiences (tenant_id, kind, status);

comment on column public.experiences.kind is
  'Product discriminator: plan | experience | event. Aggregate remains Experience. Legacy meeting → plan.';
