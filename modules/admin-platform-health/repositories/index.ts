import type { AdminDomainData } from "@/modules/admin-core";
import { storageNotImplemented } from "@/shared/errors/backend-error";

import type { AdminPlatformHealthDomain } from "../types";

export class AdminPlatformHealthRepository {
  list(
    domain: AdminPlatformHealthDomain,
  ): Promise<AdminDomainData> {
    if (
      domain !==
      "platform-health"
    ) {
      return Promise.reject(
        storageNotImplemented(
          "santé de la plateforme Admin",
        ),
      );
    }

    /*
     * Les résultats locaux TypeScript, ESLint et Build
     * ne constituent pas une télémétrie runtime persistante.
     *
     * Les vraies autorités système, uptime, Auth et Realtime
     * actuellement disponibles appartiennent au Control Center
     * Super Admin et exigent is_super_admin().
     *
     * Aucune autorité de lecture Platform Health générique
     * pour un Admin ordinaire n'est actuellement prouvée.
     *
     * Il ne faut donc ni contourner la RLS avec des lectures
     * client directes, ni emprunter les RPC VH-TECK, ni
     * reconstruire les anciens états mémoire fictifs.
     */
    return Promise.reject(
      storageNotImplemented(
        "lecture de la santé globale de la plateforme pour Admin",
      ),
    );
  }
}