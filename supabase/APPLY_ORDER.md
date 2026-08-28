# Ordre d'application et rollback

## Ordre sûr

1. `202608050000_reference_values.sql`
2. `202608050010_identity.sql`
3. `202608050020_communication.sql`
4. `202608050030_marketplace.sql`
5. `202608050040_events.sql`
6. RPC Fight Live `050`, `051`, `052`
7. policies : shared, identity, communication, marketplace, events, fight-live
8. `seeds/202608050001_reference_seed.sql`
9. régénération des types Supabase
10. raccordement des repositories encore en mémoire
11. tests runtime et RLS

Chaque étape doit être exécutée dans une transaction sur une branche de base, suivie d'un contrôle
des contraintes, index, grants et policies.

## Rollback

- Référence : supprimer `platform_reference_values` après vérification qu'aucune FK ne la cible.
- Identity : supprimer dans l'ordre affectations, rôles internes, invitations, organisation active,
  préférences, progression, historique/documents/demandes.
- Communication : supprimer historiques, préférences notification, receipts, blocs, préférences conversation.
- Marketplace : supprimer paiements→transactions→livraisons→mouvements→inventaire→locations→historique→
  lignes→commandes→items→paniers→favoris→images→extension produit→catégories.
- Events : supprimer remboursements→réservations→commentaires/livrables→exports→rapports→accès→planning→
  participants→historique→inscriptions→catégories→compétitions.
- RPC : `drop function` avec la signature exacte indiquée dans chaque fichier.
- Policies : supprimer les policies nommées avant de supprimer les tables; conserver RLS activé tant
  que les données subsistent.

Le rollback de tables contenant des données doit être précédé d'un export et d'une validation métier.
Ne jamais utiliser un rollback destructif automatique en production.
