import type {
  SupabaseClient,
} from "@supabase/supabase-js";

import type {
  OrganizationPersonnelMember,
  OrganizationPersonnelSnapshot,
} from "../organization-personnel.types";

type PersonnelContext = {
  userId: string;
  organizationIds: string[];
  activeOrganizationId: string | null;
};

export class OrganizationPersonnelSupabaseRepository {
  constructor(
    private readonly supabase: SupabaseClient,
  ) {}

  private async context(): Promise<PersonnelContext> {
    const authResult =
      await this.supabase.auth.getUser();

    if (authResult.error) {
      throw authResult.error;
    }

    const user =
      authResult.data.user;

    if (!user) {
      throw new Error(
        "Session utilisateur introuvable.",
      );
    }

    const [
      ownedResult,
      membershipResult,
      activeResult,
    ] = await Promise.all([
      this.supabase
        .from("organizations")
        .select("id")
        .eq(
          "owner_id",
          user.id,
        ),

      this.supabase
        .from("organization_members")
        .select("organization_id")
        .eq(
          "profile_id",
          user.id,
        ),

      this.supabase
        .from("active_organizations")
        .select("organization_id")
        .eq(
          "profile_id",
          user.id,
        )
        .maybeSingle(),
    ]);

    const error =
      ownedResult.error ??
      membershipResult.error ??
      activeResult.error;

    if (error) {
      throw error;
    }

    const organizationIds =
      Array.from(
        new Set([
          ...(ownedResult.data ?? [])
            .map(
              (item) =>
                String(
                  item.id,
                ),
            ),

          ...(membershipResult.data ?? [])
            .flatMap(
              (item) =>
                item.organization_id
                  ? [
                      String(
                        item.organization_id,
                      ),
                    ]
                  : [],
            ),
        ]),
      );

    const requestedActive =
      activeResult.data?.organization_id
        ? String(
            activeResult.data.organization_id,
          )
        : null;

    const activeOrganizationId =
      requestedActive &&
      organizationIds.includes(
        requestedActive,
      )
        ? requestedActive
        : organizationIds[0] ??
          null;

    return {
      userId:
        user.id,

      organizationIds,

      activeOrganizationId,
    };
  }

  async getSnapshot(): Promise<OrganizationPersonnelSnapshot> {
    const context =
      await this.context();

    const organizationId =
      context.activeOrganizationId ??
      context.organizationIds[0] ??
      null;

    if (!organizationId) {
      return {
        organizationId:
          null,

        organizationName:
          "Aucune organisation",

        members:
          [],
      };
    }

    const [
      organizationResult,
      membershipsResult,
    ] = await Promise.all([
      this.supabase
        .from("organizations")
        .select(
          "id,name",
        )
        .eq(
          "id",
          organizationId,
        )
        .maybeSingle(),

      this.supabase
        .from("organization_members")
        .select(
          "id,organization_id,profile_id,role,status,joined_at",
        )
        .eq(
          "organization_id",
          organizationId,
        )
        .order(
          "joined_at",
          {
            ascending:
              false,
          },
        ),
    ]);

    const error =
      organizationResult.error ??
      membershipsResult.error;

    if (error) {
      throw error;
    }

    const memberships =
      membershipsResult.data ??
      [];

    const profileIds =
      Array.from(
        new Set(
          memberships.flatMap(
            (membership) =>
              membership.profile_id
                ? [
                    String(
                      membership.profile_id,
                    ),
                  ]
                : [],
          ),
        ),
      );

    let profiles:
      Array<{
        id: string;
        full_name: string | null;
        email: string | null;
      }> = [];

    if (profileIds.length > 0) {
      const profilesResult =
        await this.supabase
          .from("profiles")
          .select(
            "id,full_name,email",
          )
          .in(
            "id",
            profileIds,
          );

      if (profilesResult.error) {
        throw profilesResult.error;
      }

      profiles =
        profilesResult.data ??
        [];
    }

    const profileMap =
      new Map(
        profiles.map(
          (profile) => [
            String(
              profile.id,
            ),
            profile,
          ],
        ),
      );

    const members:
      OrganizationPersonnelMember[] =
        memberships.map(
          (membership) => {
            const profile =
              profileMap.get(
                String(
                  membership.profile_id,
                ),
              );

            return {
              id:
                String(
                  membership.id,
                ),

              organizationId:
                String(
                  membership.organization_id,
                ),

              profileId:
                String(
                  membership.profile_id,
                ),

              fullName:
                profile?.full_name ??
                "Profil",

              email:
                profile?.email ??
                "",

              role:
                String(
                  membership.role ??
                  "",
                ),

              status:
                String(
                  membership.status ??
                  "",
                ),

              joinedAt:
                membership.joined_at
                  ? String(
                      membership.joined_at,
                    )
                  : null,
            };
          },
        );

    return {
      organizationId,

      organizationName:
        organizationResult.data?.name ??
        "Organisation",

      members,
    };
  }
}
