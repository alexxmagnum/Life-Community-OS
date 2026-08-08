-- Life Community OS — Wave B ROLLBACK (create + RLS + helper)
-- Reverses:
--   20260808120000_official_entity_profile_rls.sql
--   20260808110000_create_official_entity_profiles.sql
--
-- Run AFTER deleting demo seeds (or use seed down first):
--   down/20260808130000_seed_life_panoramica_official_entities.down.sql
--
-- Never drops tenants, territories, community_areas, or Wave A objects.
-- Wave C+ must not depend on these rows/tables yet, or drop dependents first.

drop policy if exists official_entity_profiles_delete_via_tenant
  on public.official_entity_profiles;
drop policy if exists official_entity_profiles_update_via_tenant
  on public.official_entity_profiles;
drop policy if exists official_entity_profiles_insert_via_tenant
  on public.official_entity_profiles;
drop policy if exists official_entity_profiles_select_via_tenant
  on public.official_entity_profiles;

revoke all on function public.app_territory_authority_id(uuid) from public;
revoke all on function public.app_territory_authority_id(uuid) from anon, authenticated;
drop function if exists public.app_territory_authority_id(uuid);

drop trigger if exists official_entity_profiles_enforce_area_same_territory
  on public.official_entity_profiles;
drop function if exists public.official_entity_profiles_enforce_area_same_territory();

drop trigger if exists official_entity_profiles_enforce_tenant_match
  on public.official_entity_profiles;
drop function if exists public.official_entity_profiles_enforce_tenant_match();

drop table if exists public.official_entity_profiles;
