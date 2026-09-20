import { createSupabaseBrowserClient } from "@/infrastructure/supabase/client";

import type {
  ErpCalendarCreateInput,
  ErpCalendarEventType,
  ErpCalendarItem,
  ErpCalendarMetadata,
  ErpCalendarSource,
  ErpCalendarStatus,
  ErpCalendarUpdateInput,
} from "../types";

import type { ErpCalendarRepository } from "./erp-calendar.repository";

type FeedRpcRow = {
  calendar_key: string;
  source_id: string;

  source_table: string;
  source_kind: ErpCalendarSource;
  relation_kind: string;

  title: string;
  description: string | null;

  starts_at: string;
  ends_at: string;
  all_day: boolean;

  event_type: ErpCalendarEventType;
  status: ErpCalendarStatus;

  location: string | null;
  context_role: string | null;

  editable: boolean;

  metadata:
    | ErpCalendarMetadata
    | null;
};

type CalendarRpcResponse = {
  data: unknown;
  error: {
    message: string;
  } | null;
};

type CalendarRpc = (
  name: string,
  args?: Record<string, unknown>,
) => Promise<CalendarRpcResponse>;

const sourceLabels: Record<string, string> = {
  manual: "Agenda personnel",
  event: "Événement Indesy",
  event_schedule: "Planning événement",
  staff_assignment: "Affectation",
  weigh_in: "Pesée",
  seller_agenda: "Agenda vendeur",
  seller_personnel_assignment:
    "Personnel vendeur",
  seller_document_expiry:
    "Document vendeur",
  marketplace_promotion:
    "Promotion Marketplace",
  sponsor_activation:
    "Activation sponsor",
  event_operation:
    "Opération événement",
  club_event:
    "Événement club",
  marketplace_bundle:
    "Bundle Marketplace",
  marketplace_partnership:
    "Partenariat Marketplace",
  sponsor_pipeline:
    "Suivi sponsor",
  seller_personnel_leave:
    "Congé / indisponibilité",
};

function rpcClient(): CalendarRpc {
  const client =
    createSupabaseBrowserClient();

  return client.rpc.bind(
    client,
  ) as unknown as CalendarRpc;
}

function mapRow(
  row: FeedRpcRow,
): ErpCalendarItem {
  return {
    id: row.source_id,

    calendarKey: row.calendar_key,
    sourceId: row.source_id,

    sourceTable: row.source_table,
    source: row.source_kind,

    sourceLabel:
      sourceLabels[row.source_kind] ??
      row.source_table,

    relationKind: row.relation_kind,

    title: row.title,
    description: row.description,

    startsAt: row.starts_at,
    endsAt: row.ends_at,
    allDay: row.all_day,

    type: row.event_type,
    status: row.status,

    location: row.location,

    contextRole: row.context_role,

    editable:
      row.editable &&
      row.source_kind === "manual",

    metadata:
      row.metadata ?? {},

    createdAt: row.starts_at,
    updatedAt: row.starts_at,
  };
}

export class ErpCalendarSupabaseRepository
  implements ErpCalendarRepository
{
  async list(
    from?: string,
    to?: string,
  ): Promise<ErpCalendarItem[]> {
    const rpc = rpcClient();

    const { data, error } = await rpc(
      "get_user_calendar_feed",
      {
        p_from: from ?? null,
        p_to: to ?? null,
      },
    );

    if (error) {
      throw new Error(error.message);
    }

    if (!Array.isArray(data)) {
      return [];
    }

    return (data as FeedRpcRow[]).map(
      mapRow,
    );
  }

  async create(
    input: ErpCalendarCreateInput,
  ): Promise<string> {
    const rpc = rpcClient();

    const { data, error } = await rpc(
      "erp_calendar_create_item",
      {
        p_title: input.title,
        p_starts_at: input.startsAt,
        p_ends_at: input.endsAt,
        p_all_day: input.allDay,
        p_event_type: input.type,
        p_location:
          input.location ?? null,
        p_description:
          input.description ?? null,
        p_status: input.status,
        p_context_role:
          input.contextRole ?? null,
      },
    );

    if (error) {
      throw new Error(error.message);
    }

    if (typeof data !== "string") {
      throw new Error(
        "Identifiant calendrier manquant.",
      );
    }

    return data;
  }

  async update(
    input: ErpCalendarUpdateInput,
  ): Promise<string> {
    const rpc = rpcClient();

    const { data, error } = await rpc(
      "erp_calendar_update_item",
      {
        p_item_id: input.id,
        p_title: input.title,
        p_starts_at: input.startsAt,
        p_ends_at: input.endsAt,
        p_all_day: input.allDay,
        p_event_type: input.type,
        p_location:
          input.location ?? null,
        p_description:
          input.description ?? null,
        p_status: input.status,
        p_context_role:
          input.contextRole ?? null,
      },
    );

    if (error) {
      throw new Error(error.message);
    }

    if (typeof data !== "string") {
      throw new Error(
        "Identifiant calendrier manquant.",
      );
    }

    return data;
  }

  async archive(
    id: string,
  ): Promise<string> {
    const rpc = rpcClient();

    const { data, error } = await rpc(
      "erp_calendar_archive_item",
      {
        p_item_id: id,
      },
    );

    if (error) {
      throw new Error(error.message);
    }

    if (typeof data !== "string") {
      throw new Error(
        "Identifiant calendrier manquant.",
      );
    }

    return data;
  }
}
