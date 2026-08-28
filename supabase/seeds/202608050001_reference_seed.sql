-- Non-sensitive, idempotent reference seed. PREPARED ONLY.
begin;

with role_seed(slug, label, description, is_organization) as (values
  ('federation','Fédération','Gestion fédérale',true),
  ('league','Ligue','Gestion de ligue',true),
  ('club','Club','Gestion de club',true),
  ('coach','Coach','Encadrement sportif',false),
  ('fighter','Combattant','Pratique sportive',false),
  ('organizer','Organisateur','Organisation événementielle',true),
  ('referee','Arbitre','Officiel arbitre',false),
  ('judge','Juge','Officiel juge',false),
  ('sponsor','Sponsor','Partenaire ou sponsor',true),
  ('seller','Vendeur','Vendeur Marketplace',true),
  ('fan','Fan','Utilisateur supporter',false)
)
insert into public.roles (slug, label, description, is_organization)
select seed.slug, seed.label, seed.description, seed.is_organization
from role_seed seed
where not exists (select 1 from public.roles existing where existing.slug=seed.slug);

insert into public.marketplace_categories (slug, name, description, sort_order)
values
  ('equipment','Équipement','Équipement sportif',10),
  ('protection','Protection','Protections et sécurité',20),
  ('apparel','Vêtements','Tenues et vêtements',30),
  ('training','Entraînement','Matériel d’entraînement',40),
  ('collectibles','Collection','Objets de collection',50),
  ('services','Services','Services liés aux sports de combat',60)
on conflict (slug) do update set
  name=excluded.name,
  description=excluded.description,
  sort_order=excluded.sort_order;

insert into public.platform_reference_values (domain, code, label, sort_order)
values
  ('notification_type','message','Message',10),
  ('notification_type','fight_proposal','Proposition de combat',20),
  ('notification_type','sponsoring','Sponsoring',30),
  ('notification_type','event','Événement',40),
  ('notification_type','fight_live','Fight Live',50),
  ('notification_type','role','Rôle',60),
  ('notification_type','moderation','Modération',70),
  ('notification_type','marketplace','Marketplace',80),
  ('notification_type','club','Club',90),
  ('notification_type','system','Système',100),
  ('notification_type','security','Sécurité',110),
  ('support_category','account','Compte',10),
  ('support_category','authentication','Authentification',20),
  ('support_category','role','Rôle',30),
  ('support_category','club','Club',40),
  ('support_category','fighter','Combattant',50),
  ('support_category','event','Événement',60),
  ('support_category','fight_live','Fight Live',70),
  ('support_category','marketplace','Marketplace',80),
  ('support_category','payment','Paiement',90),
  ('support_category','messaging','Messagerie',100),
  ('support_category','security','Sécurité',110),
  ('support_category','bug','Bug',120),
  ('support_category','other','Autre',130),
  ('event_category','tournament','Tournoi',10),
  ('event_category','gala','Gala',20),
  ('event_category','championship','Championnat',30),
  ('event_category','camp','Stage',40),
  ('event_category','demonstration','Démonstration',50),
  ('event_category','weigh_in','Pesée',60),
  ('event_category','press_conference','Conférence de presse',70),
  ('payment_type','cash','Espèces',10),
  ('payment_type','mobile_money','Mobile money',20),
  ('payment_type','card','Carte',30),
  ('payment_type','bank_transfer','Virement bancaire',40),
  ('document_type','identity','Identité',10),
  ('document_type','license','Licence',20),
  ('document_type','medical','Médical',30),
  ('document_type','contract','Contrat',40),
  ('document_type','insurance','Assurance',50),
  ('document_type','federation','Fédération',60),
  ('document_type','event','Événement',70),
  ('document_type','sponsor','Sponsor',80),
  ('document_type','organization','Organisation',90),
  ('document_type','other','Autre',100)
on conflict (domain, code) do update set
  label=excluded.label,
  sort_order=excluded.sort_order,
  is_active=true;

commit;
