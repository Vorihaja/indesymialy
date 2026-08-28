begin;

-- ============================================================
-- INDESY MIALY
-- Les comptes système internes ne doivent pas obligatoirement
-- représenter un acteur géographique de l'écosystème.
-- ============================================================

alter table public.profiles
alter column region_id drop not null;

alter table public.profiles
alter column city_id drop not null;

comment on column public.profiles.region_id is
'Région du profil métier. Facultative pour les comptes purement système.';

comment on column public.profiles.city_id is
'Ville du profil métier. Facultative pour les comptes purement système.';

commit;
