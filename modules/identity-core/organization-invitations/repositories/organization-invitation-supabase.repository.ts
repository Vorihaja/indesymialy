import type {
  SupabaseClient,
} from "@supabase/supabase-js";

import type {
  Database,
} from "@/infrastructure/supabase/database.types";
import {
  normalizeBackendError,
} from "@/shared/errors/backend-error";

import type {
  OrganizationInvitationRepository,
} from "./organization-invitation.repository";
import type {
  OrganizationInvitation,
} from "../types";

type InvitationRow =
  Database["public"]["Functions"]["list_my_organization_invitations"]["Returns"][number];

function mapInvitation(
  row: InvitationRow,
): OrganizationInvitation {
  return {
    id: row.id,
    organizationId: row.organization_id,
    organizationName: row.organization_name,
    organizationType: row.organization_type,
    memberRole: row.member_role,
    status: "pending",
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  };
}

export class OrganizationInvitationSupabaseRepository
  implements OrganizationInvitationRepository
{
  constructor(
    private readonly supabase: SupabaseClient<Database>,
  ) {}

  async listPending(): Promise<OrganizationInvitation[]> {
    try {
      const {
        data,
        error,
      } = await this.supabase.rpc(
        "list_my_organization_invitations",
      );

      if (error) {
        throw error;
      }

      return (data ?? []).map(
        mapInvitation,
      );
    } catch (reason) {
      throw normalizeBackendError(reason);
    }
  }

  async respond(
    invitationId: string,
    accept: boolean,
  ): Promise<void> {
    try {
      const {
        error,
      } = await this.supabase.rpc(
        "respond_organization_invitation",
        {
          p_invitation_id: invitationId,
          p_accept: accept,
        },
      );

      if (error) {
        throw error;
      }
    } catch (reason) {
      throw normalizeBackendError(reason);
    }
  }
}