import type {
  SupabaseClient,
} from "@supabase/supabase-js";

import {
  createSupabaseBrowserClient,
} from "@/infrastructure/supabase/client";

import type {
  PromotionCampaign,
  PromotionCampaignInput,
  PromotionCode,
  PromotionCodeInput,
  PromotionCodeStatus,
  PromotionDiscountType,
  PromotionsSnapshot,
  PromotionStatus,
} from "../types";

type Row =
  Record<string, unknown>;

function rows(
  value: unknown,
): Row[] {
  return Array.isArray(value)
    ? value as Row[]
    : [];
}

function text(
  value: unknown,
  fallback = "",
) {
  return typeof value === "string"
    ? value
    : fallback;
}

function nullableText(
  value: unknown,
) {
  const result =
    text(value);

  return result
    ? result
    : null;
}

function numeric(
  value: unknown,
) {
  return Number(
    value ?? 0,
  );
}

function nullableNumber(
  value: unknown,
): number | null {
  return value === null ||
    value === undefined
    ? null
    : Number(value);
}

export class PromotionsRepository {
  private readonly client:
    SupabaseClient;

  constructor() {
    this.client =
      (
        createSupabaseBrowserClient()
      ) as unknown as SupabaseClient;
  }

  private async organizationId():
    Promise<string> {
    const {
      data,
      error,
    } =
      await this.client.rpc(
        "marketplace_current_seller_organization",
      );

    if (error) {
      throw error;
    }

    const id =
      text(data);

    if (!id) {
      throw new Error(
        "Organisation vendeuse introuvable.",
      );
    }

    return id;
  }

  async snapshot():
    Promise<PromotionsSnapshot> {
    const organizationId =
      await this.organizationId();

    const [
      campaignsResult,
      productsResult,
      linksResult,
      codesResult,
    ] =
      await Promise.all([
        this.client
          .from(
            "marketplace_promotions",
          )
          .select(
            "id,seller_organization_id,name,description,discount_type,discount_value,currency,status,starts_at,ends_at,min_order_amount,max_discount_amount,usage_limit,usage_count,created_at,updated_at",
          )
          .eq(
            "seller_organization_id",
            organizationId,
          )
          .order(
            "created_at",
            {
              ascending: false,
            },
          ),

        this.client
          .from(
            "products",
          )
          .select(
            "id,name",
          )
          .eq(
            "seller_id",
            organizationId,
          )
          .order(
            "name",
            {
              ascending: true,
            },
          ),

        this.client
          .from(
            "marketplace_promotion_products",
          )
          .select(
            "promotion_id,product_id",
          ),

        this.client
          .from(
            "marketplace_promotion_codes",
          )
          .select(
            "id,promotion_id,code,status,usage_limit,usage_count,created_at,updated_at",
          )
          .order(
            "created_at",
            {
              ascending: false,
            },
          ),
      ]);

    const sourceError =
      campaignsResult.error ??
      productsResult.error ??
      linksResult.error ??
      codesResult.error;

    if (sourceError) {
      throw sourceError;
    }

    const productIdsByCampaign =
      new Map<string, string[]>();

    rows(
      linksResult.data,
    ).forEach(
      (row) => {
        const campaignId =
          text(
            row.promotion_id,
          );

        const productId =
          text(
            row.product_id,
          );

        const current =
          productIdsByCampaign.get(
            campaignId,
          ) ??
          [];

        current.push(
          productId,
        );

        productIdsByCampaign.set(
          campaignId,
          current,
        );
      },
    );

    const campaigns:
      PromotionCampaign[] =
        rows(
          campaignsResult.data,
        ).map(
          (
            row,
          ): PromotionCampaign => {
            const id =
              text(
                row.id,
              );

            return {
              id,

              sellerOrganizationId:
                text(
                  row.seller_organization_id,
                ),

              name:
                text(
                  row.name,
                ),

              description:
                nullableText(
                  row.description,
                ),

              discountType:
                text(
                  row.discount_type,
                ) as PromotionDiscountType,

              discountValue:
                numeric(
                  row.discount_value,
                ),

              currency:
                text(
                  row.currency,
                  "MGA",
                ),

              status:
                text(
                  row.status,
                  "draft",
                ) as PromotionStatus,

              startsAt:
                nullableText(
                  row.starts_at,
                ),

              endsAt:
                nullableText(
                  row.ends_at,
                ),

              minOrderAmount:
                numeric(
                  row.min_order_amount,
                ),

              maxDiscountAmount:
                nullableNumber(
                  row.max_discount_amount,
                ),

              usageLimit:
                nullableNumber(
                  row.usage_limit,
                ),

              usageCount:
                numeric(
                  row.usage_count,
                ),

              productIds:
                productIdsByCampaign.get(
                  id,
                ) ??
                [],

              createdAt:
                text(
                  row.created_at,
                ),

              updatedAt:
                text(
                  row.updated_at,
                ),
            };
          },
        );

    const codes:
      PromotionCode[] =
        rows(
          codesResult.data,
        ).map(
          (
            row,
          ): PromotionCode => ({
            id:
              text(
                row.id,
              ),

            promotionId:
              text(
                row.promotion_id,
              ),

            code:
              text(
                row.code,
              ),

            status:
              text(
                row.status,
                "active",
              ) as PromotionCodeStatus,

            usageLimit:
              nullableNumber(
                row.usage_limit,
              ),

            usageCount:
              numeric(
                row.usage_count,
              ),

            createdAt:
              text(
                row.created_at,
              ),

            updatedAt:
              text(
                row.updated_at,
              ),
          }),
        );

    return {
      organizationId,

      campaigns,

      codes,

      products:
        rows(
          productsResult.data,
        ).map(
          (row) => ({
            id:
              text(
                row.id,
              ),

            name:
              text(
                row.name,
                "Produit",
              ),

          }),
        ),
    };
  }

  async saveCampaign(
    input:
      PromotionCampaignInput,
  ): Promise<string> {
    const {
      data,
      error,
    } =
      await this.client.rpc(
        "marketplace_save_promotion",
        {
          p_promotion_id:
            input.id ??
            null,

          p_name:
            input.name,

          p_description:
            input.description,

          p_discount_type:
            input.discountType,

          p_discount_value:
            input.discountValue,

          p_currency:
            input.currency,

          p_status:
            input.status,

          p_starts_at:
            input.startsAt,

          p_ends_at:
            input.endsAt,

          p_min_order_amount:
            input.minOrderAmount,

          p_max_discount_amount:
            input.maxDiscountAmount,

          p_usage_limit:
            input.usageLimit,

          p_product_ids:
            input.productIds,
        },
      );

    if (error) {
      throw error;
    }

    const id =
      text(data);

    if (!id) {
      throw new Error(
        "La campagne n’a retourné aucun identifiant.",
      );
    }

    return id;
  }

  async setCampaignStatus(
    id: string,
    status:
      PromotionStatus,
  ): Promise<void> {
    const {
      error,
    } =
      await this.client.rpc(
        "marketplace_set_promotion_status",
        {
          p_promotion_id:
            id,

          p_status:
            status,
        },
      );

    if (error) {
      throw error;
    }
  }

  async saveCode(
    input:
      PromotionCodeInput,
  ): Promise<string> {
    const {
      data,
      error,
    } =
      await this.client.rpc(
        "marketplace_save_promotion_code",
        {
          p_code_id:
            input.id ??
            null,

          p_promotion_id:
            input.promotionId,

          p_code:
            input.code,

          p_status:
            input.status,

          p_usage_limit:
            input.usageLimit,
        },
      );

    if (error) {
      throw error;
    }

    const id =
      text(data);

    if (!id) {
      throw new Error(
        "Le code promo n’a retourné aucun identifiant.",
      );
    }

    return id;
  }

  async setCodeStatus(
    id: string,
    status:
      PromotionCodeStatus,
  ): Promise<void> {
    const {
      error,
    } =
      await this.client.rpc(
        "marketplace_set_promotion_code_status",
        {
          p_code_id:
            id,

          p_status:
            status,
        },
      );

    if (error) {
      throw error;
    }
  }
}