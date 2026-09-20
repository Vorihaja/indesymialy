import {
  createSupabaseBrowserClient,
} from "@/infrastructure/supabase/client";

import {
  SellerAgendaRepository,
  type SellerAgendaRpcClient,
} from "../repositories/seller-agenda.repository";

import {
  SellerAgendaService,
} from "../services/seller-agenda.service";

import {
  ManageSellerAgendaUseCase,
} from "../use-cases/seller-agenda.use-case";

export function createSellerAgendaUseCase() {
  const client =
    createSupabaseBrowserClient() as unknown as SellerAgendaRpcClient;

  return new ManageSellerAgendaUseCase(
    new SellerAgendaService(
      new SellerAgendaRepository(
        client,
      ),
    ),
  );
}