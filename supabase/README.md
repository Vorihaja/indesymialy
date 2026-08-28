# STAB-003 — blueprint Supabase local

Ce dossier est un **plan de migration non appliqué**. Aucun fichier n'a été envoyé à Supabase.

## Contenu

- `migrations/` : tables et RPC, dans l'ordre lexical.
- `policies/` : activation/complément des policies RLS, à appliquer après les tables et RPC.
- `seeds/` : données de référence non sensibles et idempotentes.
- `AUDIT.md` : matrice contrat actuel / besoins persistants.
- `RUNTIME_TEST_MATRIX.md` : scénarios manuels par rôle.
- `APPLY_ORDER.md` : ordre d'application, contrôles et rollback.

## Garde-fous

Avant toute application future :

1. créer une branche de base Supabase et une sauvegarde ;
2. relire le contrat distant et comparer chaque objet (`to_regclass`, catalogues PostgreSQL) ;
3. exécuter les migrations dans une base éphémère ;
4. appliquer ensuite les fichiers `policies/` dans l'ordre documenté ;
5. charger les seeds seulement après validation RLS ;
6. régénérer `infrastructure/supabase/database.types.ts` avec la CLI ;
7. adapter les repositories, puis exécuter les tests runtime.

Ne jamais exécuter `db push` ou `db reset` directement sur la production. Le fichier historique
`role_requests.sql` à la racine est conservé uniquement pour traçabilité : il référence des tables
obsolètes (`user_roles`) et une autorisation par email ; il ne doit pas être exécuté.
