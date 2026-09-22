import type { AdminDomainData } from "@/modules/admin-core";
import { storageNotImplemented } from "@/shared/errors/backend-error";

import type { AdminAnalyticsDomain } from "../types";

export class AdminAnalyticsRepository {
  list(
    domain: AdminAnalyticsDomain,
  ): Promise<AdminDomainData> {
    if (domain !== "analytics") {
      return Promise.reject(
        storageNotImplemented(
          "Analytics administratives",
        ),
      );
    }

    /*
     * admin.analytics.view et admin.analytics.export existent
     * dans le catalogue de permissions, mais aucune autorité
     * persistante générique Admin n'est actuellement exposée.
     *
     * Les RPC super_admin_* appartiennent au Control Center
     * VH-TECK et exigent is_super_admin(). Elles ne doivent
     * jamais être utilisées comme autorité d'un Admin ordinaire.
     *
     * Les agrégations directes côté client seraient également
     * trompeuses lorsque la RLS ne garantit pas une vue globale.
     *
     * Tant qu'une API/RPC dédiée à admin.analytics.view
     * n'existe pas, l'état correct est explicitement indisponible.
     */
    return Promise.reject(
      storageNotImplemented(
        "lecture des Analytics administratives",
      ),
    );
  }
}