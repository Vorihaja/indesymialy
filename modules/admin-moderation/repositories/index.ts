import type { AdminDomainData } from "@/modules/admin-core";
import { storageNotImplemented } from "@/shared/errors/backend-error";

import type { AdminModerationDomain } from "../types";

const capabilities: Record<AdminModerationDomain, string> = {
  moderation:
    "lecture globale Admin de la file de modération",
  social:
    "lecture globale Admin des signalements Korana",
  marketplace:
    "lecture globale Admin de la modération Marketplace",
};

export class AdminModerationRepository {
  list(
    domain: AdminModerationDomain,
  ): Promise<AdminDomainData> {
    /*
     * Les autorités persistantes existent, mais la RLS/API actuelle
     * ne fournit pas encore de lecture globale destinée à l'Admin.
     *
     * Un SELECT client direct serait partiel :
     * - Korana reports : visibilité du reporter ;
     * - Korana moderation actions : aucune autorité SELECT Admin ;
     * - Marketplace : données limitées aux parties / vendeurs /
     *   données publiquement visibles.
     *
     * Retourner [] serait mensonger et réutiliser la mémoire
     * réintroduirait des données fictives.
     */
    return Promise.reject(
      storageNotImplemented(
        capabilities[domain],
      ),
    );
  }
}