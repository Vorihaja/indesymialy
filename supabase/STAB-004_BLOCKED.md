# STAB-004 — validation isolée bloquée

Date : 2026-08-05

## Cibles identifiées

- Production interdite : `Indesy_Mialy`, Project Ref `jwox…hyoi`.
- Projet secondaire détecté : `Indesy Mialy 2`, Project Ref `aabk…wqgn`, état `INACTIVE`.
  Il n'a pas été utilisé car l'option B exige une validation utilisateur explicite.
- Branche Git locale : `stab-004-supabase-validation`.

## Résultat des options

1. Preview branch : refus HTTP 402 `entitlement_required`; le plan Pro est requis. Aucune branche créée.
2. Projet secondaire : non utilisé, faute d'autorisation explicite.
3. Supabase local : Docker et Podman absents; aucun conteneur démarré.

Aucun SQL, seed, rollback, policy ou RPC n'a été exécuté. Aucun type staging n'a été généré.

## Reprise manuelle — option A après activation du branching

Les commandes ci-dessous correspondent à Supabase CLI `2.111.0`. Ne jamais réutiliser la référence
de production comme **cible SQL**. La référence de production n'apparaît ici que comme projet parent
de la preview branch.

```powershell
npx supabase branches create stab-004-validation-20260805 `
  --project-ref jwoxjvrsgywmlvbzhyoi `
  --git-branch stab-004-supabase-validation `
  --output-format json

npx supabase branches get stab-004-validation-20260805 `
  --project-ref jwoxjvrsgywmlvbzhyoi `
  --output env
```

Copier `POSTGRES_URL_NON_POOLING` de la preview branch dans une variable temporaire sans la journaliser :

```powershell
$env:STAB004_DB_URL = '<URL_POSTGRES_PERCENT_ENCODED_DE_LA_PREVIEW_BRANCH>'
if ($env:STAB004_DB_URL -match 'jwoxjvrsgywmlvbzhyoi') {
  throw 'STOP: production target detected'
}
```

### Audit avant application

```powershell
npx supabase db query --db-url $env:STAB004_DB_URL "select current_database(), current_user, version();"
npx supabase db query --db-url $env:STAB004_DB_URL "select schemaname, tablename, policyname, roles, cmd, qual, with_check from pg_policies where schemaname='public' order by tablename, policyname;"
npx supabase db query --db-url $env:STAB004_DB_URL "select schemaname, tablename, indexname, indexdef from pg_indexes where schemaname='public' order by tablename, indexname;"
npx supabase db query --db-url $env:STAB004_DB_URL "select conrelid::regclass as table_name, conname, contype, pg_get_constraintdef(oid) from pg_constraint where connamespace='public'::regnamespace order by conrelid::regclass::text, conname;"
```

### Diagnostic critique ticketing

```powershell
npx supabase db query --db-url $env:STAB004_DB_URL "select c.conname, c.conrelid::regclass as source_table, a.attname as source_column, c.confrelid::regclass as target_table, af.attname as target_column from pg_constraint c join unnest(c.conkey) with ordinality ck(attnum, ord) on true join pg_attribute a on a.attrelid=c.conrelid and a.attnum=ck.attnum join unnest(c.confkey) with ordinality fk(attnum, ord) on fk.ord=ck.ord join pg_attribute af on af.attrelid=c.confrelid and af.attnum=fk.attnum where c.contype='f' and c.conrelid='public.ticket_sales'::regclass and a.attname='ticket_type_id';"
npx supabase db query --db-url $env:STAB004_DB_URL "select ts.id, ts.ticket_type_id from public.ticket_sales ts left join public.ticket_types tt on tt.id=ts.ticket_type_id where ts.ticket_type_id is not null and tt.id is null order by ts.id limit 200;"
```

Ne préparer une migration corrective de FK qu'après examen de ces deux résultats et des données orphelines.

### Application contrôlée, fichier par fichier

```powershell
npx supabase db query --db-url $env:STAB004_DB_URL --file supabase/migrations/202608050000_reference_values.sql
npx supabase db query --db-url $env:STAB004_DB_URL --file supabase/migrations/202608050010_identity.sql
npx supabase db query --db-url $env:STAB004_DB_URL --file supabase/migrations/202608050020_communication.sql
npx supabase db query --db-url $env:STAB004_DB_URL --file supabase/migrations/202608050030_marketplace.sql
npx supabase db query --db-url $env:STAB004_DB_URL --file supabase/migrations/202608050040_events.sql
npx supabase db query --db-url $env:STAB004_DB_URL --file supabase/migrations/202608050050_rpc_sync_timer_to_timeline.sql
npx supabase db query --db-url $env:STAB004_DB_URL --file supabase/migrations/202608050051_rpc_update_fight_statistics.sql
npx supabase db query --db-url $env:STAB004_DB_URL --file supabase/migrations/202608050052_rpc_update_fighter_career_stats.sql
npx supabase db query --db-url $env:STAB004_DB_URL --file supabase/policies/000_shared.sql
npx supabase db query --db-url $env:STAB004_DB_URL --file supabase/policies/010_identity.sql
npx supabase db query --db-url $env:STAB004_DB_URL --file supabase/policies/020_communication.sql
npx supabase db query --db-url $env:STAB004_DB_URL --file supabase/policies/030_marketplace.sql
npx supabase db query --db-url $env:STAB004_DB_URL --file supabase/policies/040_events.sql
npx supabase db query --db-url $env:STAB004_DB_URL --file supabase/policies/050_fight_live.sql
```

Après chaque commande, exécuter les requêtes `pg_constraint`, `pg_indexes` et `pg_policies` ciblées
avant de poursuivre.

### Seed idempotent et validation

```powershell
npx supabase db query --db-url $env:STAB004_DB_URL --file supabase/seeds/202608050001_reference_seed.sql
npx supabase db query --db-url $env:STAB004_DB_URL --file supabase/seeds/202608050001_reference_seed.sql
npx supabase db lint --db-url $env:STAB004_DB_URL --schema public --level warning --fail-on error
```

### Types isolés

```powershell
npx supabase gen types --db-url $env:STAB004_DB_URL --schema public --lang typescript > infrastructure/supabase/database.staging.types.ts
npx tsc --noEmit
```

Ne remplacer en aucun cas `infrastructure/supabase/database.types.ts`. Supprimer le fichier staging
seulement après comparaison et rapport final.

## Option B

Le projet secondaire ne peut être utilisé qu'après confirmation explicite de l'utilisateur, vérification
de son Project Ref et restauration **schema-only** du socle existant. Ne jamais appliquer le blueprint à
un projet vide : ses FK dépendent des tables actuelles (`profiles`, `organizations`, `products`, `events`,
`fights`, etc.).
