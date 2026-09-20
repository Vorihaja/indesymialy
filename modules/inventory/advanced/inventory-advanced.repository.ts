import type {
  SupabaseClient,
} from "@supabase/supabase-js";

import {
  createSupabaseBrowserClient,
} from "@/infrastructure/supabase/client";

import type {
  AdvancedInventoryProduct,
  AdvancedInventorySnapshot,
  AdvancedStockMovement,
  InventoryCount,
  InventoryCountLine,
  InventoryPhysicalCountInput,
  InventoryReservation,
  StockMovementType,
} from "./types";

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
): string {
  return typeof value === "string"
    ? value
    : fallback;
}

function nullableText(
  value: unknown,
): string | null {
  return typeof value === "string" &&
    value.length > 0
    ? value
    : null;
}

function numberValue(
  value: unknown,
): number {
  return Number(
    value ?? 0,
  );
}

export class AdvancedInventoryRepository {
  private readonly client:
    SupabaseClient;

  constructor() {
    this.client =
      (
        createSupabaseBrowserClient()
      ) as unknown as SupabaseClient;
  }

  private async sellerOrganizationId():
    Promise<string> {
    const auth =
      await this.client.auth.getUser();

    if (auth.error) {
      throw auth.error;
    }

    const user =
      auth.data.user;

    if (!user) {
      throw new Error(
        "Votre session utilisateur est introuvable.",
      );
    }

    const [
      activeResult,
      ownerResult,
      memberResult,
    ] =
      await Promise.all([
        this.client
          .from(
            "active_organizations",
          )
          .select(
            "organization_id",
          )
          .eq(
            "profile_id",
            user.id,
          )
          .maybeSingle(),

        this.client
          .from(
            "organizations",
          )
          .select(
            "id",
          )
          .eq(
            "owner_id",
            user.id,
          ),

        this.client
          .from(
            "organization_members",
          )
          .select(
            "organization_id,role,status",
          )
          .eq(
            "profile_id",
            user.id,
          ),
      ]);

    const sourceError =
      activeResult.error ??
      ownerResult.error ??
      memberResult.error;

    if (sourceError) {
      throw sourceError;
    }

    const ids =
      new Set<string>();

    rows(
      ownerResult.data,
    ).forEach(
      (row) => {
        const id =
          text(
            row.id,
          );

        if (id) {
          ids.add(id);
        }
      },
    );

    rows(
      memberResult.data,
    ).forEach(
      (row) => {
        const role =
          text(
            row.role,
          );

        const status =
          text(
            row.status,
            "active",
          );

        if (
          status === "active" &&
          [
            "owner",
            "admin",
            "manager",
            "seller",
          ].includes(
            role,
          )
        ) {
          const id =
            text(
              row.organization_id,
            );

          if (id) {
            ids.add(id);
          }
        }
      },
    );

    if (!ids.size) {
      throw new Error(
        "Aucune organisation vendeuse autorisée n’est disponible.",
      );
    }

    const organizations =
      await this.client
        .from(
          "organizations",
        )
        .select(
          "id,type,status",
        )
        .in(
          "id",
          [...ids],
        );

    if (organizations.error) {
      throw organizations.error;
    }

    const sellers =
      rows(
        organizations.data,
      ).filter(
        (row) =>
          text(
            row.type,
          ) === "seller" &&
          text(
            row.status,
            "active",
          ) === "active",
      );

    const activeId =
      activeResult.data
        ? text(
            (
              activeResult.data as
                Record<string, unknown>
            ).organization_id,
          )
        : "";

    const activeSeller =
      sellers.find(
        (row) =>
          text(
            row.id,
          ) === activeId,
      );

    if (activeSeller) {
      return text(
        activeSeller.id,
      );
    }

    if (
      sellers.length === 1
    ) {
      return text(
        sellers[0].id,
      );
    }

    if (
      sellers.length > 1
    ) {
      throw new Error(
        "Plusieurs organisations vendeuses sont disponibles. Activez celle que vous souhaitez gérer.",
      );
    }

    throw new Error(
      "Aucune organisation vendeuse active n’est disponible.",
    );
  }

  async snapshot():
    Promise<AdvancedInventorySnapshot> {
    const organizationId =
      await this.sellerOrganizationId();

    const productResult =
      await this.client
        .from(
          "products",
        )
        .select(
          "id,name",
        )
        .eq(
          "seller_id",
          organizationId,
        );

    if (productResult.error) {
      throw productResult.error;
    }

    const productRows =
      rows(
        productResult.data,
      );

    const productIds =
      productRows
        .map(
          (row) =>
            text(
              row.id,
            ),
        )
        .filter(Boolean);

    const names =
      new Map<string, string>(
        productRows.map(
          (row) => [
            text(
              row.id,
            ),

            text(
              row.name,
              "Produit",
            ),
          ],
        ),
      );

    if (!productIds.length) {
      return {
        organizationId,
        products: [],
        movements: [],
        reservations: [],
        counts: [],
        activeCount: null,
      };
    }

    const [
      inventoryResult,
      movementResult,
      reservationResult,
      countResult,
    ] =
      await Promise.all([
        this.client
          .from(
            "marketplace_inventory",
          )
          .select(
            "product_id,available,reserved,low_stock_threshold,updated_at",
          )
          .in(
            "product_id",
            productIds,
          ),

        this.client
          .from(
            "marketplace_stock_movements",
          )
          .select(
            "id,product_id,movement_type,quantity,reason,order_id,created_at",
          )
          .in(
            "product_id",
            productIds,
          )
          .order(
            "created_at",
            {
              ascending: false,
            },
          )
          .limit(
            500,
          ),

        this.client.rpc(
          "marketplace_list_inventory_reservations",
          {
            p_seller_organization_id:
              organizationId,
          },
        ),

        this.client
          .from(
            "marketplace_inventory_counts",
          )
          .select(
            "id,status,note,started_at,completed_at,created_at,updated_at",
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
          )
          .limit(
            25,
          ),
      ]);

    const sourceError =
      inventoryResult.error ??
      movementResult.error ??
      reservationResult.error ??
      countResult.error;

    if (sourceError) {
      throw sourceError;
    }

    const products:
      AdvancedInventoryProduct[] =
        rows(
          inventoryResult.data,
        ).map(
          (row) => {
            const available =
              numberValue(
                row.available,
              );

            const reserved =
              numberValue(
                row.reserved,
              );

            const productId =
              text(
                row.product_id,
              );

            return {
              productId,

              title:
                names.get(
                  productId,
                ) ??
                "Produit",

              available,

              reserved,

              physical:
                available +
                reserved,

              lowStockThreshold:
                numberValue(
                  row.low_stock_threshold,
                ),

              updatedAt:
                text(
                  row.updated_at,
                ),
            };
          },
        );

    const movements:
      AdvancedStockMovement[] =
        rows(
          movementResult.data,
        ).map(
          (row) => {
            const productId =
              text(
                row.product_id,
              );

            return {
              id:
                text(
                  row.id,
                ),

              productId,

              productTitle:
                names.get(
                  productId,
                ) ??
                "Produit",

              type:
                text(
                  row.movement_type,
                ) as
                  StockMovementType,

              quantity:
                numberValue(
                  row.quantity,
                ),

              reason:
                text(
                  row.reason,
                ),

              orderId:
                nullableText(
                  row.order_id,
                ),

              createdAt:
                text(
                  row.created_at,
                ),
            };
          },
        );

    const reservations:
      InventoryReservation[] =
        rows(
          reservationResult.data,
        ).map(
          (row) => ({
            key:
              text(
                row.order_id,
              ) +
              ":" +
              text(
                row.product_id,
              ),

            orderId:
              text(
                row.order_id,
              ),

            productId:
              text(
                row.product_id,
              ),

            productTitle:
              text(
                row.product_title,
                "Produit",
              ),

            quantity:
              numberValue(
                row.quantity,
              ),

            orderStatus:
              text(
                row.order_status,
              ),

            customerName:
              text(
                row.customer_name,
              ),

            orderCreatedAt:
              text(
                row.order_created_at,
              ),
          }),
        );

    const countRows =
      rows(
        countResult.data,
      );

    const countIds =
      countRows
        .map(
          (row) =>
            text(
              row.id,
            ),
        )
        .filter(Boolean);

    let lineRows:
      Row[] =
        [];

    if (countIds.length) {
      const lineResult =
        await this.client
          .from(
            "marketplace_inventory_count_lines",
          )
          .select(
            "id,count_id,product_id,theoretical_available,theoretical_reserved,theoretical_physical,counted_physical,applied_delta,counted_at",
          )
          .in(
            "count_id",
            countIds,
          );

      if (lineResult.error) {
        throw lineResult.error;
      }

      lineRows =
        rows(
          lineResult.data,
        );
    }

    const linesByCount =
      new Map<
        string,
        InventoryCountLine[]
      >();

    lineRows.forEach(
      (row) => {
        const countId =
          text(
            row.count_id,
          );

        const productId =
          text(
            row.product_id,
          );

        const line:
          InventoryCountLine = {
            id:
              text(
                row.id,
              ),

            productId,

            productTitle:
              names.get(
                productId,
              ) ??
              "Produit",

            theoreticalAvailable:
              numberValue(
                row.theoretical_available,
              ),

            theoreticalReserved:
              numberValue(
                row.theoretical_reserved,
              ),

            theoreticalPhysical:
              numberValue(
                row.theoretical_physical,
              ),

            countedPhysical:
              row.counted_physical ===
                null ||
              row.counted_physical ===
                undefined
                ? null
                : numberValue(
                    row.counted_physical,
                  ),

            appliedDelta:
              numberValue(
                row.applied_delta,
              ),

            countedAt:
              nullableText(
                row.counted_at,
              ),
          };

        const current =
          linesByCount.get(
            countId,
          ) ??
          [];

        current.push(
          line,
        );

        linesByCount.set(
          countId,
          current,
        );
      },
    );

    const counts:
      InventoryCount[] =
        countRows.map(
          (row) => {
            const id =
              text(
                row.id,
              );

            return {
              id,

              status:
                text(
                  row.status,
                  "draft",
                ) as
                  InventoryCount["status"],

              note:
                nullableText(
                  row.note,
                ),

              startedAt:
                text(
                  row.started_at,
                ),

              completedAt:
                nullableText(
                  row.completed_at,
                ),

              createdAt:
                text(
                  row.created_at,
                ),

              updatedAt:
                text(
                  row.updated_at,
                ),

              lines:
                (
                  linesByCount.get(
                    id,
                  ) ??
                  []
                ).sort(
                  (
                    left,
                    right,
                  ) =>
                    left.productTitle
                      .localeCompare(
                        right.productTitle,
                        "fr",
                      ),
                ),
            };
          },
        );

    return {
      organizationId,

      products:
        products.sort(
          (
            left,
            right,
          ) =>
            left.title.localeCompare(
              right.title,
              "fr",
            ),
        ),

      movements,

      reservations,

      counts,

      activeCount:
        counts.find(
          (count) =>
            count.status ===
            "draft",
        ) ??
        null,
    };
  }

  async adjust(
    productId: string,
    delta: number,
    reason: string,
  ): Promise<void> {
    const organizationId =
      await this.sellerOrganizationId();

    const result =
      await this.client.rpc(
        "marketplace_adjust_stock",
        {
          p_product_id:
            productId,

          p_seller_organization_id:
            organizationId,

          p_delta:
            delta,

          p_reason:
            reason,
        },
      );

    if (result.error) {
      throw result.error;
    }
  }

  async setThreshold(
    productId: string,
    threshold: number,
  ): Promise<void> {
    const organizationId =
      await this.sellerOrganizationId();

    const result =
      await this.client.rpc(
        "marketplace_set_low_stock_threshold",
        {
          p_product_id:
            productId,

          p_seller_organization_id:
            organizationId,

          p_threshold:
            threshold,
        },
      );

    if (result.error) {
      throw result.error;
    }
  }

  async startCount(
    note?: string,
  ): Promise<string> {
    const organizationId =
      await this.sellerOrganizationId();

    const result =
      await this.client.rpc(
        "marketplace_start_inventory_count",
        {
          p_seller_organization_id:
            organizationId,

          p_note:
            note?.trim() ||
            null,
        },
      );

    if (result.error) {
      throw result.error;
    }

    const id =
      text(
        result.data,
      );

    if (!id) {
      throw new Error(
        "L’inventaire physique n’a retourné aucun identifiant.",
      );
    }

    return id;
  }

  async saveCount(
    countId: string,
    values:
      InventoryPhysicalCountInput[],
  ): Promise<void> {
    const organizationId =
      await this.sellerOrganizationId();

    const result =
      await this.client.rpc(
        "marketplace_save_inventory_count",
        {
          p_count_id:
            countId,

          p_seller_organization_id:
            organizationId,

          p_counts:
            values,
        },
      );

    if (result.error) {
      throw result.error;
    }
  }

  async finalizeCount(
    countId: string,
  ): Promise<void> {
    const organizationId =
      await this.sellerOrganizationId();

    const result =
      await this.client.rpc(
        "marketplace_finalize_inventory_count",
        {
          p_count_id:
            countId,

          p_seller_organization_id:
            organizationId,
        },
      );

    if (result.error) {
      throw result.error;
    }
  }

  async cancelCount(
    countId: string,
  ): Promise<void> {
    const organizationId =
      await this.sellerOrganizationId();

    const result =
      await this.client.rpc(
        "marketplace_cancel_inventory_count",
        {
          p_count_id:
            countId,

          p_seller_organization_id:
            organizationId,
        },
      );

    if (result.error) {
      throw result.error;
    }
  }
}