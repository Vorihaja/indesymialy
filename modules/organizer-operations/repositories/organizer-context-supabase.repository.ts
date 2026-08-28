import type {
  SupabaseClient,
} from "@supabase/supabase-js";

import type {
  Database,
} from "@/infrastructure/supabase/database.types";

import {
  OrganizerOperationsError,
  normalizeOrganizerOperationsError,
} from "../errors";

import type {
  OrganizerContext,
} from "../types";

import type {
  OrganizerContextRepository,
} from "./organizer-operations.repository";

type OrganizationRow =
  Database["public"]["Tables"]["organizations"]["Row"];

const ACTIVE_EVENT_KEY =
  "indesy-mialy:organizer-active-event";

function getStorageKey(
  organizationId: string,
) {
  return `${ACTIVE_EVENT_KEY}:${organizationId}`;
}

function readStoredEventId(
  organizationId: string,
): string | null {
  if (
    typeof window ===
    "undefined"
  ) {
    return null;
  }

  try {
    return window.localStorage.getItem(
      getStorageKey(
        organizationId,
      ),
    );
  } catch {
    return null;
  }
}

function storeEventId(
  organizationId: string,
  eventId: string,
) {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  try {
    window.localStorage.setItem(
      getStorageKey(
        organizationId,
      ),
      eventId,
    );
  } catch {
    // Le stockage local n'est pas critique.
  }
}

function removeStoredEventId(
  organizationId: string,
) {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  try {
    window.localStorage.removeItem(
      getStorageKey(
        organizationId,
      ),
    );
  } catch {
    // Le stockage local n'est pas critique.
  }
}

export class OrganizerContextSupabaseRepository
  implements OrganizerContextRepository
{
  constructor(
    private readonly supabase:
      SupabaseClient<Database>,
  ) {}

  async resolve(): Promise<OrganizerContext> {
    try {
      const {
        data: authData,
        error: authError,
      } =
        await this.supabase.auth.getUser();

      if (authError) {
        throw authError;
      }

      if (!authData.user) {
        throw new OrganizerOperationsError(
          "UNAUTHENTICATED",
        );
      }

      const profileId =
        authData.user.id;

      const [
        profileResult,
        membershipsResult,
        ownedResult,
        profileRolesResult,
        systemRolesResult,
        activeOrganizationResult,
      ] = await Promise.all([
        this.supabase
          .from("profiles")
          .select("id")
          .eq("id", profileId)
          .maybeSingle(),

        this.supabase
          .from(
            "organization_members",
          )
          .select(
            "organization_id,role,status,joined_at",
          )
          .eq(
            "profile_id",
            profileId,
          ),

        this.supabase
          .from("organizations")
          .select("*")
          .eq(
            "owner_id",
            profileId,
          )
          .eq(
            "type",
            "organizer",
          ),

        this.supabase
          .from("profile_roles")
          .select("role_id")
          .eq(
            "profile_id",
            profileId,
          ),

        this.supabase
          .from(
            "profile_system_roles",
          )
          .select(
            "system_role_id",
          )
          .eq(
            "profile_id",
            profileId,
          ),
        this.supabase
          .from(
            "active_organizations",
          )
          .select(
            "organization_id",
          )
          .eq(
            "profile_id",
            profileId,
          )
          .maybeSingle(),
      ]);

      const firstError = [
        profileResult.error,
        membershipsResult.error,
        ownedResult.error,
        profileRolesResult.error,
        systemRolesResult.error,
        activeOrganizationResult.error,
      ].find(Boolean);

      if (firstError) {
        throw firstError;
      }

      if (!profileResult.data) {
        throw new OrganizerOperationsError(
          "UNAUTHENTICATED",
        );
      }

      const activeMemberships =
        (
          membershipsResult.data ??
          []
        ).filter(
          (member) =>
            member.organization_id &&
            member.status !==
              "inactive" &&
            member.status !==
              "suspended",
        );

      const memberIds =
        activeMemberships
          .map(
            (member) =>
              member.organization_id,
          )
          .filter(
            (
              id,
            ): id is string =>
              Boolean(id),
          );

      const memberOrganizationsResult =
        memberIds.length
          ? await this.supabase
              .from(
                "organizations",
              )
              .select("*")
              .in(
                "id",
                memberIds,
              )
              .eq(
                "type",
                "organizer",
              )
          : {
              data:
                [] as OrganizationRow[],
              error: null,
            };

      if (
        memberOrganizationsResult.error
      ) {
        throw memberOrganizationsResult.error;
      }

      const usable = (
        organization:
          OrganizationRow,
      ) =>
        organization.status !==
          "suspended" &&
        !organization.deactivated_at;

      const owned =
        (
          ownedResult.data ?? []
        )
          .filter(usable)
          .sort(
            (a, b) =>
              (
                a.created_at ?? ""
              ).localeCompare(
                b.created_at ?? "",
              ),
          );

      const memberOrganizations =
        (
          memberOrganizationsResult.data ??
          []
        ).filter(usable);

      const activeOrganizationId =
        activeOrganizationResult.data
          ?.organization_id ??
        null;

      const organization =
        (
          activeOrganizationId
            ? [
                ...owned,
                ...memberOrganizations,
              ].find(
                (item) =>
                  item.id ===
                  activeOrganizationId,
              )
            : undefined
        ) ??
        owned[0] ??
        memberOrganizations[0];

      if (!organization) {
        throw new OrganizerOperationsError(
          "ORGANIZATION_NOT_FOUND",
        );
      }

      const membership =
        activeMemberships.find(
          (item) =>
            item.organization_id ===
            organization.id,
        );

      const roleIds =
        (
          profileRolesResult.data ??
          []
        )
          .map(
            (item) =>
              item.role_id,
          )
          .filter(
            (
              id,
            ): id is string =>
              Boolean(id),
          );

      const rolesResult =
        roleIds.length
          ? await this.supabase
              .from("roles")
              .select("id,slug")
              .in("id", roleIds)
          : {
              data: [],
              error: null,
            };

      if (rolesResult.error) {
        throw rolesResult.error;
      }

      const permissionRoleIds =
        (
          rolesResult.data ?? []
        ).map(
          (role) => role.id,
        );

      const rolePermissionsResult =
        permissionRoleIds.length
          ? await this.supabase
              .from(
                "role_permissions",
              )
              .select(
                "permission_id",
              )
              .in(
                "role_id",
                permissionRoleIds,
              )
          : {
              data: [],
              error: null,
            };

      if (
        rolePermissionsResult.error
      ) {
        throw rolePermissionsResult.error;
      }

      const permissionIds =
        (
          rolePermissionsResult.data ??
          []
        ).map(
          (item) =>
            item.permission_id,
        );

      const permissionsResult =
        permissionIds.length
          ? await this.supabase
              .from("permissions")
              .select("code")
              .in(
                "id",
                permissionIds,
              )
          : {
              data: [],
              error: null,
            };

      if (
        permissionsResult.error
      ) {
        throw permissionsResult.error;
      }

      const systemRoleIds =
        (
          systemRolesResult.data ??
          []
        ).map(
          (item) =>
            item.system_role_id,
        );

      const systemRoleRows =
        systemRoleIds.length
          ? await this.supabase
              .from(
                "system_roles",
              )
              .select("code")
              .in(
                "id",
                systemRoleIds,
              )
          : {
              data: [],
              error: null,
            };

      if (
        systemRoleRows.error
      ) {
        throw systemRoleRows.error;
      }

      const eventsResult =
        await this.supabase
          .from("events")
          .select(
            "id,status,updated_at",
          )
          .eq(
            "organizer_id",
            organization.id,
          )
          .order(
            "updated_at",
            {
              ascending: false,
            },
          );

      if (eventsResult.error) {
        throw eventsResult.error;
      }

      const usableEvents =
        (
          eventsResult.data ?? []
        ).filter(
          (event) =>
            event.status !==
            "archived",
        );

      const storedEventId =
        readStoredEventId(
          organization.id,
        );

      let activeEvent =
        storedEventId
          ? usableEvents.find(
              (event) =>
                event.id ===
                storedEventId,
            )
          : undefined;

      if (
        storedEventId &&
        !activeEvent
      ) {
        removeStoredEventId(
          organization.id,
        );
      }

      if (!activeEvent) {
        activeEvent =
          usableEvents[0];
      }

      if (activeEvent) {
        storeEventId(
          organization.id,
          activeEvent.id,
        );
      }

      return {
        profileId,

        organizationId:
          organization.id,

        organizerRole:
          organization.owner_id ===
          profileId
            ? "owner"
            : membership?.role ??
              (
                rolesResult.data?.[0]
                  ?.slug ??
                "member"
              ),

        permissions: [
          ...(
            permissionsResult.data ??
            []
          ).map(
            (permission) =>
              permission.code,
          ),

          ...(
            systemRoleRows.data ??
            []
          ).map(
            (role) =>
              `system:${role.code}`,
          ),
        ],

        activeEventId:
          activeEvent?.id ?? null,
      };
    } catch (reason) {
      throw normalizeOrganizerOperationsError(
        reason,
      );
    }
  }

  async setActiveEventId(
    eventId: string,
  ): Promise<void> {
    try {
      const context =
        await this.resolve();

      const result =
        await this.supabase
          .from("events")
          .select(
            "id,status",
          )
          .eq(
            "id",
            eventId,
          )
          .eq(
            "organizer_id",
            context.organizationId,
          )
          .maybeSingle();

      if (result.error) {
        throw result.error;
      }

      if (
        !result.data ||
        result.data.status ===
          "archived"
      ) {
        throw new OrganizerOperationsError(
          "EVENT_NOT_FOUND",
        );
      }

      storeEventId(
        context.organizationId,
        eventId,
      );
    } catch (reason) {
      throw normalizeOrganizerOperationsError(
        reason,
      );
    }
  }
}