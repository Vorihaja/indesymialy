import type { AdminDomainData } from "@/modules/admin-core";
import { storageNotImplemented } from "@/shared/errors/backend-error";

import type { AdminReportsDomain } from "../types";

export class AdminReportsRepository {
  list(
    domain: AdminReportsDomain,
  ): Promise<AdminDomainData> {
    const capability =
      domain === "reports"
        ? "lecture globale Admin des signalements"
        : "lecture globale Admin des signalements";

    /*
     * korana_reports est persistant, mais son autorité RLS actuelle
     * ne représente pas une file globale Admin.
     *
     * Les données Marketplace accessibles côté client sont elles
     * aussi limitées par leurs politiques de parties / vendeur.
     *
     * Aucun agrégat synthétique ni faux rapport n'est renvoyé.
     */
    return Promise.reject(
      storageNotImplemented(
        capability,
      ),
    );
  }
}