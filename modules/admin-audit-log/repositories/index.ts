import type { AdminDomainData } from "@/modules/admin-core";
import { storageNotImplemented } from "@/shared/errors/backend-error";

import type { AdminAuditLogDomain } from "../types";

export class AdminAuditLogRepository {
  list(
    domain: AdminAuditLogDomain,
  ): Promise<AdminDomainData> {
    if (
      domain !==
      "audit-log"
    ) {
      return Promise.reject(
        storageNotImplemented(
          "journal d'activité administrateur",
        ),
      );
    }

    /*
     * admin_access_logs est une autorité persistante réelle,
     * mais sa lecture globale actuelle appartient au Control
     * Center Super Admin.
     *
     * Le module Admin générique ne possède pas encore
     * d'autorité de lecture globale dédiée.
     *
     * Il ne doit donc :
     * - ni contourner la RLS par un SELECT client ;
     * - ni emprunter l'autorité VH-TECK ;
     * - ni reconstruire les anciennes données fictives.
     */
    return Promise.reject(
      storageNotImplemented(
        "lecture globale du journal d'activité Admin",
      ),
    );
  }
}