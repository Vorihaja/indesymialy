import type {
  SellerPerformanceSnapshot,
} from "../types";

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

export class SellerPerformanceRepository {
  constructor(
    private readonly client: unknown,
  ) {}

  async snapshot(
    from: string,
    to: string,
  ): Promise<SellerPerformanceSnapshot> {
    const result =
      await (
        this.client as RpcRuntime
      ).rpc(
        "marketplace_seller_performance_snapshot",
        {
          p_from:
            from,

          p_to:
            to,
        },
      );

    if (result.error) {
      throw new Error(
        result.error.message,
      );
    }

    if (
      !result.data ||
      typeof result.data !== "object" ||
      Array.isArray(result.data)
    ) {
      throw new Error(
        "Réponse Performance invalide.",
      );
    }

    return result.data as SellerPerformanceSnapshot;
  }
}