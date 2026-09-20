import {
  createSupabaseBrowserClient,
} from "@/infrastructure/supabase/client";

import {
  ProductVariantsRepository,
} from "./product-variants.repository";

import {
  ProductVariantsService,
} from "./product-variants.service";

import {
  ManageProductVariantsUseCase,
} from "./product-variants.use-case";

export function createProductVariantsUseCase() {
  return new ManageProductVariantsUseCase(
    new ProductVariantsService(
      new ProductVariantsRepository(
        createSupabaseBrowserClient(),
      ),
    ),
  );
}