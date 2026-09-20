import type {
  SupabaseClient,
} from "@supabase/supabase-js";

import type {
  ProductVariant,
  ProductVariantAttributes,
  ProductVariantInput,
} from "./types";

type VariantRow = {
  id: string;
  product_id: string;
  sku: string;
  label: string;
  attributes: unknown;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

function attributesFromRow(
  value: unknown,
): ProductVariantAttributes {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter(
        (
          entry,
        ): entry is [
          string,
          string,
        ] =>
          typeof entry[1] ===
          "string",
      ),
  );
}

function mapRow(
  row: VariantRow,
): ProductVariant {
  return {
    id: row.id,
    productId: row.product_id,
    sku: row.sku,
    label: row.label,
    attributes: attributesFromRow(row.attributes),
    isActive: row.is_active,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class ProductVariantsRepository {
  constructor(
    private readonly client:
      SupabaseClient,
  ) {}

  async list(): Promise<ProductVariant[]> {
    const {
      data,
      error,
    } =
      await this.client
        .from("marketplace_product_variants")
        .select(
          "id,product_id,sku,label,attributes,is_active,sort_order,created_at,updated_at",
        )
        .order(
          "sort_order",
          {
            ascending: true,
          },
        )
        .order(
          "created_at",
          {
            ascending: true,
          },
        );

    if (error) {
      throw error;
    }

    return (
      (data ?? []) as VariantRow[]
    ).map(mapRow);
  }

  async create(
    input: ProductVariantInput,
  ): Promise<ProductVariant> {
    const now =
      new Date().toISOString();

    const {
      data,
      error,
    } =
      await this.client
        .from("marketplace_product_variants")
        .insert({
          product_id: input.productId,
          sku: input.sku.trim().toUpperCase(),
          label: input.label.trim(),
          attributes: input.attributes,
          is_active: input.isActive,
          sort_order: input.sortOrder,
          updated_at: now,
        })
        .select(
          "id,product_id,sku,label,attributes,is_active,sort_order,created_at,updated_at",
        )
        .single();

    if (error) {
      throw error;
    }

    return mapRow(
      data as VariantRow,
    );
  }

  async update(
    id: string,
    input: ProductVariantInput,
  ): Promise<ProductVariant> {
    const {
      data,
      error,
    } =
      await this.client
        .from("marketplace_product_variants")
        .update({
          product_id: input.productId,
          sku: input.sku.trim().toUpperCase(),
          label: input.label.trim(),
          attributes: input.attributes,
          is_active: input.isActive,
          sort_order: input.sortOrder,
          updated_at: new Date().toISOString(),
        })
        .eq(
          "id",
          id,
        )
        .select(
          "id,product_id,sku,label,attributes,is_active,sort_order,created_at,updated_at",
        )
        .single();

    if (error) {
      throw error;
    }

    return mapRow(
      data as VariantRow,
    );
  }

  async setActive(
    id: string,
    isActive: boolean,
  ): Promise<void> {
    const {
      error,
    } =
      await this.client
        .from("marketplace_product_variants")
        .update({
          is_active: isActive,
          updated_at: new Date().toISOString(),
        })
        .eq(
          "id",
          id,
        );

    if (error) {
      throw error;
    }
  }
}