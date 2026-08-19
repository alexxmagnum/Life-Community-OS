-- Life Community OS — Seed: Ocean Hills Community (third white-label tenant)
-- Independent SaaS customer root. Not a copy of Panorámica or Valley.

insert into public.tenants (
  id,
  public_slug,
  display_name,
  configuration,
  status
)
values (
  '30000000-0000-4000-8000-000000000001'::uuid,
  'life-ocean-hills',
  'Ocean Hills Community',
  '{"whiteLabel": true, "locale": "en"}'::jsonb,
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
  '30000000-0000-4000-8000-000000000002'::uuid,
  '30000000-0000-4000-8000-000000000001'::uuid,
  'Ocean Hills',
  'Coastal community territory for white-label factory validation'
)
on conflict (id) do nothing;
