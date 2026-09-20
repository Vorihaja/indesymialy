import {
  createSupabaseBrowserClient,
} from "@/infrastructure/supabase/client";

import {
  ProductMediaRepository,
} from "./product-media.repository";

import {
  ProductMediaService,
} from "./product-media.service";

import {
  ProductMediaUseCase,
} from "./product-media.use-case";


export function createProductMediaUseCase() {
  return new ProductMediaUseCase(
    new ProductMediaService(
      new ProductMediaRepository(
        createSupabaseBrowserClient(),
      ),
    ),
  );
}