import {
  createSupabaseBrowserClient,
} from "@/infrastructure/supabase/client";

import type {
  MarketplaceBundleInput,
  MarketplacePartnershipInput,
  PromotionsV2Snapshot,
  PromotionV2Status,
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


function asSnapshot(
  value: unknown,
): PromotionsV2Snapshot {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    throw new Error(
      "Le serveur Promotions V2 a retourné une réponse invalide.",
    );
  }

  return value as PromotionsV2Snapshot;
}


export class PromotionsV2Repository {
  async load():
    Promise<PromotionsV2Snapshot> {
    const {
      data,
      error,
    } =
      await rpcClient().rpc(
        "marketplace_promotions_v2_snapshot",
      );

    if (error) {
      throw error;
    }

    return asSnapshot(data);
  }


  async saveBundle(
    input: MarketplaceBundleInput,
  ): Promise<void> {
    const {
      error,
    } =
      await rpcClient().rpc(
        "marketplace_save_bundle",
        {
          p_bundle_id:
            input.id ?? null,

          p_name:
            input.name,

          p_description:
            input.description,

          p_pricing_mode:
            input.pricingMode,

          p_fixed_price:
            input.fixedPrice,

          p_discount_percent:
            input.discountPercent,

          p_currency:
            input.currency,

          p_status:
            input.status,

          p_starts_at:
            input.startsAt,

          p_ends_at:
            input.endsAt,

          p_items:
            input.items,
        },
      );

    if (error) {
      throw error;
    }
  }


  async setBundleStatus(
    id: string,
    status: PromotionV2Status,
  ): Promise<void> {
    const {
      error,
    } =
      await rpcClient().rpc(
        "marketplace_set_bundle_status",
        {
          p_bundle_id:
            id,

          p_status:
            status,
        },
      );

    if (error) {
      throw error;
    }
  }


  async savePartnership(
    input: MarketplacePartnershipInput,
  ): Promise<void> {
    const {
      error,
    } =
      await rpcClient().rpc(
        "marketplace_save_partnership",
        {
          p_partnership_id:
            input.id ?? null,

          p_partner_organization_id:
            input.partnerOrganizationId,

          p_partner_name:
            input.partnerName,

          p_contact_name:
            input.contactName,

          p_contact_email:
            input.contactEmail,

          p_contact_phone:
            input.contactPhone,

          p_partnership_type:
            input.partnershipType,

          p_description:
            input.description,

          p_benefit_type:
            input.benefitType,

          p_benefit_value:
            input.benefitValue,

          p_currency:
            input.currency,

          p_promotion_code:
            input.promotionCode,

          p_status:
            input.status,

          p_starts_at:
            input.startsAt,

          p_ends_at:
            input.endsAt,

          p_product_ids:
            input.productIds,
        },
      );

    if (error) {
      throw error;
    }
  }


  async setPartnershipStatus(
    id: string,
    status: PromotionV2Status,
    note: string,
  ): Promise<void> {
    const {
      error,
    } =
      await rpcClient().rpc(
        "marketplace_set_partnership_status",
        {
          p_partnership_id:
            id,

          p_status:
            status,

          p_note:
            note || null,
        },
      );

    if (error) {
      throw error;
    }
  }
}