import {
  createSupabaseBrowserClient,
} from "@/infrastructure/supabase/client";

import {
  SellerCustomersRepository,
} from "../repositories/seller-customers.repository";

import {
  SellerCustomersService,
} from "../services/seller-customers.service";

import {
  ManageSellerCustomersUseCase,
} from "../use-cases/seller-customers.use-case";

export function createSellerCustomersUseCase() {
  return new ManageSellerCustomersUseCase(
    new SellerCustomersService(
      new SellerCustomersRepository(
        createSupabaseBrowserClient(),
      ),
    ),
  );
}