import {
  createSupabaseBrowserClient,
} from "@/infrastructure/supabase/client";

import {
  KoranaFeedRepository,
} from "../repositories/korana-feed.repository";

import {
  KoranaFeedService,
} from "../services/korana-feed.service";

import {
  GetKoranaFeedUseCase,
} from "../use-cases/get-korana-feed.use-case";


let service:
  KoranaFeedService | null =
    null;


export function makeKoranaFeedService() {

  service ??=
    new KoranaFeedService(

      new KoranaFeedRepository(
        createSupabaseBrowserClient(),
      ),

    );


  return service;
}


export function makeGetKoranaFeedUseCase() {

  return new GetKoranaFeedUseCase(
    makeKoranaFeedService(),
  );
}