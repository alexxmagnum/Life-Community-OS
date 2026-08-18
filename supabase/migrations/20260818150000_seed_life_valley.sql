-- Life Community OS — Seed: Life Valley validation tenant
-- Second SaaS customer root to prove platform ≠ isolation.
--
-- UUID strategy (deterministic):
--   Tenant:    20000000-0000-4000-8000-000000000001
--   Territory: 20000000-0000-4000-8000-000000000002

insert into public.tenants (
  id,
  public_slug,
  display_name,
  configuration,
  status
)
values (
  '20000000-0000-4000-8000-000000000001'::uuid,
  'life-valley',
  'Life Valley',
  '{"validationTenant": true}'::jsonb,
  'active'
)
on conflict (id) do nothing;

insert into public.territories (
  id,
  tenant_id,
  name,
  description
)
values (
  '20000000-0000-4000-8000-000000000002'::uuid,
  '20000000-0000-4000-8000-000000000001'::uuid,
  'Life Valley',
  'Validation territory for multi-tenant isolation tests'
)
on conflict (id) do nothing;
