-- Life Community OS — Wave B ROLLBACK (demo seed only)
-- Reverses: 20260808130000_seed_life_panoramica_official_entities.sql
--
-- Deletes deterministic demo Official Entity rows only.
-- Safe even if production rows exist under other ids.

delete from public.official_entity_profiles
where id in (
  '10000000-0000-4000-8000-000000000021'::uuid,
  '10000000-0000-4000-8000-000000000022'::uuid
);
