import {
  ProductVariantsService,
} from "./product-variants.service";

import type {
  ProductVariantInput,
} from "./types";

export class ManageProductVariantsUseCase {
  constructor(
    private readonly service:
      ProductVariantsService,
  ) {}

  list() {
    return this.service.list();
  }

  create(
    input: ProductVariantInput,
  ) {
    return this.service.create(
      input,
    );
  }

  update(
    id: string,
    input: ProductVariantInput,
  ) {
    return this.service.update(
      id,
      input,
    );
  }

  setActive(
    id: string,
    isActive: boolean,
  ) {
    return this.service.setActive(
      id,
      isActive,
    );
  }
}