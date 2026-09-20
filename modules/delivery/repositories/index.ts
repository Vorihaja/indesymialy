import {
  createSupabaseBrowserClient,
} from "@/infrastructure/supabase/client";

import {
  createMarketplaceRuntimeRepository,
} from "@/modules/marketplace-core";

const marketplaceRuntimeRepository =
  createMarketplaceRuntimeRepository();

const supabase =
  createSupabaseBrowserClient();

export class DeliveryRepository {
  list() {
    return marketplaceRuntimeRepository
      .listDeliveries();
  }

  async updateMetadata(
    id: string,
    carrier: string,
    trackingNumber: string,
  ): Promise<void> {
    const {
      data,
      error,
    } =
      await supabase
        .from(
          "marketplace_deliveries",
        )
        .update({
          carrier:
            carrier.trim() ||
            null,

          tracking_number:
            trackingNumber.trim() ||
            null,

          updated_at:
            new Date().toISOString(),
        })
        .eq(
          "id",
          id,
        )
        .select(
          "id",
        )
        .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error(
        "Livraison introuvable ou non autorisée.",
      );
    }
  }
}