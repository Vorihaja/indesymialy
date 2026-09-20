import {
  createSupabaseBrowserClient,
} from "@/infrastructure/supabase/client";

import type {
  CreateReturnInput,
  DeliveryAdvancedSnapshot,
  DeliveryCarrierInput,
  DeliveryZoneInput,
  MarketplaceReturnResolution,
  MarketplaceReturnStatus,
} from "./types";


type RpcResult = {
  data: unknown;
  error: unknown;
};


type RpcClient = {
  rpc(
    name: string,
    args?: Record<string, unknown>,
  ): PromiseLike<RpcResult>;
};


function rpcClient(): RpcClient {
  return createSupabaseBrowserClient() as unknown as RpcClient;
}


function snapshot(
  value: unknown,
): DeliveryAdvancedSnapshot {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    throw new Error(
      "Le serveur Livraison a retourné une réponse invalide.",
    );
  }

  return value as DeliveryAdvancedSnapshot;
}


export class DeliveryAdvancedRepository {
  async load():
    Promise<DeliveryAdvancedSnapshot> {
    const {
      data,
      error,
    } =
      await rpcClient().rpc(
        "marketplace_delivery_management_snapshot",
      );

    if (error) {
      throw error;
    }

    return snapshot(data);
  }


  async saveCarrier(
    input: DeliveryCarrierInput,
  ): Promise<void> {
    const {
      error,
    } =
      await rpcClient().rpc(
        "marketplace_save_delivery_carrier",
        {
          p_id:
            input.id ?? null,

          p_name:
            input.name,

          p_phone:
            input.phone || null,

          p_email:
            input.email || null,

          p_website:
            input.website || null,

          p_tracking_url_template:
            input.trackingUrlTemplate ||
            null,

          p_notes:
            input.notes || null,

          p_status:
            input.status,
        },
      );

    if (error) {
      throw error;
    }
  }


  async archiveCarrier(
    id: string,
  ): Promise<void> {
    const {
      error,
    } =
      await rpcClient().rpc(
        "marketplace_archive_delivery_carrier",
        {
          p_id:
            id,
        },
      );

    if (error) {
      throw error;
    }
  }


  async assignCarrier(
    deliveryId: string,
    carrierId: string | null,
    trackingNumber: string,
  ): Promise<void> {
    const {
      error,
    } =
      await rpcClient().rpc(
        "marketplace_assign_delivery_carrier",
        {
          p_delivery_id:
            deliveryId,

          p_carrier_id:
            carrierId,

          p_tracking_number:
            trackingNumber || null,
        },
      );

    if (error) {
      throw error;
    }
  }


  async saveZone(
    input: DeliveryZoneInput,
  ): Promise<void> {
    const {
      error,
    } =
      await rpcClient().rpc(
        "marketplace_save_delivery_zone",
        {
          p_id:
            input.id ?? null,

          p_name:
            input.name,

          p_delivery_fee:
            input.deliveryFee,

          p_currency:
            input.currency,

          p_min_delivery_days:
            input.minDeliveryDays,

          p_max_delivery_days:
            input.maxDeliveryDays,

          p_free_delivery_threshold:
            input.freeDeliveryThreshold,

          p_status:
            input.status,

          p_areas:
            input.areas,
        },
      );

    if (error) {
      throw error;
    }
  }


  async archiveZone(
    id: string,
  ): Promise<void> {
    const {
      error,
    } =
      await rpcClient().rpc(
        "marketplace_archive_delivery_zone",
        {
          p_id:
            id,
        },
      );

    if (error) {
      throw error;
    }
  }


  async createReturn(
    input: CreateReturnInput,
  ): Promise<void> {
    const {
      error,
    } =
      await rpcClient().rpc(
        "marketplace_create_return",
        {
          p_order_id:
            input.orderId,

          p_reason:
            input.reason,

          p_items:
            input.items,
        },
      );

    if (error) {
      throw error;
    }
  }


  async transitionReturn(
    id: string,
    status: MarketplaceReturnStatus,
    note: string,
    resolution?: MarketplaceReturnResolution,
  ): Promise<void> {
    const {
      error,
    } =
      await rpcClient().rpc(
        "marketplace_transition_return",
        {
          p_return_id:
            id,

          p_status:
            status,

          p_note:
            note || null,

          p_resolution:
            resolution ?? null,
        },
      );

    if (error) {
      throw error;
    }
  }
}