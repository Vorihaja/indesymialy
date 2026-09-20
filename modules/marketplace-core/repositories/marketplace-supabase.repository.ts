import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/infrastructure/supabase/database.types";
import { normalizeBackendError } from "@/shared/errors/backend-error";
import type {
  InventoryItem,
  MarketplaceProduct,
  ProductInput,
  SellerStatistics,
} from "../types";

type ProductRow = Database["public"]["Tables"]["products"]["Row"];
const overlays = new Map<string, Partial<MarketplaceProduct>>();

export class MarketplaceSupabaseRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {
  }

  async listProducts(): Promise<MarketplaceProduct[]> {
    try {
      const [
        productsResult,
        profilesResult,
        organizationsResult,
      ] = await Promise.all([
        this.supabase.from("products").select("*"),
        this.supabase.from("profiles").select("id,full_name"),
        this.supabase.from("organizations").select("id,name"),
      ]);
      const firstError = [
        productsResult.error,
        profilesResult.error,
        organizationsResult.error,
      ].find(Boolean);
      if (firstError) throw firstError;
      const sellerNames = new Map<string, string>([
        ...(profilesResult.data ?? []).map((item) => [item.id, item.full_name] as const),
        ...(organizationsResult.data ?? []).map((item) => [item.id, item.name] as const),
      ]);
      return (productsResult.data ?? []).map((product) =>
        this.mapProduct(product, product.seller_id ? sellerNames.get(product.seller_id) : undefined)
      );
    } catch (reason) {
      throw normalizeBackendError(reason);
    }
  }

  async findProduct(id: string): Promise<MarketplaceProduct | null> {
    try {
      const { data, error } = await this.supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;

      let sellerName = "Vendeur";
      if (data.seller_id) {
        const [{ data: profile }, { data: organization }] = await Promise.all([
          this.supabase.from("profiles").select("full_name").eq("id", data.seller_id).maybeSingle(),
          this.supabase.from("organizations").select("name").eq("id", data.seller_id).maybeSingle(),
        ]);
        sellerName = profile?.full_name ?? organization?.name ?? sellerName;
      }
      return this.mapProduct(data, sellerName);
    } catch (reason) {
      throw normalizeBackendError(reason);
    }
  }

  async createProduct(input: ProductInput): Promise<MarketplaceProduct> {
    try {
      const { data, error } = await this.supabase
        .from("products")
        .insert({
          name: input.title,
          price: input.salePrice ?? input.rentalPricePerDay ?? 0,
          seller_id: input.sellerId || null,
          stock: input.stock,
        })
        .select()
        .single();
      if (error) throw error;
      overlays.set(data.id, {
        ...input,
        id: data.id,
        popularity: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      return this.mapProduct(data, input.sellerName);
    } catch (reason) {
      throw normalizeBackendError(reason);
    }
  }

  async updateProduct(id: string, input: ProductInput): Promise<MarketplaceProduct> {
    try {
      const { data, error } = await this.supabase
        .from("products")
        .update({
          name: input.title,
          price: input.salePrice ?? input.rentalPricePerDay ?? 0,
          seller_id: input.sellerId || null,
          stock: input.stock,
        })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      overlays.set(id, {
        ...input,
        id,
        popularity: overlays.get(id)?.popularity ?? 0,
        createdAt: overlays.get(id)?.createdAt ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      return this.mapProduct(data, input.sellerName);
    } catch (reason) {
      throw normalizeBackendError(reason);
    }
  }

  async deleteProduct(_id: string): Promise<void> {
    void _id;

    throw new Error(
      "La suppression physique des produits Indesy Bazar est interdite. Utilisez le cycle de vie du produit.",
    );
  }

  async listInventory(): Promise<InventoryItem[]> {
    return (await this.listProducts()).map((product) => ({
      productId: product.id,
      title: product.title,
      available: product.stock,
      reserved: 0,
      lowStockThreshold: 3,
      movements: [],
    }));
  }

  async adjustStock(
    _productId: string,
    _quantity: number,
    _reason: string,
  ): Promise<void> {
    void _productId;
    void _quantity;
    void _reason;

    throw new Error(
      "L’ajustement direct du stock est interdit. Utilisez l’autorité d’inventaire Marketplace.",
    );
  }

  async sellerStatistics(): Promise<SellerStatistics> {
    const products = await this.listProducts();
    return {
      products: products.length,
      sales: 0,
      rentals: 0,
      orders: 0,
      revenue: 0,
      lowStock: products.filter((product) => product.stock <= 3).length,
      customers: 0,
      recentProducts: products.slice(0, 5),
    };
  }

  private mapProduct(row: ProductRow, sellerName = "Vendeur"): MarketplaceProduct {
    const overlay = overlays.get(row.id);
    return {
      description: "",
      type: "sale",
      category: "",
      rentalPricePerDay: null,
      depositAmount: null,
      condition: "new",
      images: [],
      location: "",
      status: "published",
      popularity: 0,
      createdAt: new Date(0).toISOString(),
      updatedAt: new Date(0).toISOString(),
      ...overlay,
      id: row.id,
      title: row.name,
      salePrice: row.price,
      stock: row.stock ?? 0,
      sellerId: row.seller_id ?? "",
      sellerName: overlay?.sellerName ?? sellerName,
    };
  }
}
