import {
  createSupabaseBrowserClient,
} from "@/infrastructure/supabase/client";

import {
  SellerPerformanceRepository,
} from "../repositories/seller-performance.repository";

import {
  SellerPerformanceService,
} from "../services/seller-performance.service";

import {
  GetSellerPerformanceUseCase,
} from "../use-cases/seller-performance.use-case";

export function createSellerPerformanceUseCase() {
  return new GetSellerPerformanceUseCase(
    new SellerPerformanceService(
      new SellerPerformanceRepository(
        createSupabaseBrowserClient(),
      ),
    ),
  );
}