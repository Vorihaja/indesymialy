import {
  createSupabaseBrowserClient,
} from "@/infrastructure/supabase/client";

import {
  KoranaFoundationRepository,
} from "../repositories/korana-foundation.repository";

import {
  KoranaFoundationService,
} from "../services/korana-foundation.service";

import {
  GetKoranaFoundationUseCase,
} from "../use-cases/get-korana-foundation.use-case";


let service:
  KoranaFoundationService | null =
    null;


export function makeKoranaFoundationService() {

  service ??=
    new KoranaFoundationService(

      new KoranaFoundationRepository(
        createSupabaseBrowserClient(),
      ),

    );


  return service;
}


export function makeGetKoranaFoundationUseCase() {

  return new GetKoranaFoundationUseCase(
    makeKoranaFoundationService(),
  );
}