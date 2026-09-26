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
  EventInvitationRepository,
} from "./event-invitation.repository";
import type {
  EventInvitation,
  EventInvitationOpenStatus,
} from "../types";

type EventInvitationRow =
  Database["public"]["Functions"]["list_my_event_invitations"]["Returns"][number];

function normalizeOpenStatus(
  value: string,
): EventInvitationOpenStatus {
  return value === "pending"
    ? "pending"
    : "sent";
}

function mapInvitation(
  row: EventInvitationRow,
): EventInvitation {
  return {
    id: row.id,
    eventId: row.event_id,
    eventTitle: row.event_title,
    invitationType: row.invitation_type,
    role: row.role,
    status: normalizeOpenStatus(
      row.status,
    ),
    sentAt: row.sent_at,
    eventStartsAt:
      row.event_starts_at,
    eventVenue:
      row.event_venue,
  };
}

export class EventInvitationSupabaseRepository
  implements EventInvitationRepository
{
  constructor(
    private readonly supabase: SupabaseClient<Database>,
  ) {}

  async listActionable(): Promise<EventInvitation[]> {
    try {
      const {
        data,
        error,
      } = await this.supabase.rpc(
        "list_my_event_invitations",
      );

      if (error) {
        throw error;
      }

      return (data ?? []).map(
        mapInvitation,
      );
    } catch (reason) {
      throw normalizeBackendError(
        reason,
      );
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
        "respond_event_invitation",
        {
          p_invitation_id:
            invitationId,
          p_accept:
            accept,
        },
      );

      if (error) {
        throw error;
      }
    } catch (reason) {
      throw normalizeBackendError(
        reason,
      );
    }
  }
}