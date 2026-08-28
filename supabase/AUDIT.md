# Matrice de raccordement STAB-003

Contrat analysé : `infrastructure/supabase/database.types.ts` régénéré durant STAB-002.

| Fonction | Module | Couverture actuelle | Besoin manquant / relation | Priorité | Proposition |
|---|---|---|---|---:|---|
| Demandes de rôle | identity-core / role-requests | `roles`, `profiles`, `profile_roles` existent | demande, documents, historique | P1 | `role_requests`, `role_request_documents`, `role_request_history` |
| Progression onboarding | identity-core / onboarding | aucune table | 1:1 `profiles` | P1 | `onboarding_progress` |
| Préférences compte | identity-core / account | aucune table | 1:1 `profiles` | P1 | `account_preferences` |
| Organisation active | identity-core / organizations | organisations et membres existent | 1:1 profil, FK organisation, adhésion vérifiée | P1 | `active_organizations` |
| Sessions | identity-core / security | sessions gérées par Supabase Auth | métadonnées client non indispensables | P3 | ne pas dupliquer `auth.sessions`; arbitrage ultérieur |
| Invitations organisation | organizations | aucune table | organisation, invité, rôle, émetteur | P2 | `organization_invitations` |
| Rôles internes | organizations | `organization_members.role` texte seulement | rôles configurables + affectations | P2 | `organization_internal_roles`, `organization_internal_role_assignments` |
| Préférences conversation | communication-core | `conversation_participants.is_muted/last_read_at` couvre mute/lecture | favori, archivage/suppression locale | P1 | `conversation_user_preferences` |
| Blocage utilisateur | communication-core | absent | bloqueur/bloqué vers `profiles` | P1 | `communication_blocks` |
| Livraison message | communication-core | `message_reads` couvre lecture | sent/delivered/read par destinataire | P1 | `message_delivery_receipts` |
| Préférences notification | notifications | absent | 1:1 profil, catégories/horaires | P1 | `notification_preferences` |
| Historique propositions | fight-proposals | `fight_proposals` existe | journal immuable | P2 | `fight_proposal_history` |
| Historique sponsoring | sponsor-offers | `sponsor_offers` existe | journal immuable | P2 | `sponsor_offer_history` |
| Produit enrichi | marketplace-core | `products(id,name,price,seller_id,stock)`, vendeur→organisation | détails vente/location sans casser le catalogue existant | P1 | extension 1:1 `marketplace_products(product_id→products.id)` |
| Catégories/images/favoris | marketplace | absent | produit, profil, catégorie | P1 | tables dédiées Marketplace |
| Panier et commandes | marketplace | absent | client profil, vendeur organisation, lignes→products | P1 | carts/items, orders/lines/history |
| Location/stock/livraison | marketplace | absent | produit/commande | P1 | rentals, inventory, movements, deliveries |
| Paiement Marketplace | marketplace | `transactions` est comptable et ne convient pas | ordre, paiement, remboursement | P1 | `marketplace_transactions`, `marketplace_payments` |
| Compétitions | event-core | `events` existe | compétition et catégories | P1 | `competitions`, `competition_categories` |
| Inscriptions/participants | event-core | absent | event, profil ou organisation | P1 | registrations/history/participants |
| Planning et accès | event-core | billets existants, pas de planning/log d'accès | event/ticket/opérateur | P1 | schedule items, access logs |
| Rapports | event-core | absent | event, auteur, exports | P2 | reports/exports |
| Sponsors/checklists enrichis | event-core | `event_sponsors`, `event_checklists` existent | livrables/commentaires | P2 | tables filles |
| Réservations/remboursements | ticketing | `ticket_types`, `tickets`, `ticket_sales` existent | réservation et remboursement | P1 | tables filles dédiées |
| Résultat Fight Live | fight-live | `fight_decisions` + champs `fights` couvrent le résultat; `fight_results` est référentiel | aucune nouvelle table | P1 | réutiliser l'existant |
| Historique/publication Fight Live | fight-live | `fight_event_log`, `fight_events_timeline`, statut `fights` | aucune nouvelle table | P1 | réutiliser l'existant |
| Synchronisation timer | fight-live | tables présentes, RPC absente | timer→timeline avec contrôle d'accès | P1 | RPC séparée |
| Calcul statistiques combat | fight-live | `fight_statistics`, actions/scores/pénalités présents | recalcul transactionnel | P1 | RPC séparée |
| Calcul carrière | fighters | `fighter_career_stats`, `fights` présents | recalcul transactionnel | P1 | RPC séparée |
| Valeurs de référence | transversal | rôles et plusieurs référentiels existent, d'autres non | notifications, support, événements, paiements, documents | P2 | `platform_reference_values` + seed |

## Décision Marketplace

`products` reste la racine canonique afin de préserver les repositories et FK existants. La table
`marketplace_products` est une extension 1:1 par `product_id`; elle ne duplique ni le nom, ni le prix
de vente, ni le stock, ni le vendeur. Les domaines Marketplace spécialisés référencent toujours
`products.id`. Cette stratégie évite une migration destructive et permet un raccordement progressif.

## Conflits ou incohérences du contrat actuel

- `fight_results` contient des codes/libellés et n'est pas un résultat par combat.
- `ticket_sales.ticket_type_id` est déclaré lié à `tickets.id` dans le contrat, malgré son nom ; les
  nouvelles réservations ciblent donc explicitement `ticket_types.id`, sans modifier l'existant.
- `conversation_participants.user_id` ne possède pas de FK générée vers `profiles`; les nouvelles
  tables utilisent une FK explicite.
- Le SQL historique `supabase/role_requests.sql` dépend de `user_roles` absent et autorise un admin
  par adresse email. Il est remplacé par le blueprint Identity et ses policies fondées sur les rôles système.

## Audit RLS et index existants

Le type généré expose tables, colonnes, PK logiques et FK, mais pas `pg_policies`, `pg_indexes`,
les contraintes uniques ni les grants. Une requête de lecture seule via `supabase db query --linked`
a été tentée; la CLI s'est arrêtée localement avec `LegacyProjectNotLinkedError` avant toute connexion.
Par conséquent :

- les policies et index des **nouvelles** tables sont intégralement préparés dans ce dossier ;
- les policies distantes des tables existantes ne sont ni supposées ni remplacées ;
- l'audit `pg_policies`, `pg_indexes`, `pg_constraint` et des grants est un prérequis bloquant sur
  une branche Supabase correctement liée avant application ;
- aucune policy `USING (true)` ou `WITH CHECK (true)` n'existe dans le blueprint.
