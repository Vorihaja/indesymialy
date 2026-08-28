import { supabase } from "@/lib/supabase";

import type {
  SuperAdminAccessLog,
  SuperAdminAdministrator,
  SuperAdminAnalyticsSnapshot,
  SuperAdminBreakdownItem,
  SuperAdminGrowthPoint,
  SuperAdminPermission,
  SuperAdminProfileCandidate,
} from "../types";

type JsonRecord = Record<string, unknown>;

const record = (value: unknown): JsonRecord =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : {};

const array = (value: unknown): unknown[] =>
  Array.isArray(value) ? value : [];

const text = (value: unknown, fallback = ""): string =>
  typeof value === "string" ? value : fallback;

const nullableText = (value: unknown): string | null =>
  typeof value === "string" ? value : null;

const number = (value: unknown): number =>
  typeof value === "number"
    ? value
    : Number.isFinite(Number(value))
      ? Number(value)
      : 0;

const nullableNumber = (value: unknown): number | null =>
  value === null || value === undefined
    ? null
    : number(value);

const bool = (value: unknown): boolean =>
  value === true;

function breakdown(value: unknown): SuperAdminBreakdownItem[] {
  return array(value).map((item) => {
    const row = record(item);

    return {
      label: text(row.label, "Sans libellé"),
      value: number(row.value),
      slug: nullableText(row.slug) ?? undefined,
      regionId: nullableText(row.regionId) ?? undefined,
      disciplineId: nullableText(row.disciplineId) ?? undefined,
    };
  });
}

function growth(value: unknown): SuperAdminGrowthPoint[] {
  return array(value).map((item) => {
    const row = record(item);

    return {
      date: text(row.date),
      users: number(row.users),
      fighters: number(row.fighters),
      events: number(row.events),
    };
  });
}

export class SuperAdminRepository {
  async getAnalytics(
    from: Date,
    to: Date,
  ): Promise<SuperAdminAnalyticsSnapshot> {
    const { data, error } = await supabase.rpc(
      "super_admin_analytics_snapshot",
      {
        p_from: from.toISOString(),
        p_to: to.toISOString(),
      },
    );

    if (error) {
      throw new Error(error.message);
    }

    const root = record(data);
    const period = record(root.period);
    const overview = record(root.overview);
    const sport = record(root.sport);
    const business = record(root.business);
    const community = record(root.community);
    const governance = record(root.governance);
    const system = record(root.system);
    const breakdowns = record(root.breakdowns);

    return {
      period: {
        from: text(period.from),
        to: text(period.to),
        previousFrom: text(period.previousFrom),
        previousTo: text(period.previousTo),
      },

      overview: {
        totalUsers: number(overview.totalUsers),
        newUsers: number(overview.newUsers),
        newUsersGrowth: nullableNumber(overview.newUsersGrowth),
        verifiedUsers: number(overview.verifiedUsers),
        verifiedUserRate: number(overview.verifiedUserRate),
        fighters: number(overview.fighters),
        newFighters: number(overview.newFighters),
        clubs: number(overview.clubs),
        organizations: number(overview.organizations),
        verifiedOrganizations: number(overview.verifiedOrganizations),
        events: number(overview.events),
        newEvents: number(overview.newEvents),
        newEventsGrowth: nullableNumber(overview.newEventsGrowth),
        fights: number(overview.fights),
        ticketRevenue: number(overview.ticketRevenue),
        ticketRevenueGrowth: nullableNumber(overview.ticketRevenueGrowth),
        ticketsSold: number(overview.ticketsSold),
        messages: number(overview.messages),
        messagesGrowth: nullableNumber(overview.messagesGrowth),
      },

      sport: {
        eventsCreated: number(sport.eventsCreated),
        eventsCompleted: number(sport.eventsCompleted),
        eventsCancelled: number(sport.eventsCancelled),
        averageReadiness: number(sport.averageReadiness),
        fightsCreated: number(sport.fightsCreated),
        fightsCompleted: number(sport.fightsCompleted),
        fightCompletionRate: number(sport.fightCompletionRate),
      },

      business: {
        ticketRevenue: number(business.ticketRevenue),
        ticketsSold: number(business.ticketsSold),
        eventRevenue: number(business.eventRevenue),
        eventExpenses: number(business.eventExpenses),
        eventNet: number(business.eventNet),
        sponsoringValue: number(business.sponsoringValue),
        activeSubscriptions: number(business.activeSubscriptions),
        activeSubscriptionValue: number(business.activeSubscriptionValue),
      },

      community: {
        messages: number(community.messages),
        conversationsCreated: number(community.conversationsCreated),
        socialPublishingAvailable: bool(
          community.socialPublishingAvailable,
        ),
      },

      governance: {
        administrators: number(governance.administrators),
      },

      system: {
        databaseSizeBytes: number(system.databaseSizeBytes),
        databaseConnections: number(system.databaseConnections),
        databaseCacheHitRate: nullableNumber(
          system.databaseCacheHitRate,
        ),
      },

      breakdowns: {
        roles: breakdown(breakdowns.roles),
        regions: breakdown(breakdowns.regions),
        disciplines: breakdown(breakdowns.disciplines),
      },

      growthSeries: growth(root.growthSeries),
    };
  }

  async listAdministrators(): Promise<
    SuperAdminAdministrator[]
  > {
    const { data, error } = await supabase.rpc(
      "super_admin_list_administrators",
    );

    if (error) {
      throw new Error(error.message);
    }

    return array(data).map((item) => {
      const row = record(item);

      return {
        profileId: text(row.profileId),
        fullName: text(row.fullName),
        email: text(row.email),
        status: nullableText(row.status),
        verified: bool(row.verified),
        adminSince: nullableText(row.adminSince),
        permissions: array(row.permissions)
          .filter(
            (permission): permission is string =>
              typeof permission === "string",
          ),
      };
    });
  }

  async listPermissionCatalog(): Promise<
    SuperAdminPermission[]
  > {
    const { data, error } = await supabase.rpc(
      "super_admin_list_permission_catalog",
    );

    if (error) {
      throw new Error(error.message);
    }

    return array(data).map((item) => {
      const row = record(item);

      return {
        id: text(row.id),
        code: text(row.code),
        description: nullableText(row.description),
      };
    });
  }

  async searchProfiles(
    query: string,
  ): Promise<SuperAdminProfileCandidate[]> {
    const { data, error } = await supabase.rpc(
      "super_admin_search_profiles",
      {
        p_query: query,
        p_limit: 25,
      },
    );

    if (error) {
      throw new Error(error.message);
    }

    return array(data).map((item) => {
      const row = record(item);

      return {
        profileId: text(row.profileId),
        fullName: text(row.fullName),
        email: text(row.email),
        status: nullableText(row.status),
        verified: bool(row.verified),
        isAdmin: bool(row.isAdmin),
        isSuperAdmin: bool(row.isSuperAdmin),
      };
    });
  }

  async listAccessLogs(): Promise<
    SuperAdminAccessLog[]
  > {
    const { data, error } = await supabase.rpc(
      "super_admin_list_access_logs",
      {
        p_limit: 100,
      },
    );

    if (error) {
      throw new Error(error.message);
    }

    return array(data).map((item) => {
      const row = record(item);

      return {
        id: text(row.id),
        actorProfileId: text(row.actorProfileId),
        actorName: nullableText(row.actorName),
        targetProfileId: nullableText(row.targetProfileId),
        targetName: nullableText(row.targetName),
        action: text(row.action),
        details: record(row.details),
        createdAt: text(row.createdAt),
      };
    });
  }

  async setAdminRole(
    profileId: string,
    enabled: boolean,
  ): Promise<void> {
    const { error } = await supabase.rpc(
      "super_admin_set_admin_role",
      {
        p_profile_id: profileId,
        p_enabled: enabled,
      },
    );

    if (error) {
      throw new Error(error.message);
    }
  }

  async setAdminPermissions(
    profileId: string,
    permissions: string[],
  ): Promise<void> {
    const { error } = await supabase.rpc(
      "super_admin_set_admin_permissions",
      {
        p_profile_id: profileId,
        p_permission_codes: permissions,
      },
    );

    if (error) {
      throw new Error(error.message);
    }
  }
}
