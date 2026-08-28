import {
  createSupabaseBrowserClient,
} from "@/infrastructure/supabase/client";

import {
  KoranaReactionRepository,
} from "../repositories/korana-reaction.repository";

import {
  KoranaReactionService,
} from "../services/korana-reaction.service";

import {
  SetKoranaPostReactionUseCase,
} from "../use-cases/set-korana-post-reaction.use-case";


let service:
  KoranaReactionService | null =
    null;


function makeService() {

  service ??=
    new KoranaReactionService(
      new KoranaReactionRepository(
        createSupabaseBrowserClient(),
      ),
    );


  return service;
}


export function makeSetKoranaPostReactionUseCase() {

  return new SetKoranaPostReactionUseCase(
    makeService(),
  );
}