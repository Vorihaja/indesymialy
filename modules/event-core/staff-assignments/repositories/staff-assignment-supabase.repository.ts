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
  StaffAssignmentRepository,
} from "./staff-assignment.repository";
import type {
  StaffAssignmentRequest,
} from "../types";

type StaffAssignmentRow =
  Database["public"]["Functions"]["list_my_staff_assignments"]["Returns"][number];

function mapAssignment(
  row: StaffAssignmentRow,
): StaffAssignmentRequest {
  return {
    id: row.id,
    eventId: row.event_id,
    eventTitle: row.event_title,
    staffName: row.staff_name,
    role: row.role,
    status: "invited",
    assignedAt: row.assigned_at,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    zone: row.zone,
    eventStartsAt:
      row.event_starts_at,
    eventVenue:
      row.event_venue,
  };
}

export class StaffAssignmentSupabaseRepository
  implements StaffAssignmentRepository
{
  constructor(
    private readonly supabase: SupabaseClient<Database>,
  ) {}

  async listActionable(): Promise<StaffAssignmentRequest[]> {
    try {
      const {
        data,
        error,
      } = await this.supabase.rpc(
        "list_my_staff_assignments",
      );

      if (error) {
        throw error;
      }

      return (data ?? []).map(
        mapAssignment,
      );
    } catch (reason) {
      throw normalizeBackendError(
        reason,
      );
    }
  }

  async respond(
    assignmentId: string,
    accept: boolean,
  ): Promise<void> {
    try {
      const {
        error,
      } = await this.supabase.rpc(
        "respond_staff_assignment",
        {
          p_assignment_id:
            assignmentId,
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