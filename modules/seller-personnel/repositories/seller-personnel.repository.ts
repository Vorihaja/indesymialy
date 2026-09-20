import {
  createSupabaseBrowserClient,
} from "@/infrastructure/supabase/client";

import type {
  PersonnelAssignmentInput,
  PersonnelDocumentInput,
  PersonnelLeaveInput,
  PersonnelProfileInput,
  SellerPersonnelSnapshot,
} from "../types";

type Client =
  ReturnType<
    typeof createSupabaseBrowserClient
  >;

type RpcResult = {
  data: unknown;
  error: {
    message: string;
  } | null;
};

type RpcRuntime = {
  rpc: (
    name: string,
    args?: Record<string, unknown>,
  ) => Promise<RpcResult>;
};

const BUCKET =
  "seller-personnel-documents";

function rpcRuntime(
  client: Client,
) {
  return client as unknown as RpcRuntime;
}

function snapshot(
  value: unknown,
): SellerPersonnelSnapshot {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    throw new Error(
      "Réponse Personnel invalide.",
    );
  }

  return value as SellerPersonnelSnapshot;
}

function safeFileName(
  value: string,
) {
  const cleaned =
    value
      .normalize(
        "NFD",
      )
      .replace(
        /[\u0300-\u036f]/g,
        "",
      )
      .replace(
        /[^a-zA-Z0-9._-]+/g,
        "-",
      )
      .replace(
        /-+/g,
        "-",
      )
      .replace(
        /^-|-$/g,
        "",
      );

  return cleaned ||
    "document";
}

export class SellerPersonnelRepository {
  constructor(
    private readonly client: Client,
  ) {}

  private async rpc(
    name: string,
    args?: Record<string, unknown>,
  ) {
    const result =
      await rpcRuntime(
        this.client,
      ).rpc(
        name,
        args,
      );

    if (result.error) {
      throw new Error(
        result.error.message,
      );
    }

    return result.data;
  }

  async getSnapshot() {
    return snapshot(
      await this.rpc(
        "marketplace_seller_personnel_snapshot",
      ),
    );
  }

  async saveProfile(
    input: PersonnelProfileInput,
  ) {
    await this.rpc(
      "marketplace_save_personnel_profile",
      {
        p_profile_id:
          input.profileId,

        p_department:
          input.department,

        p_contract_type:
          input.contractType,

        p_location:
          input.location,

        p_availability:
          input.availability,

        p_monthly_compensation:
          input.monthlyCompensation,

        p_currency:
          input.currency,

        p_employment_status:
          input.employmentStatus,
      },
    );
  }

  async setAccess(
    profileId: string,
    active: boolean,
  ) {
    await this.rpc(
      "marketplace_set_personnel_access",
      {
        p_profile_id:
          profileId,

        p_active:
          active,
      },
    );
  }

  async invite(
    identifier: string,
    memberRole: string,
  ) {
    await this.rpc(
      "marketplace_invite_seller_personnel",
      {
        p_identifier:
          identifier,

        p_member_role:
          memberRole,

        p_expires_days:
          7,
      },
    );
  }

  async revokeInvitation(
    id: string,
  ) {
    await this.rpc(
      "marketplace_revoke_seller_personnel_invitation",
      {
        p_invitation_id:
          id,
      },
    );
  }

  async saveInternalRole(
    id: string | null,
    label: string,
    permissions: string[],
    active: boolean,
  ) {
    await this.rpc(
      "marketplace_save_personnel_internal_role",
      {
        p_id:
          id,

        p_label:
          label,

        p_permissions:
          permissions,

        p_is_active:
          active,
      },
    );
  }

  async setInternalRoleMembers(
    roleId: string,
    profileIds: string[],
  ) {
    await this.rpc(
      "marketplace_set_personnel_internal_role_members",
      {
        p_role_id:
          roleId,

        p_profile_ids:
          profileIds,
      },
    );
  }

  async saveAssignment(
    input: PersonnelAssignmentInput,
  ) {
    await this.rpc(
      "marketplace_save_personnel_assignment",
      {
        p_id:
          input.id ?? null,

        p_profile_id:
          input.profileId,

        p_mission:
          input.mission,

        p_scope:
          input.scope ?? null,

        p_starts_at:
          input.startsAt ?? null,

        p_ends_at:
          input.endsAt ?? null,

        p_status:
          input.status ?? "planned",
      },
    );
  }

  async markAttendance(
    profileId: string,
    workDate: string,
    action: "check_in" | "check_out",
  ) {
    await this.rpc(
      "marketplace_mark_personnel_attendance",
      {
        p_profile_id:
          profileId,

        p_work_date:
          workDate,

        p_action:
          action,

        p_note:
          null,
      },
    );
  }

  async saveLeave(
    input: PersonnelLeaveInput,
  ) {
    await this.rpc(
      "marketplace_save_personnel_leave",
      {
        p_id:
          input.id ?? null,

        p_profile_id:
          input.profileId,

        p_leave_type:
          input.type,

        p_starts_on:
          input.startsOn,

        p_ends_on:
          input.endsOn,
      },
    );
  }

  async decideLeave(
    id: string,
    status:
      | "approved"
      | "declined"
      | "cancelled",
  ) {
    await this.rpc(
      "marketplace_decide_personnel_leave",
      {
        p_id:
          id,

        p_status:
          status,
      },
    );
  }

  async addDocument(
    organizationId: string,
    input: PersonnelDocumentInput,
    file: File,
  ) {
    if (
      file.size >
      15 *
        1024 *
        1024
    ) {
      throw new Error(
        "Le document dépasse 15 Mo.",
      );
    }

    if (
      ![
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/webp",
      ].includes(
        file.type,
      )
    ) {
      throw new Error(
        "Format accepté : PDF, JPG, PNG ou WebP.",
      );
    }

    const path =
      `${organizationId}/${input.profileId}/${crypto.randomUUID()}-${safeFileName(file.name)}`;

    const upload =
      await this.client.storage
        .from(
          BUCKET,
        )
        .upload(
          path,
          file,
          {
            upsert:
              false,
          },
        );

    if (upload.error) {
      throw upload.error;
    }

    try {
      await this.rpc(
        "marketplace_save_personnel_document",
        {
          p_profile_id:
            input.profileId,

          p_name:
            input.name,

          p_category:
            input.category,

          p_storage_path:
            path,

          p_file_name:
            file.name,

          p_mime_type:
            file.type,

          p_expires_at:
            input.expiresAt ?? null,
        },
      );
    }
    catch (cause) {
      await this.client.storage
        .from(
          BUCKET,
        )
        .remove(
          [
            path,
          ],
        );

      throw cause;
    }
  }

  async documentUrl(
    path: string,
  ) {
    const result =
      await this.client.storage
        .from(
          BUCKET,
        )
        .createSignedUrl(
          path,
          120,
        );

    if (result.error) {
      throw result.error;
    }

    return result.data.signedUrl;
  }

  async archiveDocument(
    id: string,
  ) {
    await this.rpc(
      "marketplace_archive_personnel_document",
      {
        p_id:
          id,
      },
    );
  }
}