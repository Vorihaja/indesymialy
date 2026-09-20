# ERP-ORG-002 — Audit RLS runtime

Date : 2026-08-06.

## État vérifié

- `npm run supabase:types` a réussi contre le projet `jwoxjvrsgywmlvbzhyoi`.
- Le schéma distant généré ne contient pas encore `competitions`, `event_registrations`, `event_reports`, `event_schedule_items`, `event_access_logs`, `ticket_refunds` et les autres tables de la migration locale `202608050040_events.sql`.
- Les policies de `supabase/policies/040_events.sql` ciblent donc un schéma futur et ne prouvent pas la protection des tables historiques actuellement typées.
- Aucune policy locale n’a été trouvée pour plusieurs tables historiques consommées : `events`, `event_checklists`, `event_sponsors`, `staff_assignments`, `fight_card`, `ticket_types`, `ticket_sales`.
- Aucune policy n’a été créée ou modifiée pendant ERP-ORG-002.

## Défenses applicatives ajoutées

- Toutes les lectures du workspace Organisateur commencent par la résolution authentifiée du profil et de l’organisation.
- `events` est filtré par `events.organizer_id = organizationId`.
- Les tables enfants sont filtrées par les identifiants d’événements autorisés.
- Les mutations Événement ajoutent ou vérifient `organizer_id`.
- La mutation Checklist vérifie d’abord que son `event_id` appartient à l’organisation active.
- La lecture publique Event Core impose désormais `events.status = published`, indépendamment d’une policy distante.
- Les erreurs 42501/403/RLS sont normalisées en `FORBIDDEN` et ne déclenchent aucun fallback mémoire.

## Matrice de tests runtime

| Scénario | Attendu | État |
|---|---|---|
| Propriétaire organisateur | lecture/écriture sur ses événements | À exécuter avec compte réel |
| Membre owner/admin/manager/organizer actif | accès selon policy distante | À exécuter avec compte réel |
| Membre sans rôle autorisé | refus `FORBIDDEN` | À exécuter avec compte réel |
| Événement tiers | aucune ligne et mutation refusée | Filtrage applicatif vérifié ; RLS à tester |
| Lecture publique | uniquement événements `published` | Filtrage applicatif vérifié ; RLS à tester |
| Admin/super_admin | accès selon policy distante | À exécuter avec compte réel |
| Staff affecté | accès limité aux opérations prévues | Bloqué par schéma/policies historiques non documentées |
| Officiel affecté | Fight Live du combat affecté uniquement | RPC locales préparées ; runtime à tester |

## Diagnostic

Les tests RLS authentifiés ne peuvent pas être exécutés sans sessions de test correspondant aux rôles ci-dessus. Le code est prêt pour ces tests, mais le verdict ne peut pas être `READY FOR ORGANIZER RUNTIME TESTS` tant que la couverture RLS distante des tables historiques n’est pas confirmée.
