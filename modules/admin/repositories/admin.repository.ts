import { supabase } from "@/lib/supabase";

import type {
  AdminActivity,
  AdminAlert,
  AdminDashboardStats,
} from "../types";

interface CountQueryResult {
  count: number | null;
  error: {
    message: string;
  } | null;
}

function requireCount(
  label: string,
  result: CountQueryResult,
): number {
  if (result.error) {
    throw new Error(
      `${label}: ${result.error.message}`,
    );
  }

  if (result.count === null) {
    throw new Error(
      `${label}: compteur Supabase indisponible`,
    );
  }

  return result.count;
}

export class AdminRepository {
  async getDashboardStats(): Promise<AdminDashboardStats> {
    const [
      users,
      fighters,
      clubs,
      events,
      articles,
      products,
      pendingRequests,
    ] = await Promise.all([
      supabase
        .from("profiles")
        .select(
          "id",
          {
            count: "exact",
            head: true,
          },
        ),

      supabase
        .from("fighters")
        .select(
          "id",
          {
            count: "exact",
            head: true,
          },
        ),

      supabase
        .from("clubs")
        .select(
          "id",
          {
            count: "exact",
            head: true,
          },
        ),

      supabase
        .from("events")
        .select(
          "id",
          {
            count: "exact",
            head: true,
          },
        ),

      supabase
        .from("articles")
        .select(
          "id",
          {
            count: "exact",
            head: true,
          },
        ),

      supabase
        .from("products")
        .select(
          "id",
          {
            count: "exact",
            head: true,
          },
        ),

      supabase
        .from("role_requests")
        .select(
          "id",
          {
            count: "exact",
            head: true,
          },
        )
        .eq(
          "status",
          "pending",
        ),
    ]);

    return {
      totalUsers: requireCount(
        "Comptage des utilisateurs",
        users,
      ),

      totalFighters: requireCount(
        "Comptage des combattants",
        fighters,
      ),

      totalClubs: requireCount(
        "Comptage des clubs",
        clubs,
      ),

      totalEvents: requireCount(
        "Comptage des événements",
        events,
      ),

      totalArticles: requireCount(
        "Comptage des articles",
        articles,
      ),

      totalProducts: requireCount(
        "Comptage des produits",
        products,
      ),

      /*
       * Aucun champ persistant ne représente actuellement
       * "utilisateur actif aujourd'hui".
       * null signifie donc "indisponible", jamais zéro.
       */
      activeUsersToday: null,

      pendingRequests: requireCount(
        "Comptage des demandes de rôles en attente",
        pendingRequests,
      ),
    };
  }

  async getRecentActivities(): Promise<AdminActivity[] | null> {
    /*
     * Aucune autorité persistante canonique n'est encore
     * définie pour un flux global d'activité Admin.
     */
    return null;
  }

  async getAlerts(): Promise<AdminAlert[] | null> {
    /*
     * Aucune autorité persistante canonique n'est encore
     * définie pour des alertes système Admin globales.
     */
    return null;
  }
}