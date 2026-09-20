# ERP-ORG-003 — Audit et décisions de schéma

## Portée et sources

Ce document constitue la phase 1 et la phase 2 du blueprint. Il a été établi avant les migrations ERP-ORG-003 à partir de la matrice ERP-ORG-002, de l'audit RLS, du contrat `database.types.ts`, des migrations et policies STAB-003 et des modules métier concernés.

Le schéma distant n'est pas modifié. Les objets STAB-003 sont considérés comme des prérequis locaux, même lorsqu'ils ne figurent pas encore dans le type généré distant.

## Décisions anti-duplication STAB-003

| Besoin | Objet déjà prévu | Décision ERP-ORG-003 |
|---|---|---|
| Inscriptions combattant/club | `event_registrations`, avec candidat profil ou organisation | Étendre cette table; ne pas créer `event_club_registrations` séparée. |
| Validation, attente et historique d'inscription | `event_registrations.status`, `event_registration_history` | Réutiliser sans nouvelle table. |
| Documents d'inscription | `document_paths`, licence et certificat médical | Réutiliser; ajouter seulement les champs de décision et d'éligibilité. |
| Planning | `event_schedule_items` | Étendre avec ordre, responsable et statut; ne pas créer de run-of-show concurrent. |
| Scans d'accès | `event_access_logs` | Cet objet est la table officielle de scans; ne pas créer `ticket_access_scans`. |
| Remboursements | `ticket_refunds` | Étendre avec montant traité et date de traitement; ne pas recréer la table. |
| Livrables sponsor | `event_sponsor_deliverables` | Étendre avec valeur, preuve et livraison; ne pas créer `sponsor_deliverables`. |
| Organisation active | `active_organizations` | Réutiliser sans table concurrente. |
| Rôles internes | `organization_internal_roles` et affectations | Réutiliser pour les permissions internes; l'accès événementiel les référence. |
| Rapports événement | `event_reports`, `event_report_exports` | Réutiliser; aucune table de rapport ERP parallèle. |

## Audit des besoins et modèle retenu

| Domaine | Couverture existante | Manque confirmé | Décision et justification |
|---|---|---|---|
| Événements | `events` possède identité, organisateur, statut, lieu, annulation et archivage | dates métier, capacité, visibilité, publication, report, fuseau; budget événementiel; historique FK | Extension contrôlée de `events`. `event_budgets` porte le budget, car il possède son propre cycle de vie. `event_lifecycle_history` remplace l'usage ambigu de `status_history` sans FK. |
| Inscriptions | STAB-003 couvre profil ou organisation, catégorie, pièces, paiement, validation, attente et historique | décision structurée, évaluateur, date, motif, éligibilité | Extension de `event_registrations`; aucune table club distincte. |
| Pesée | Aucun stockage événementiel compatible | passages, poids mesuré, catégorie, conformité, seconde pesée, validation et historique | Nouvelles tables `weigh_ins` et `weigh_in_history`, cycle de vie autonome et audit requis. |
| Fight card | `fight_card`, `fights` couvrent ordre, coins et statut | remplacement traçable rouge/bleu, motif, ancien/nouveau combattant | Nouvelle table `fight_replacements`, liée au combat et aux combattants. |
| Staff | `staff_assignments` ne contient pas de profil, zone, disponibilité ou confirmation fiable | identité, disponibilité, confirmation, créneau, check-in et paiement | Extension de `staff_assignments`; nouvelles tables `staff_checkins` et `staff_payments`. |
| Officiels | Affectations de combat existantes | disponibilité événementielle, rémunération et état de paiement | `official_availability` et `official_payments`; les affectations existantes restent la source sportive. |
| Finances | Tables organisationnelles sans relation événement | budget, lignes, recettes/dépenses, prévisions, engagements, paiements, catégories et audit | `event_budgets`, `event_budget_lines`, `event_transactions`; ne pas détourner `transactions` ou `club_transactions`. |
| Sponsors | `sponsors`, `event_sponsors`, livrables STAB-003 | pipeline commercial, échéances, valeur, activité de livraison | `sponsor_pipeline`; extension de `event_sponsor_deliverables`. Les encaissements sponsor passent par `event_transactions`, pas une troisième table de paiement. |
| Planning | `event_schedule_items` couvre type, dates, lieu et visibilité | ordre de diffusion, responsable, statut opérationnel | Extension de la table STAB-003. |
| Billetterie | types, billets, ventes; réservations, accès et remboursements STAB-003 | détails de traitement du remboursement; cohérence capacité/vente | Extension de `ticket_refunds`; index et fonctions de contrôle. `event_access_logs` reste le journal de contrôle. La relation suspecte `ticket_sales.ticket_type_id` n'est pas modifiée. |
| Configuration | préférences de compte, organisation active et rôles internes STAB-003 | préférences organisateur, réglages d'accès événement et délégation interne | `organizer_preferences`, `event_access_settings`, `event_internal_role_grants`. Les grants référencent les rôles internes existants. |

## Règles de modélisation

- Toutes les nouvelles entités ont une clé UUID, des timestamps UTC, des FK explicites, des contraintes `CHECK` et les index des parcours ERP.
- Les montants sont en `numeric(14,2)` et portent un code devise ISO sur trois lettres; aucune valeur financière n'est inférée d'une table au sens métier différent.
- Les statuts sont fermés par contrainte. Les référentiels éditables sont stockés dans `platform_reference_values` après extension contrôlée de ses domaines.
- Les documents restent des chemins de stockage, jamais des données binaires ou sensibles dans les seeds.
- Les suppressions en cascade sont réservées aux ressources strictement dépendantes d'un événement. Les historiques financiers et paiements utilisent `restrict` ou `set null` pour préserver l'audit.
- Les policies n'utilisent ni `USING (true)`, ni email codé en dur, ni `service_role` navigateur.

## Dépendances et ordre

ERP-ORG-003 dépend de STAB-003 `000`, `010` et `040`, puis s'applique dans l'ordre `100` à `200`, avant `policies/060_organizer_operations.sql` et le seed organisateur. Les types Supabase ne seront régénérés qu'après application future sur une branche de base, hors de cette mission.

## Stratégie de migration des données existantes

1. Déployer d'abord les colonnes nouvelles nullables ou avec valeur par défaut neutre.
2. Renseigner `events.starts_at` depuis une source métier vérifiée; ne jamais dériver une date depuis `created_at`.
3. Associer `staff_assignments.profile_id` uniquement après rapprochement déterministe; conserver `staff_name` et `phone` tant que l'identité n'est pas prouvée.
4. Importer les budgets mémoire dans un budget `draft`, puis ses lignes, avec rapprochement manuel du total.
5. Importer les remplacements, pesées, paiements et check-ins seulement si la source possède auteur et date; sinon les laisser non migrés et documenter l'écart.
6. Mapper les scans historiques vers `event_access_logs`, jamais vers une nouvelle table.
7. Vérifier doublons, sommes, FK et accès RLS sur une branche avant toute bascule applicative.
8. Conserver un export préalable. Les commentaires de rollback sont des procédures manuelles, non des scripts destructifs automatiques.
