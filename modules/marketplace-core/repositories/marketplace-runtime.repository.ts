import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/infrastructure/supabase/database.types";
import { createSupabaseBrowserClient } from "@/infrastructure/supabase/client";
import { normalizeBackendError } from "@/shared/errors/backend-error";
import type { MarketplaceStoreRepository } from "./marketplace-store.repository";
import { MarketplaceSupabaseRepository } from "./marketplace-supabase.repository";
import type { CartItem, CheckoutInput, DeliveryRecord, MarketplaceOrder, MarketplaceTransaction, OrderLine, OrderStatus, OrderStatusEntry, PaymentMethod, RentalSelection, SellerCustomer, SellerStatistics } from "../types";

type Row = Record<string, unknown>;
const rows = (value: unknown): Row[] => Array.isArray(value) ? value as Row[] : [];
const str = (value: unknown, fallback = "") => typeof value === "string" ? value : fallback;
const num = (value: unknown) => Number(value ?? 0);
const methods: Record<string, PaymentMethod> = {
  cash: { id: "cash", label: "Paiement ÃƒÂ  la remise", type: "cash", enabled: true },
  mobile_money: { id: "mobile_money", label: "Mobile Money", type: "mobile_money", enabled: true },
  card: { id: "card", label: "Carte bancaire", type: "card", enabled: true },
  bank_transfer: { id: "bank_transfer", label: "Virement bancaire", type: "bank_transfer", enabled: true },
};

export class MarketplaceRuntimeRepository
  extends MarketplaceSupabaseRepository
  implements MarketplaceStoreRepository {
  private readonly runtime: SupabaseClient;
  constructor(client: SupabaseClient<Database>) { super(client); this.runtime = client as unknown as SupabaseClient; }

  // BAZAR-B1-A3-SELLER-CONTEXT
  async sellerContext(): Promise<import("../types").MarketplaceSellerContext> {
    return this.safe(async () => {
      const authResult =
        await this.runtime.auth.getUser();

      if (authResult.error) {
        throw authResult.error;
      }

      const user =
        authResult.data.user;

      if (!user) {
        throw new Error(
          "Votre session utilisateur est introuvable.",
        );
      }

      const [
        activeResult,
        ownedResult,
        membershipsResult,
      ] = await Promise.all([
        this.runtime
          .from("active_organizations")
          .select("organization_id")
          .eq("profile_id", user.id)
          .maybeSingle(),

        this.runtime
          .from("organizations")
          .select("id")
          .eq("owner_id", user.id),

        this.runtime
          .from("organization_members")
          .select("organization_id,role,status")
          .eq("profile_id", user.id),
      ]);

      const firstError =
        activeResult.error ??
        ownedResult.error ??
        membershipsResult.error;

      if (firstError) {
        throw firstError;
      }

      const allowedMembershipRoles =
        new Set([
          "owner",
          "admin",
          "manager",
          "seller",
        ]);

      const organizationIds =
        new Set<string>();

      rows(
        ownedResult.data,
      ).forEach(
        (organization) => {
          const organizationId =
            str(
              organization.id,
            );

          if (organizationId) {
            organizationIds.add(
              organizationId,
            );
          }
        },
      );

      rows(
        membershipsResult.data,
      ).forEach(
        (membership) => {
          const role =
            str(
              membership.role,
            );

          const status =
            str(
              membership.status,
              "active",
            );

          if (
            status !== "active" ||
            !allowedMembershipRoles.has(
              role,
            )
          ) {
            return;
          }

          const organizationId =
            str(
              membership.organization_id,
            );

          if (organizationId) {
            organizationIds.add(
              organizationId,
            );
          }
        },
      );

      const ids =
        [...organizationIds];

      if (!ids.length) {
        return {
          organization: null,
          candidates: [],
          requiresSelection: false,
        };
      }

      const organizationsResult =
        await this.runtime
          .from("organizations")
          .select(
            "id,name,type,owner_id,status,deactivated_at",
          )
          .in(
            "id",
            ids,
          );

      if (organizationsResult.error) {
        throw organizationsResult.error;
      }

      const candidates =
        rows(
          organizationsResult.data,
        )
          .filter(
            (organization) => {
              if (
                organization.deactivated_at
              ) {
                return false;
              }

              return (
                str(
                  organization.status,
                  "active",
                ) === "active"
              );
            },
          )
          .map(
            (organization) => ({
              id:
                str(
                  organization.id,
                ),

              name:
                str(
                  organization.name,
                  "Vendeur",
                ),

              type:
                str(
                  organization.type,
                ),

              ownerId:
                str(
                  organization.owner_id,
                ),
            }),
          )
          .filter(
            (organization) =>
              Boolean(
                organization.id,
              ),
          );

      if (!candidates.length) {
        return {
          organization: null,
          candidates: [],
          requiresSelection: false,
        };
      }

      const activeOrganizationId =
        activeResult.data
          ? str(
              activeResult
                .data
                .organization_id,
            )
          : "";

      if (activeOrganizationId) {
        const activeOrganization =
          candidates.find(
            (organization) =>
              organization.id ===
              activeOrganizationId,
          );

        if (activeOrganization) {
          return {
            organization:
              activeOrganization,

            candidates,

            requiresSelection:
              false,
          };
        }
      }

      if (
        candidates.length ===
        1
      ) {
        return {
          organization:
            candidates[0],

          candidates,

          requiresSelection:
            false,
        };
      }

      return {
        organization: null,
        candidates,
        requiresSelection: true,
      };
    });
  }

  async listProducts(): Promise<import("../types").MarketplaceProduct[]> {
    return this.safe(async () => {
      const [base, extensions, images, categories, organizations] = await Promise.all([
        this.runtime.from("products").select("id,name,price,seller_id,stock"),
        this.runtime.from("marketplace_products").select("*"),
        this.runtime.from("marketplace_product_images").select("product_id,storage_path,sort_order"),
        this.runtime.from("marketplace_categories").select("id,name,slug"),
        this.runtime.from("organizations").select("id,name"),
      ]);
      for (const result of [base, extensions, images, categories, organizations]) if (result.error) throw result.error;
      const extensionMap = new Map(rows(extensions.data).map(item => [str(item.product_id), item]));
      const categoryMap = new Map(rows(categories.data).map((item) => [str(item.id), { name: str(item.name), slug: str(item.slug) }]));
      const sellerMap = new Map(rows(organizations.data).map(item => [str(item.id), str(item.name)]));
      const imageMap = new Map<string,string[]>();
      rows(images.data).sort((a,b) => num(a.sort_order)-num(b.sort_order)).forEach(item => { const id=str(item.product_id); imageMap.set(id,[...(imageMap.get(id) ?? []),str(item.storage_path)]); });
      return rows(base.data).flatMap(product => {
        const extension=extensionMap.get(str(product.id)); if(!extension) return [];
        const id=str(product.id); const listingType=str(extension.listing_type) as import("../types").MarketplaceProduct["type"];
        return [{ id, title:str(product.name), description:str(extension.description), type:listingType, category:categoryMap.get(str(extension.category_id))?.name ?? "", categorySlug:categoryMap.get(str(extension.category_id))?.slug ?? "", salePrice:listingType === "rental" ? null : num(product.price), rentalPricePerDay:extension.rental_price_per_day == null ? null : num(extension.rental_price_per_day), depositAmount:extension.deposit_amount == null ? null : num(extension.deposit_amount), stock:num(product.stock), condition:str(extension.condition,"new") as import("../types").MarketplaceProduct["condition"], images:imageMap.get(id) ?? [], sellerId:str(product.seller_id), sellerName:sellerMap.get(str(product.seller_id)) ?? "Vendeur", location:str(extension.location), status:str(extension.status,"draft") as import("../types").MarketplaceProduct["status"], popularity:num(extension.popularity), createdAt:str(extension.created_at), updatedAt:str(extension.updated_at) }];
      });
    });
  }

  async findProduct(id: string) { return (await this.listProducts()).find(product => product.id === id) ?? null; }

  async createProduct(input: import("../types").ProductInput) {
    return this.safe(async () => {
      const sellerOrganizationId =
        await this.sellerOrganizationId();

      const result =
        await this.runtime.rpc(
          "marketplace_create_product",
          {
            p_seller_organization_id:
              sellerOrganizationId,

            p_title:
              input.title,

            p_description:
              input.description,

            p_listing_type:
              input.type,

            p_category:
              input.category,

            p_sale_price:
              input.salePrice ?? null,

            p_rental_price_per_day:
              input.rentalPricePerDay ?? null,

            p_deposit_amount:
              input.depositAmount ?? null,

            p_stock:
              input.stock,

            p_condition:
              input.condition,

            p_location:
              input.location,

            p_status:
              input.status,

            p_images:
              input.images,
          },
        );

      if (result.error) {
        throw new Error(
          result.error.message,
        );
      }

      const productId =
        str(
          result.data,
        );

      if (!productId) {
        throw new Error(
          "La creation atomique du produit n'a retourne aucun identifiant.",
        );
      }

      const product =
        await this.findProduct(
          productId,
        );

      if (!product) {
        throw new Error(
          "Le produit cree est introuvable apres la transaction PostgreSQL.",
        );
      }

      return product;
    });
  }
  async updateProduct(id: string, input: import("../types").ProductInput) {
    return this.safe(async () => {
      const sellerOrganizationId =
        await this.sellerOrganizationId();

      const result =
        await this.runtime.rpc(
          "marketplace_update_product",
          {
            p_product_id:
              id,

            p_seller_organization_id:
              sellerOrganizationId,

            p_title:
              input.title,

            p_description:
              input.description,

            p_listing_type:
              input.type,

            p_category:
              input.category,

            p_sale_price:
              input.salePrice ?? null,

            p_rental_price_per_day:
              input.rentalPricePerDay ?? null,

            p_deposit_amount:
              input.depositAmount ?? null,

            p_stock:
              input.stock,

            p_condition:
              input.condition,

            p_location:
              input.location,

            p_status:
              input.status,

            p_images:
              input.images,
          },
        );

      if (result.error) {
        throw result.error;
      }

      const productId =
        str(
          result.data,
        );

      if (!productId) {
        throw new Error(
          "La modification atomique du produit n'a retourne aucun identifiant.",
        );
      }

      const product =
        await this.findProduct(
          productId,
        );

      if (!product) {
        throw new Error(
          "Le produit modifie est introuvable apres la transaction PostgreSQL.",
        );
      }

      return product;
    });
  }
  async setProductStatus(
    id: string,
    targetStatus: import("../types").ProductLifecycleTarget,
  ): Promise<import("../types").MarketplaceProduct> {
    return this.safe(async () => {
      const sellerOrganizationId =
        await this.sellerOrganizationId();

      const result =
        await this.runtime.rpc(
          "marketplace_set_product_status",
          {
            p_product_id:
              id,

            p_seller_organization_id:
              sellerOrganizationId,

            p_target_status:
              targetStatus,
          },
        );

      if (result.error) {
        throw result.error;
      }

      const productId =
        str(
          result.data,
        );

      if (!productId) {
        throw new Error(
          "La transition de cycle de vie n'a retourne aucun identifiant de produit.",
        );
      }

      const product =
        await this.findProduct(
          productId,
        );

      if (!product) {
        throw new Error(
          "Produit introuvable apres la transition de cycle de vie.",
        );
      }

      return product;
    });
  }

  async deleteProduct(
    id: string,
  ): Promise<void> {
    await this.setProductStatus(
      id,
      "archived",
    );
  }
  async listCart(): Promise<CartItem[]> {
    return this.safe(async () => {
      const userId = await this.user(false); if (!userId) return [];
      const cartId = await this.cartId(userId, false); if (!cartId) return [];
      const result = await this.runtime.from("marketplace_cart_items").select("*").eq("cart_id", cartId); if (result.error) throw result.error;
      const products = new Map((await this.listProducts()).map((product) => [product.id, product]));
      return rows(result.data).flatMap((item) => {
        const product = products.get(str(item.product_id)); if (!product) return [];
        return [{ id: str(item.id), productId: product.id, product, quantity: num(item.quantity), mode: str(item.mode) as CartItem["mode"], rental: item.mode === "rental" ? this.rental(item, product.depositAmount ?? 0) : undefined }];
      });
    });
  }

  async setCartItem(product: CartItem["product"], quantity: number, mode: CartItem["mode"], rental?: RentalSelection): Promise<void> {
    await this.safe(async () => {
      const cartId = await this.cartId(await this.user(), true);
      const result = await this.runtime.from("marketplace_cart_items").upsert({ cart_id: cartId, product_id: product.id, quantity: Math.max(1, quantity), mode, rental_start: rental?.startDate || null, rental_end: rental?.endDate || null, updated_at: new Date().toISOString() }, { onConflict: "cart_id,product_id,mode" });
      if (result.error) throw result.error;
    });
  }

  async removeCartItem(id: string): Promise<void> { await this.safe(async () => { const result = await this.runtime.from("marketplace_cart_items").delete().eq("id", id); if (result.error) throw result.error; }); }
  async clearCart(): Promise<void> { await this.safe(async () => { const userId = await this.user(false); if (!userId) return; const cartId = await this.cartId(userId, false); if (!cartId) return; const result = await this.runtime.from("marketplace_cart_items").delete().eq("cart_id", cartId); if (result.error) throw result.error; }); }

  async createOrder(input: CheckoutInput): Promise<MarketplaceOrder> {
    return this.safe(async () => {
      const cartId = await this.cartId(await this.user(), false); if (!cartId) throw new Error("Le panier est vide.");
      const result = await this.runtime.rpc("marketplace_checkout", { p_cart_id: cartId, p_customer_name: input.customerName, p_customer_email: input.customerEmail, p_customer_phone: input.customerPhone, p_fulfillment_method: input.fulfillment, p_delivery_address: input.address, p_payment_method: input.paymentMethod.type, p_idempotency_key: crypto.randomUUID() });
      if (result.error) throw result.error;
      const id = str(rows(result.data)[0]?.order_id); const order = id ? await this.findOrder(id) : null;
      if (!order) throw new Error("La commande n'a pas ÃƒÂ©tÃƒÂ© crÃƒÂ©ÃƒÂ©e."); return order;
    });
  }

  async listOrders(): Promise<MarketplaceOrder[]> {
    return this.safe(async () => { const result = await this.runtime.from("marketplace_orders").select("*").order("created_at", { ascending: false }); if (result.error) throw result.error; return Promise.all(rows(result.data).map((order) => this.hydrateOrder(order))); });
  }

  async findOrder(id: string): Promise<MarketplaceOrder | null> {
    return this.safe(async () => { const result = await this.runtime.from("marketplace_orders").select("*").eq("id", id).maybeSingle(); if (result.error) throw result.error; return result.data ? this.hydrateOrder(result.data as Row) : null; });
  }

  async updateOrderStatus(
    id: string,
    status: OrderStatus,
    reason?: string
  ): Promise<void> {
    await this.safe(async () => {
      const normalizedReason =
        reason?.trim() ||
        (
          status === "cancelled"
            ? "Annulation de la commande depuis Indesy Bazar"
            : null
        );

      const { error } = await this.runtime.rpc(
        "marketplace_transition_order_status",
        {
          p_order_id: id,
          p_target_status: status,
          p_reason: normalizedReason,
        }
      );

      if (error) {
        throw error;
      }
    });
  }

  async confirmPaymentPaid(
    paymentId: string,
    providerReference?: string,
    reason?: string
  ): Promise<string> {
    return this.safe(async () => {
      const normalizedProviderReference =
        providerReference?.trim() || null;

      const normalizedReason =
        reason?.trim() || null;

      const { data, error } = await this.runtime.rpc(
        "marketplace_confirm_payment_paid",
        {
          p_payment_id: paymentId,
          p_provider_reference: normalizedProviderReference,
          p_reason: normalizedReason,
        }
      );

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error(
          "La confirmation du paiement n'a retournÃ© aucune commande."
        );
      }

      return data;
    });
  }

  async deleteOrder(_id: string): Promise<void> { void _id; throw new Error("Une commande est immuable. Utilisez l'annulation ou le remboursement."); }

  async adjustStock(
    productId: string,
    quantity: number,
    reason: string,
  ): Promise<void> {
    await this.safe(async () => {
      if (!Number.isInteger(quantity) || quantity === 0) {
        throw new Error(
          "La variation de stock doit Ãªtre un entier non nul.",
        );
      }

      const normalizedReason = reason.trim();

      if (!normalizedReason) {
        throw new Error(
          "La raison de lâ€™ajustement du stock est obligatoire.",
        );
      }

      const sellerOrganizationId =
        await this.sellerOrganizationId();

      const result = await this.runtime.rpc(
        "marketplace_adjust_stock",
        {
          p_product_id: productId,
          p_seller_organization_id:
            sellerOrganizationId,
          p_delta: quantity,
          p_reason: normalizedReason,
        },
      );

      if (result.error) {
        throw result.error;
      }
    });
  }

  async listDeliveries(): Promise<DeliveryRecord[]> {
    return this.safe(async () => { const result = await this.runtime.from("marketplace_deliveries").select("*").order("updated_at", { ascending: false }); if (result.error) throw result.error; return rows(result.data).map((item) => ({ id: str(item.id), orderId: str(item.order_id), method: str(item.method) as DeliveryRecord["method"], address: str(item.address), carrier: str(item.carrier) || undefined, trackingNumber: str(item.tracking_number) || undefined, status: str(item.status) as DeliveryRecord["status"], updatedAt: str(item.updated_at) })); });
  }

  async listTransactions(): Promise<MarketplaceTransaction[]> {
    return this.safe(async () => { const result = await this.runtime.from("marketplace_transactions").select("*").order("created_at", { ascending: false }); if (result.error) throw result.error; return rows(result.data).map((item) => ({ id: str(item.id), orderId: str(item.order_id), sellerId: str(item.seller_organization_id), amount: num(item.amount), paymentMethod: methods.mobile_money, paymentStatus: str(item.status) === "completed" ? "paid" : "pending", createdAt: str(item.created_at) })); });
  }

  async sellerStatistics(): Promise<SellerStatistics> {
    const [products, orders, inventory] = await Promise.all([this.listProducts(), this.listOrders(), this.listInventory()]); const paid = orders.filter((order) => order.paymentStatus === "paid");
    return { products: products.length, sales: paid.flatMap((order) => order.lines).filter((line) => line.mode === "sale").length, rentals: paid.flatMap((order) => order.lines).filter((line) => line.mode === "rental").length, orders: orders.length, revenue: paid.reduce((sum, order) => sum + order.total, 0), lowStock: inventory.filter((item) => item.available <= item.lowStockThreshold).length, customers: new Set(orders.map((order) => order.customerId)).size, recentProducts: products.slice(0, 5) };
  }

  async sellerCustomers(): Promise<SellerCustomer[]> {
    const customers = new Map<string, SellerCustomer>(); (await this.listOrders()).forEach((order) => { const current = customers.get(order.customerId); customers.set(order.customerId, { id: order.customerId, name: order.customerName, email: order.customerEmail, orders: (current?.orders ?? 0) + 1, totalSpent: (current?.totalSpent ?? 0) + (order.paymentStatus === "paid" ? order.total : 0) }); }); return [...customers.values()];
  }

  private async hydrateOrder(
    order: Row
  ): Promise<MarketplaceOrder> {
    const id = str(order.id);

    const [
      lineResult,
      historyResult,
      transactionResult,
    ] = await Promise.all([
      this.runtime
        .from("marketplace_order_lines")
        .select("*")
        .eq("order_id", id),

      this.runtime
        .from("marketplace_order_status_history")
        .select("*")
        .eq("order_id", id)
        .order("created_at"),

      this.runtime
        .from("marketplace_transactions")
        .select("id")
        .eq("order_id", id)
        .eq("transaction_type", "charge")
        .order(
          "created_at",
          {
            ascending: false,
          }
        )
        .limit(1)
        .maybeSingle(),
    ]);

    if (lineResult.error) {
      throw lineResult.error;
    }

    if (historyResult.error) {
      throw historyResult.error;
    }

    if (transactionResult.error) {
      throw transactionResult.error;
    }

    let method = methods.cash;

    let paymentId:
      | string
      | undefined;

    const transactionId =
      transactionResult.data
        ? str(
            (
              transactionResult.data as Row
            ).id
          )
        : "";

    if (transactionId) {
      const payment =
        await this.runtime
          .from("marketplace_payments")
          .select(
            "id,method,status"
          )
          .eq(
            "transaction_id",
            transactionId
          )
          .order(
            "created_at",
            {
              ascending: false,
            }
          )
          .limit(1)
          .maybeSingle();

      if (payment.error) {
        throw payment.error;
      }

      if (payment.data) {
        const paymentRow =
          payment.data as Row;

        paymentId =
          str(
            paymentRow.id
          ) || undefined;

        method =
          methods[
            str(
              paymentRow.method
            )
          ] ?? method;
      }
    }

    return {
      id,

      customerId:
        str(
          order.customer_id
        ),

      customerName:
        str(
          order.customer_name
        ),

      customerEmail:
        str(
          order.customer_email
        ),

      customerPhone:
        str(
          order.customer_phone
        ),

      sellerId:
        str(
          order.seller_organization_id
        ),

      lines:
        rows(
          lineResult.data
        ).map(
          (
            line
          ): OrderLine => ({
            id:
              str(
                line.id
              ),

            productId:
              str(
                line.product_id
              ),

            title:
              str(
                line.product_title
              ),

            quantity:
              num(
                line.quantity
              ),

            unitPrice:
              num(
                line.unit_price
              ),

            mode:
              str(
                line.mode
              ) as OrderLine["mode"],

            rental:
              line.mode === "rental"
                ? this.rental(line)
                : undefined,

            total:
              num(
                line.line_total
              ),
          })
        ),

      address:
        str(
          order.delivery_address
        ),

      fulfillment:
        str(
          order.fulfillment_method
        ) as MarketplaceOrder["fulfillment"],

      subtotal:
        num(
          order.subtotal
        ),

      fees:
        num(
          order.fees
        ),

      total:
        num(
          order.total
        ),

      status:
        str(
          order.status
        ) as MarketplaceOrder["status"],

      paymentMethod:
        method,

      paymentStatus:
        str(
          order.payment_status
        ) as MarketplaceOrder["paymentStatus"],

      paymentId,

      statusHistory:
        rows(
          historyResult.data
        ).map(
          (
            entry
          ): OrderStatusEntry => ({
            status:
              str(
                entry.to_status
              ) as OrderStatus,

            changedAt:
              str(
                entry.created_at
              ),

            note:
              str(
                entry.note
              ) || undefined,
          })
        ),

      createdAt:
        str(
          order.created_at
        ),

      updatedAt:
        str(
          order.updated_at
        ),
    };
  }

  private rental(row: Row, depositAmount = 0): RentalSelection { const startDate = str(row.rental_start); const endDate = str(row.rental_end); return { startDate, endDate, days: startDate && endDate ? Math.max(1, Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000) + 1) : 1, depositAmount, status: "pending" }; }
  private async sellerOrganizationId(): Promise<string> {
    const userId = await this.user();

    const [
      activeResult,
      ownedResult,
      membershipResult,
    ] = await Promise.all([
      this.runtime
        .from("active_organizations")
        .select("organization_id")
        .eq("profile_id", userId)
        .maybeSingle(),

      this.runtime
        .from("organizations")
        .select("id,status")
        .eq("owner_id", userId),

      this.runtime
        .from("organization_members")
        .select("organization_id,role,status")
        .eq("profile_id", userId),
    ]);

    if (activeResult.error) throw activeResult.error;
    if (ownedResult.error) throw ownedResult.error;
    if (membershipResult.error) throw membershipResult.error;

    const allowedMembershipRoles =
      new Set([
        "owner",
        "admin",
        "manager",
        "seller",
      ]);

    const organizationIsEnabled =
      (status: unknown) =>
        ![
          "suspended",
          "deleted",
        ].includes(
          str(
            status,
            "active",
          ),
        );

    const candidateIds =
      new Set<string>();

    for (
      const organization of
      rows(
        ownedResult.data,
      )
    ) {
      const organizationId =
        str(
          organization.id,
        );

      if (
        organizationId &&
        organizationIsEnabled(
          organization.status,
        )
      ) {
        candidateIds.add(
          organizationId,
        );
      }
    }

    const memberOrganizationIds =
      rows(
        membershipResult.data,
      )
        .filter(
          (membership) =>
            str(
              membership.status,
              "active",
            ) === "active" &&
            allowedMembershipRoles.has(
              str(
                membership.role,
              ),
            ),
        )
        .map(
          (membership) =>
            str(
              membership.organization_id,
            ),
        )
        .filter(
          Boolean,
        );

    if (
      memberOrganizationIds.length
    ) {
      const memberOrganizationsResult =
        await this.runtime
          .from("organizations")
          .select("id,status")
          .in(
            "id",
            Array.from(
              new Set(
                memberOrganizationIds,
              ),
            ),
          );

      if (
        memberOrganizationsResult.error
      ) {
        throw memberOrganizationsResult.error;
      }

      for (
        const organization of
        rows(
          memberOrganizationsResult.data,
        )
      ) {
        const organizationId =
          str(
            organization.id,
          );

        if (
          organizationId &&
          organizationIsEnabled(
            organization.status,
          )
        ) {
          candidateIds.add(
            organizationId,
          );
        }
      }
    }

    const activeOrganizationId =
      activeResult.data
        ? str(
            (
              activeResult.data as Row
            ).organization_id,
          )
        : "";

    if (
      activeOrganizationId
    ) {
      if (
        candidateIds.has(
          activeOrganizationId,
        )
      ) {
        return activeOrganizationId;
      }

      throw new Error(
        "L'organisation active n'est pas autorisee a publier sur Indesy Bazar.",
      );
    }

    if (
      candidateIds.size === 1
    ) {
      return Array.from(
        candidateIds,
      )[0];
    }

    if (
      candidateIds.size === 0
    ) {
      throw new Error(
        "Aucune organisation vendeuse autorisee n'est disponible pour ce compte.",
      );
    }

    throw new Error(
      "Plusieurs organisations vendeuses sont disponibles. Selectionnez d'abord l'organisation active.",
    );
  }
  private async categoryId(name: string): Promise<string> { if(!name.trim()) return ""; const result=await this.runtime.from("marketplace_categories").select("id").ilike("name",name.trim()).maybeSingle(); if(result.error) throw result.error; return result.data ? str((result.data as Row).id) : ""; }
  private async user(required = true): Promise<string> { const result = await this.runtime.auth.getUser(); const id = result.data.user?.id ?? ""; if (required && (!id || result.error)) throw result.error ?? new Error("Connectez-vous pour utiliser la marketplace."); return id; }
  private async cartId(userId: string, create: boolean): Promise<string> { const current = await this.runtime.from("marketplace_carts").select("id").eq("customer_id", userId).eq("status", "active").maybeSingle(); if (current.error) throw current.error; if (current.data) return str((current.data as Row).id); if (!create) return ""; const inserted = await this.runtime.from("marketplace_carts").insert({ customer_id: userId }).select("id").single(); if (inserted.error) throw inserted.error; return str((inserted.data as Row).id); }
  private async safe<T>(
    operation: () => Promise<T>,
  ): Promise<T> {
    try {
      return await operation();
    }
    catch (reason) {
      if (reason instanceof Error) {
        throw reason;
      }

      throw normalizeBackendError(
        reason,
      );
    }
  }
}

export const createMarketplaceRuntimeRepository = () => new MarketplaceRuntimeRepository(createSupabaseBrowserClient());
