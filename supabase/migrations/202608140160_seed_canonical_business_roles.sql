begin;

insert into public.roles(slug, label, description, is_organization)
values
  ('federation', 'Fédération', 'Gestion d''une fédération sportive.', true),
  ('league', 'Ligue / Région', 'Gestion d''une ligue ou structure régionale.', true),
  ('club', 'Club / Dojo', 'Gestion d''un club ou dojo.', true),
  ('coach', 'Coach', 'Encadrement et suivi des combattants.', false),
  ('fighter', 'Combattant', 'Parcours sportif du combattant.', false),
  ('organizer', 'Organisateur', 'Organisation et gestion des événements.', true),
  ('referee', 'Arbitre', 'Arbitrage des combats et compétitions.', false),
  ('judge', 'Juge', 'Notation et décisions des combats.', false),
  ('sponsor', 'Sponsor', 'Partenariats et sponsoring.', true),
  ('seller', 'Vendeur', 'Vente de produits et services.', true),
  ('fan', 'Fan', 'Suivi des événements et des athlètes.', false)
on conflict(slug) do update set
  label = excluded.label,
  description = excluded.description,
  is_organization = excluded.is_organization;

commit;
