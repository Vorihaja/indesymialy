import type {
  CustomerDisputeInput,
  CustomerSegmentInput,
  LoyaltyAdjustmentInput,
  SellerCustomersSnapshot,
} from "../types";

type RpcError = {
  message: string;
};

type RpcResult = {
  data: unknown;
  error: RpcError | null;
};

type RpcRuntime = {
  rpc: (
    name: string,
    args?: Record<string, unknown>,
  ) => Promise<RpcResult>;
};

function runtime(
  value: unknown,
): RpcRuntime {
  return value as RpcRuntime;
}

function snapshot(
  value: unknown,
): SellerCustomersSnapshot {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    throw new Error(
      "Réponse Clients invalide.",
    );
  }

  return value as SellerCustomersSnapshot;
}

export class SellerCustomersRepository {
  constructor(
    private readonly client: unknown,
  ) {}

  private async rpc(
    name: string,
    args?: Record<string, unknown>,
  ): Promise<unknown> {
    const result =
      await runtime(
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

  async getSnapshot(): Promise<SellerCustomersSnapshot> {
    return snapshot(
      await this.rpc(
        "marketplace_seller_customers_snapshot",
      ),
    );
  }

  async saveSegment(
    input: CustomerSegmentInput,
  ): Promise<void> {
    await this.rpc(
      "marketplace_save_customer_segment",
      {
        p_id:
          input.id ?? null,

        p_name:
          input.name,

        p_description:
          input.description ?? null,
      },
    );
  }

  async setSegmentStatus(
    id: string,
    status: "active" | "archived",
  ): Promise<void> {
    await this.rpc(
      "marketplace_set_customer_segment_status",
      {
        p_id:
          id,

        p_status:
          status,
      },
    );
  }

  async setSegmentMembers(
    segmentId: string,
    customerIds: string[],
  ): Promise<void> {
    await this.rpc(
      "marketplace_set_customer_segment_members",
      {
        p_segment_id:
          segmentId,

        p_customer_ids:
          customerIds,
      },
    );
  }

  async adjustLoyalty(
    input: LoyaltyAdjustmentInput,
  ): Promise<void> {
    await this.rpc(
      "marketplace_adjust_customer_loyalty",
      {
        p_customer_id:
          input.customerId,

        p_points:
          input.points,

        p_reason:
          input.reason,

        p_order_id:
          input.orderId ?? null,
      },
    );
  }

  async saveDispute(
    input: CustomerDisputeInput,
  ): Promise<void> {
    await this.rpc(
      "marketplace_save_customer_dispute",
      {
        p_id:
          input.id ?? null,

        p_customer_id:
          input.customerId,

        p_order_id:
          input.orderId ?? null,

        p_subject:
          input.subject,

        p_description:
          input.description ?? null,

        p_status:
          input.status,

        p_resolution:
          input.resolution ?? null,
      },
    );
  }
}