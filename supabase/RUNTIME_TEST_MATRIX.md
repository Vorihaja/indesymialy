# Matrice de validation runtime par rôle

Préconditions : comptes de test non réels, organisations dédiées, deux utilisateurs sans relation,
un événement publié et un brouillon, un combat publié et un combat actif, un produit publié.

| Rôle | Accès et redirection | Écritures autorisées à tester | Refus/RLS à tester | Realtime et visibilité |
|---|---|---|---|---|
| super_admin | connexion → `/dashboard/super-admin` | examiner/traiter demandes, supervision | aucune élévation depuis client standard | audit complet, notifications système |
| admin | connexion → `/dashboard/admin` | modération et traitement opérationnel | paramètres super-admin interdits | files admin, données privées selon permission |
| federation | workspace fédération | demandes/organisations autorisées | autre fédération refusée | événements et données fédérales autorisées |
| league | workspace ligue | données de sa ligue | autre ligue refusée | mêmes limites organisationnelles |
| club | workspace club | membres/événements liés à son organisation | autre club refusé | données internes non publiques |
| coach | workspace coach | profil et contenus autorisés | données privées d'un autre coach refusées | conversations participantes seulement |
| fighter | workspace combattant | profil, demande rôle, inscription, panier/commande | carte d'un juge et données d'un autre combattant refusées | messages personnels, données médicales non publiques |
| organizer | workspace organisateur | CRUD de ses événements, staff, tickets, Fight Live | événement d'un autre organisateur refusé | timer/actions de ses combats |
| referee | workspace arbitre | incidents/actions sur combats assignés | combat non assigné refusé | flux du combat assigné |
| judge | workspace juge | sa carte et ses scores | carte d'un autre juge refusée | score personnel, résultat publié ensuite |
| sponsor | workspace sponsor | offres et historique propres | offre d'un autre sponsor refusée | notifications d'offre |
| seller | workspace vendeur | ses produits, stock, commandes | produit/commande d'un autre vendeur refusés | commandes de son organisation seulement |
| fan | workspace fan | favoris et commandes propres | données privées d'autrui refusées | contenus et résultats publiés |
| public | routes publiques, aucune session | aucune mutation sensible | brouillons, conversations, commandes, cartes non publiées refusés | événements/produits/combat publiés uniquement |

## Scénarios transversaux obligatoires

Pour chaque rôle authentifié : connexion valide/invalide, workspace attendu, lecture, création,
modification, suppression logique, tentative sur une ressource tierce, session expirée, redirection,
erreur RLS non brute et déconnexion.

### Identity

1. Créer puis reprendre un onboarding; vérifier l'isolation par `profile_id`.
2. Demander un rôle public; joindre un document; vérifier l'historique.
3. Tenter une demande `admin` ou `super_admin`: rejet côté base.
4. Approuver/refuser avec admin autorisé; utilisateur ordinaire refusé.
5. Sélectionner une organisation dont l'utilisateur est membre; autre organisation refusée.

### Communication

1. Deux participants lisent/écrivent dans leur conversation; tiers refusé.
2. Marquer delivered/read et vérifier les compteurs/realtime.
3. Muter/favoriser/supprimer localement sans affecter l'autre participant.
4. Bloquer un profil puis vérifier que les nouvelles interactions sont rejetées par le service.
5. Tester historique de proposition et d'offre, visible seulement aux participants concernés.

### Events et Clubs

1. Organisateur crée/modifie son événement; autre organisateur refusé.
2. Fighter/club dépose une inscription et lit son historique; autre candidat refusé.
3. Staff confirmé lit sa mission sans accéder aux finances.
4. Réserver, vendre, scanner puis tenter un second scan; journal d'accès vérifié.
5. Données brouillon privées; fiche/programme/résultat publié lisibles publiquement.

### Marketplace

1. Seller crée l'extension d'un produit appartenant à son organisation.
2. Client gère son panier, crée une commande et lit uniquement ses commandes.
3. Seller lit et traite uniquement les commandes de son organisation.
4. Réservation de stock concurrente: aucun stock disponible négatif.
5. Livraison, location, paiement et remboursement suivent les transitions autorisées.
6. Public lit uniquement les produits `published`; brouillons invisibles.

### Fight Live et Fighters

1. Organisateur lance/pause/reprend un combat lui appartenant.
2. Arbitre assigné écrit une action; arbitre non assigné refusé.
3. Juge écrit/soumet sa carte; modification post-verrouillage refusée.
4. RPC timer rejouée deux fois: aucune duplication de timeline.
5. Recalcul combat puis carrière: valeurs idempotentes et cohérentes.
6. Public ne voit que le combat/résultat publié; statistiques privées masquées avant publication.
