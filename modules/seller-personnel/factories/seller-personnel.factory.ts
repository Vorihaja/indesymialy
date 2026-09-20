import {
  createSupabaseBrowserClient,
} from "@/infrastructure/supabase/client";

import {
  SellerPersonnelRepository,
} from "../repositories/seller-personnel.repository";

import {
  SellerPersonnelService,
} from "../services/seller-personnel.service";

import {
  ManageSellerPersonnelUseCase,
} from "../use-cases/seller-personnel.use-case";

export function createSellerPersonnelUseCase() {
  return new ManageSellerPersonnelUseCase(
    new SellerPersonnelService(
      new SellerPersonnelRepository(
        createSupabaseBrowserClient(),
      ),
    ),
  );
}