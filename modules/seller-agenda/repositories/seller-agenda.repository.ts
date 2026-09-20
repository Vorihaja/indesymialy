import type {
  AgendaItemPriority,
  AgendaItemSource,
  AgendaManualStatus,
  SellerAgendaItem,
  SellerAgendaItemInput,
  SellerAgendaSnapshot,
} from "../types";

type RpcError = {
  message?: string;
} | null;

type RpcResult = {
  data: unknown;
  error: RpcError;
};

export type SellerAgendaRpcClient = {
  rpc(
    name: string,
    args?: Record<string, unknown>,
  ): PromiseLike<RpcResult>;
};

type JsonRecord =
  Record<string, unknown>;

function record(
  value: unknown,
): JsonRecord {
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    return value as JsonRecord;
  }

  return {};
}

function text(
  value: unknown,
  fallback = "",
): string {
  return typeof value === "string"
    ? value
    : fallback;
}

function nullableText(
  value: unknown,
): string | null {
  return typeof value === "string"
    ? value
    : null;
}

function boolean(
  value: unknown,
): boolean {
  return value === true;
}

function mapItem(
  value: unknown,
): SellerAgendaItem {
  const row =
    record(value);

  return {
    id:
      text(row.id),

    source:
      text(
        row.source,
        "manual",
      ) as AgendaItemSource,

    sourceId:
      text(row.sourceId),

    title:
      text(row.title),

    description:
      nullableText(
        row.description,
      ),

    kind:
      text(
        row.kind,
        "task",
      ),

    startsAt:
      text(row.startsAt),

    endsAt:
      nullableText(
        row.endsAt,
      ),

    allDay:
      boolean(row.allDay),

    priority:
      text(
        row.priority,
        "normal",
      ) as AgendaItemPriority,

    status:
      text(row.status),

    location:
      nullableText(
        row.location,
      ),

    editable:
      boolean(row.editable),

    relatedModule:
      nullableText(
        row.relatedModule,
      ),

    relatedTab:
      nullableText(
        row.relatedTab,
      ),
  };
}

export class SellerAgendaRepository {
  constructor(
    private readonly client:
      SellerAgendaRpcClient,
  ) {}

  async snapshot(
    from: string,
    to: string,
  ): Promise<SellerAgendaSnapshot> {
    const {
      data,
      error,
    } =
      await this.client.rpc(
        "marketplace_seller_agenda_snapshot",
        {
          p_from:
            from,

          p_to:
            to,
        },
      );

    if (error) {
      throw new Error(
        error.message ??
          "Agenda indisponible.",
      );
    }

    const payload =
      record(data);

    const rawItems =
      Array.isArray(
        payload.items,
      )
        ? payload.items
        : [];

    return {
      organizationId:
        text(
          payload.organizationId,
        ),

      items:
        rawItems
          .map(mapItem)
          .filter(
            (item) =>
              Boolean(
                item.id &&
                item.title &&
                item.startsAt,
              ),
          ),
    };
  }

  async save(
    input: SellerAgendaItemInput,
  ): Promise<string> {
    const {
      data,
      error,
    } =
      await this.client.rpc(
        "marketplace_save_seller_agenda_item",
        {
          p_id:
            input.id,

          p_title:
            input.title,

          p_description:
            input.description ||
            null,

          p_kind:
            input.kind,

          p_starts_at:
            input.startsAt,

          p_ends_at:
            input.endsAt,

          p_all_day:
            input.allDay,

          p_priority:
            input.priority,

          p_location:
            input.location ||
            null,

          p_status:
            input.status,
        },
      );

    if (error) {
      throw new Error(
        error.message ??
          "Enregistrement impossible.",
      );
    }

    if (
      typeof data !== "string" ||
      !data
    ) {
      throw new Error(
        "L'Agenda n'a pas retourné d'identifiant.",
      );
    }

    return data;
  }

  async setStatus(
    id: string,
    status: AgendaManualStatus,
  ): Promise<void> {
    const {
      error,
    } =
      await this.client.rpc(
        "marketplace_set_seller_agenda_item_status",
        {
          p_id:
            id,

          p_status:
            status,
        },
      );

    if (error) {
      throw new Error(
        error.message ??
          "Changement de statut impossible.",
      );
    }
  }
}