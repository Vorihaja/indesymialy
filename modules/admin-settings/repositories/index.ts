import type { AdminDomainData } from "@/modules/admin-core";
import { storageNotImplemented } from "@/shared/errors/backend-error";

import type { AdminSettingsDomain } from "../types";

export class AdminSettingsRepository {
  list(
    domain: AdminSettingsDomain,
  ): Promise<AdminDomainData> {
    if (
      domain !==
      "settings"
    ) {
      return Promise.reject(
        storageNotImplemented(
          "configuration globale Admin",
        ),
      );
    }

    /*
     * Aucun contrat persistant générique Admin Settings
     * n'est actuellement prouvé.
     *
     * Les préférences de compte, de notifications,
     * de Korana, de conversation et d'organisation
     * appartiennent à leurs propres scopes.
     *
     * platform_reference_values est un référentiel
     * transversal, pas une preuve d'autorité Settings.
     *
     * platform_http_monitor_config appartient au
     * monitoring plateforme et ne possède pas d'autorité
     * Admin générique prouvée.
     *
     * Les RPC super_admin_* restent réservées au
     * Control Center VH-TECK.
     */
    return Promise.reject(
      storageNotImplemented(
        "lecture de la configuration globale Admin",
      ),
    );
  }
}