export type ProductVariantAttributes =
  Record<string, string>;

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  label: string;
  attributes: ProductVariantAttributes;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariantInput {
  productId: string;
  sku: string;
  label: string;
  attributes: ProductVariantAttributes;
  isActive: boolean;
  sortOrder: number;
}