import {
  ProductVariantsRepository,
} from "./product-variants.repository";

import type {
  ProductVariantInput,
} from "./types";

function normalize(
  input: ProductVariantInput,
): ProductVariantInput {
  const sku =
    input.sku.trim().toUpperCase();

  const label =
    input.label.trim();

  if (!input.productId) {
    throw new Error(
      "Produit obligatoire.",
    );
  }

  if (!sku) {
    throw new Error(
      "SKU obligatoire.",
    );
  }

  if (!label) {
    throw new Error(
      "Libellé obligatoire.",
    );
  }

  if (
    !Number.isInteger(input.sortOrder) ||
    input.sortOrder < 0
  ) {
    throw new Error(
      "L’ordre doit être un entier positif ou nul.",
    );
  }

  const attributes =
    Object.fromEntries(
      Object.entries(input.attributes)
        .map(
          ([key, value]) => [
            key.trim(),
            value.trim(),
          ],
        )
        .filter(
          ([key, value]) =>
            Boolean(key) &&
            Boolean(value),
        ),
    );

  return {
    ...input,
    sku,
    label,
    attributes,
  };
}

export class ProductVariantsService {
  constructor(
    private readonly repository:
      ProductVariantsRepository,
  ) {}

  list() {
    return this.repository.list();
  }

  create(
    input: ProductVariantInput,
  ) {
    return this.repository.create(
      normalize(input),
    );
  }

  update(
    id: string,
    input: ProductVariantInput,
  ) {
    if (!id) {
      throw new Error(
        "Variante introuvable.",
      );
    }

    return this.repository.update(
      id,
      normalize(input),
    );
  }

  setActive(
    id: string,
    isActive: boolean,
  ) {
    if (!id) {
      throw new Error(
        "Variante introuvable.",
      );
    }

    return this.repository.setActive(
      id,
      isActive,
    );
  }
}