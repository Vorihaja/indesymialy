# ERP-ORG-002 — Matrice de raccordement Supabase

Date d’audit : 2026-08-06. Source unique : `infrastructure/supabase/database.types.ts`.

## Règles de lecture

- **Connecté** : lecture fiable possible avec le contrat actuel et un filtre organisation/événement explicite.
- **Partiel** : seule une partie de la capacité possède un stockage fidèle.
- **Mémoire** : aucun stockage compatible ; le template reste isolé dans le repository mémoire.
- Aucun fallback mémoire ne doit être déclenché après une erreur Supabase.

## Inventaire critique du schéma

| Domaine | Tables utilisables | Limite contractuelle |
|---|---|---|
| Contexte | `profiles`, `organizations`, `organization_members`, `profile_roles`, `roles`, `role_permissions`, `permissions` | aucun champ d’organisation active persisté |
| Événements | `events`, `status_history` | aucune date d’événement, capacité, discipline, ville ou budget ; `status_history` sans FK déclarée |
| Sport | `fight_card`, `fights`, `fighters`, `clubs` | `fight_card` et `fights` se recouvrent ; aucun modèle de remplacement |
| Officiels | `referees`, `fight_officials`, `fight_official_assignments` | `fight_officials.official_id` n’a pas de FK déclarée |
| Staff | `staff_assignments` | pas de profil, disponibilité, check-in, paiement ou document |
| Checklist | `event_checklists` | pas de catégorie, assignation, échéance ou priorité graduée |
| Billetterie | `ticket_types`, `tickets`, `ticket_sales` | capacité événement absente ; relation `ticket_sales.ticket_type_id` à ne pas modifier |
| Sponsors | `sponsors`, `event_sponsors` | pas de statut ni livrables ; montant/visibilité disponibles |
| Finance | `transactions`, `club_transactions`, `ticket_sales`, `event_sponsors`, `contracts` | transactions liées à l’organisation, jamais à l’événement ; contrats sans FK métier |
| Communication | `conversations`, `messages` | réutilisation obligatoire de `communication-core` |
| Fight Live | `fights`, `fight_scores`, `fight_statistics`, `fight_incidents` | aucune table de session Fight Live dédiée |

## Matrice des 100 capacités

| # | Destination / capacité | Table, colonnes et relation | Raccordement | Mémoire maintenue | Table future nécessaire |
|---:|---|---|---|---|---|
| 1 | Compétitions — création/duplication | `events(id,title,venue,status,organizer_id)` → organisation | Partiel : création oui, duplication des seules colonnes persistées | format et métadonnées | extension `events` |
| 2 | Compétitions — formats gala/tournoi/championnat | aucune colonne | Non | Oui | `competitions` ou `events.format` |
| 3 | Compétitions — règlements/timeline | `status_history(entity_id,entity_type,old_status,new_status,reason)` sans FK | Partiel, historique lisible avec filtre conventionnel | règlement/timeline détaillée | `competition_rules`, `event_timeline` |
| 4 | Compétitions — publication/report/archivage | `events.status,archived_at,cancellation_reason,updated_at` | Connecté sauf date de report | date reportée | `events.scheduled_at`, `events.postponed_to` |
| 5 | Fight Cards — ordre Drag & Drop | `fight_card(event_id,fight_order)` | Connecté | Non | Non |
| 6 | Fight Cards — Main/Co-Main | `fight_card.tag` | Connecté | Non | Non |
| 7 | Fight Cards — préliminaires/remplacements | `fight_card.tag,fighter_a_id,fighter_b_id`; aucune trace de remplacement | Partiel | historique remplacement | `fight_replacements` |
| 8 | Fight Cards — pesée/statut/Fight Live | `fight_card.is_confirmed`; `fights.status,id` | Partiel | pesée | `weigh_ins` |
| 9 | Combats — programmation | `fights(event_id,fight_order,discipline_id,weight_category,scheduled_rounds)` | Connecté | horaire exact absent | `fights.scheduled_at` |
| 10 | Combats — validation opposition | `fights(fighter_red_id,fighter_blue_id,status)` | Connecté | Non | Non |
| 11 | Combats — statut/remplacement/annulation | `fights.status,cancellation_reason,archived_at` | Partiel | remplacement | `fight_replacements` |
| 12 | Combats — synchronisation Fight Live | `fights.id,status`; routes Fight Live existantes | Connecté par identifiant réel | Non | Non |
| 13 | Combattants — invitations/validation | `fighters.status`; aucune invitation événement | Partiel consultation | invitations | `event_fighter_invitations` |
| 14 | Combattants — licence/poids | `fighters.current_weight_kg,weight_class`; licence absente | Partiel | licence | `fighter_licenses` ou lien existant dédié |
| 15 | Combattants — certificat médical/contrat | `fighters.last_medical_check,medical_clearance_expiry`; `contracts` sans FK | Partiel médical uniquement | contrat lié | FK métier sur `contracts` |
| 16 | Combattants — historique/disponibilités | `fights` permet historique ; disponibilité absente | Partiel | disponibilité | `fighter_availability` |
| 17 | Clubs — délégations engagées | `clubs(organization_id,profile_id)` ; aucune inscription événement | Consultation seulement | délégation | `event_club_registrations` |
| 18 | Clubs — responsables | `clubs.profile_id` → `profiles.id` par contrat applicatif | Connecté en lecture | Non | FK déclarée souhaitable |
| 19 | Clubs — documents/accréditations | aucune table compatible | Non | Oui | `event_accreditations`, `organization_documents` |
| 20 | Clubs — historique participation | `fighters`/`fights` sans lien club dans `fighters` | Non fiable | Oui | `fighter_club_memberships` |
| 21 | Inscriptions — dossiers entrants | aucune table d’inscription événement dans le périmètre | Non | Oui | `event_registrations` |
| 22 | Inscriptions — contrôle pièces | aucune | Non | Oui | `event_registration_documents` |
| 23 | Inscriptions — éligibilité | poids/médical dans `fighters`, sans dossier | Partiel lecture | décision | `event_registrations` |
| 24 | Inscriptions — acceptation/liste d’attente | aucune | Non | Oui | `event_registrations.status` |
| 25 | Catégories — divisions de poids | `fights.weight_category` | Partiel, valeurs existantes | catalogue | `competition_categories` |
| 26 | Catégories — classes d’âge | `fighters.date_of_birth`, aucune classe | Calcul ponctuel non persisté | Oui | `competition_categories.age_*` |
| 27 | Catégories — disciplines/règles | `fights.discipline_id`; tables disciplines hors liste | Partiel | règles compétition | `competition_rules` |
| 28 | Catégories — quotas/éligibilité | aucune | Non | Oui | `competition_categories` |
| 29 | Pesée — planning de passage | aucune table | Non | Oui | `weigh_ins` |
| 30 | Pesée — saisie poids | `fighters.current_weight_kg` est poids courant, pas poids événement | Non, sens incompatible | Oui | `weigh_ins.measured_weight_kg` |
| 31 | Pesée — tolérances/alertes | aucune | Non | Oui | `weigh_in_rules` |
| 32 | Pesée — décisions officielles | aucune | Non | Oui | `weigh_in_decisions` |
| 33 | Billetterie — plan de salle/tarifs | `ticket_types(event_id,name,price,color_hex)` ; plan absent | Partiel tarifs | plan de salle | `venue_seats`, `ticket_zones` |
| 34 | Billetterie — coupons/quotas | `ticket_types.total_quantity,sold_quantity`; coupons absents | Partiel quotas | coupons | `ticket_coupons` |
| 35 | Billetterie — QR/contrôle accès | `tickets.id,event_id,buyer_name,ticket_type`; QR/check-in absents | Partiel identification | QR et scans | `ticket_access_scans` |
| 36 | Billetterie — statistiques/remboursements | `ticket_sales(quantity,total_amount,payment_status)` ; remboursement absent | Partiel statistiques | remboursement | `ticket_refunds` |
| 37 | Sponsors — prospection/pipeline | `sponsors` ne stocke que le référentiel | Non | Oui | `sponsor_pipeline` |
| 38 | Sponsors — contrats/paiements | `event_sponsors(amount,contract_start,contract_end)` ; paiement absent | Partiel contrat | paiement | `sponsor_payments` |
| 39 | Sponsors — livrables/visibilité | `event_sponsors.visibility_score`; livrables absents | Partiel visibilité | livrables | `sponsor_deliverables` |
| 40 | Sponsors — historique | `event_sponsors` par sponsor/événement | Connecté en lecture | historique commercial détaillé | `sponsor_activity` |
| 41 | Partenaires — fournisseurs/institutions | `organizations(type,...)`, sans lien événement partenaire | Consultation seulement | affectation | `event_partners` |
| 42 | Partenaires — diffuseurs/médias | aucune qualification compatible | Non | Oui | `event_media_partners` |
| 43 | Partenaires — engagements contractuels | `contracts` sans organisation/event FK | Non fiable | Oui | FK sur `contracts` ou `event_partner_contracts` |
| 44 | Partenaires — contacts opérationnels | `organizations(email,phone,website)` | Connecté en lecture | contact événement | `event_partner_contacts` |
| 45 | Officiels — affectations/confirmations | `fight_official_assignments(fight_id,user_id,role,status)` | Connecté | Non | Non |
| 46 | Officiels — documents | aucune table liée | Non | Oui | `official_documents` |
| 47 | Officiels — rémunérations | aucune colonne | Non | Oui | `official_payments` |
| 48 | Officiels — historique missions | `fight_official_assignments.assigned_at` + combats | Connecté | Non | Non |
| 49 | Arbitres — disponibilités | `referees.is_active` n’est pas une disponibilité événement | Non | Oui | `official_availability` |
| 50 | Arbitres — désignation combat | `fights.referee_id` et `fight_official_assignments` | Connecté | Non | Non |
| 51 | Arbitres — rotations/pauses | ordre combats disponible, rotations absentes | Partiel calcul | pauses | `official_shifts` |
| 52 | Arbitres — rapports | `fight_incidents` couvre incidents, pas rapport arbitre | Partiel | rapport | `official_reports` |
| 53 | Juges — tables de jugement | `fight_official_assignments.position,role` | Connecté | Non | Non |
| 54 | Juges — affectations combat | `fight_official_assignments.fight_id,user_id` | Connecté | Non | Non |
| 55 | Juges — confirmations | `fight_official_assignments.status` | Connecté | Non | Non |
| 56 | Juges — scoring | moteur existant `fight_scores`/cartes de juges | Lien vers Fight Live, sans reconstruction | Non | Non |
| 57 | Staff — planning/disponibilités | `staff_assignments.assigned_at`; disponibilité absente | Partiel planning | disponibilité | `staff_availability` |
| 58 | Staff — missions/zones | `staff_assignments.role`; zone absente | Partiel mission | zone/détail | extension `staff_assignments` |
| 59 | Staff — check-in/présence | `staff_assignments.status` non suffisamment défini | Non fiable | Oui | `staff_checkins` |
| 60 | Staff — paiements | aucune colonne | Non | Oui | `staff_payments` |
| 61 | Bénévoles — recrutement/validation | `staff_assignments.role,status` peut identifier un bénévole par convention | Partiel | dossier recrutement | `volunteer_applications` |
| 62 | Bénévoles — créneaux/postes | `assigned_at,role` | Partiel | fin de créneau/poste | `volunteer_shifts` |
| 63 | Bénévoles — responsables zone | aucune colonne | Non | Oui | `volunteer_shifts.supervisor_id` |
| 64 | Bénévoles — présence/attestations | aucune | Non | Oui | `staff_checkins`, `volunteer_certificates` |
| 65 | Planning — jalons production | aucune table dédiée | Non | Oui | `event_schedule_items` |
| 66 | Planning — run of show | ordre combats seulement | Partiel sportif | Oui | `event_run_of_show` |
| 67 | Planning — créneaux équipes | `staff_assignments.assigned_at` seulement | Partiel | durée/créneaux | `staff_shifts` |
| 68 | Planning — dépendances | aucune | Non | Oui | `event_schedule_dependencies` |
| 69 | Checklists — 124 tâches modèles | templates mémoire ; `event_checklists` pour instances | Hybride explicite | modèles Oui | Non pour état minimal |
| 70 | Checklists — 12 catégories | aucune colonne catégorie | Non persistable | Oui | `event_checklists.category` |
| 71 | Checklists — priorités critiques | `event_checklists.critical_blocking` | Connecté binaire | priorité graduée | `event_checklists.priority` |
| 72 | Checklists — progression | `is_completed` agrégé par `event_id` | Connecté | Non | Non |
| 73 | Budget — budget initial | aucune table événement ; `transactions` organisation seulement | Non fiable | Oui | `event_budgets` |
| 74 | Budget — engagé/réalisé | `transactions` sans `event_id` | Non, ne pas détourner | Oui | `event_transactions` |
| 75 | Budget — écarts/prévisions | aucune | Non | Oui | `event_budget_forecasts` |
| 76 | Budget — clôture événement | aucune | Non | Oui | `event_budgets.closed_at` |
| 77 | Marketplace événement — catalogue | `products(seller_id,name,price,stock)` lié organisation vendeur, pas événement | Consultation organisation seulement | sélection événement | `event_products` |
| 78 | Marketplace — vente/location/occasion | aucune colonne de mode | Non | Oui | `products.listing_type` |
| 79 | Marketplace — stocks/vendeurs | `products.stock,seller_id` → organisation | Connecté en lecture | Non | Non |
| 80 | Marketplace — points de vente | aucune | Non | Oui | `event_sales_points` |
| 81 | Communication — calendrier éditorial | aucune table dédiée | Non | Oui | `communication_campaigns` |
| 82 | Communication — presse/accréditations | aucune | Non | Oui | `press_accreditations` |
| 83 | Communication — campagnes/annonces | conversations/messages ne correspondent pas à une campagne | Non, ne pas détourner | Oui | `communication_campaigns` |
| 84 | Communication — contenus partenaires | aucune | Non | Oui | `partner_content_deliveries` |
| 85 | Résultats — décisions officielles | `fights(winner_id,method,ending_round,ending_time,status)` | Connecté | Non | Non |
| 86 | Résultats — palmarès/classements | combats + combattants ; classement séparé hors périmètre | Partiel palmarès | publication classement | relation classement dédiée |
| 87 | Résultats — validation post-combat | `fights.status,updated_at` | Connecté par statut | signataire absent | `fight_result_approvals` |
| 88 | Résultats — publication | `fights.status`; `fight_results` est un référentiel de méthodes | Partiel | date/publication explicite | `fights.published_at` |
| 89 | Rapports — financier/billetterie | agrégats `ticket_sales`, `event_sponsors`; dépenses non liées événement | Partiel | dépenses événement | `event_transactions` |
| 90 | Rapports — sportif/Fight Live | `fights`, `fight_statistics`, scores | Connecté en lecture | Non | Non |
| 91 | Rapports — incidents/médical | `fight_incidents`; aucune table médicale événement | Partiel incidents | médical | `event_medical_reports` |
| 92 | Rapports — sponsors/officiels | `event_sponsors`, `fight_official_assignments` | Connecté en lecture | commentaires/signature | `event_reports` |
| 93 | Statistiques — audience/remplissage | remplissage via ventes/quota ; audience absente | Partiel remplissage | audience | `event_audience_metrics` |
| 94 | Statistiques — revenus/conversion | `ticket_sales.total_amount,quantity`; visiteurs absents | Partiel revenus | conversion | `event_traffic_metrics` |
| 95 | Statistiques — performance sportive | `fight_statistics` | Connecté | Non | Non |
| 96 | Statistiques — efficacité opérationnelle | checklist/staff agrégables ; temps/qualité absents | Partiel | indicateurs avancés | `event_operational_metrics` |
| 97 | Paramètres — identité organisateur | `organizations(name,logo_url,description,email,phone,website)` | Connecté | Non | Non |
| 98 | Paramètres — préférences production | aucune table | Non | Oui | `organizer_settings` |
| 99 | Paramètres — règles/notifications | rôles/permissions lisibles ; préférences événement absentes | Partiel permissions | préférences | `organizer_notification_settings` |
| 100 | Paramètres — configuration accès | `organization_members(role,status)` et permissions de rôle | Partiel | permissions événement fines | `event_access_roles` |

## Sources prévues pour les KPI

| KPI | Source SQL contractuelle | Verdict |
|---|---|---|
| Événements aujourd’hui / à venir | `events` filtré par `organizer_id` | Non connecté : aucune date événement |
| Combats programmés | `fights.event_id IN (événements organisation)` et statut | Connectable |
| Billets vendus | somme `ticket_sales.quantity` par événements | Connectable |
| Chiffre d’affaires | somme `ticket_sales.total_amount` pour statuts payés compatibles | Connectable |
| Taux de remplissage | ventes / somme `ticket_types.total_quantity` | Connectable |
| Sponsors | compte `event_sponsors` par événements | Connectable |
| Staff confirmé | `staff_assignments.status = confirmed` par événements | Connectable |
| Officiels confirmés | affectations via combats des événements | Connectable |
| Paiements en attente | `ticket_sales.payment_status` ne représente pas les dettes organisateur | Non fiable, non connecté |
| Tâches critiques | `event_checklists.critical_blocking = true AND is_completed != true` | Connectable |
| Fight Live disponible | combat existant et données Fight Live/statistiques présentes | Partiel, sans session dédiée |
| Activité récente | `status_history`, événements/fights/checklists mis à jour | Partiel |

## Résolution de contexte retenue

1. `supabase.auth.getUser()` fournit `user.id`.
2. `profiles.id = user.id` fournit `profileId`.
3. Charger les organisations possédées (`organizations.owner_id = profileId`) et les adhésions actives (`organization_members.profile_id = profileId`).
4. Conserver uniquement `organizations.type = organizer` et un statut non suspendu.
5. Choisir de façon déterministe : organisation possédée active, sinon adhésion active la plus ancienne. Aucun identifiant codé en dur.
6. Charger rôles et permissions via `profile_roles → roles → role_permissions → permissions`.
7. `activeEventId` : premier événement non archivé de l’organisation, ordonné par `updated_at`, car aucune date métier n’existe.

## Diagnostic RLS à exécuter au runtime

Le schéma typé ne permet pas de prouver les policies actives. Les scénarios propriétaire, membre autorisé, tiers refusé, public, admin/super_admin, staff et officiel doivent être exécutés avec des sessions réelles. Toute erreur `42501`, HTTP 403 ou message RLS est remontée `FORBIDDEN`, sans fallback mémoire.
