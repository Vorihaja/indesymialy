import {
  createSupabaseBrowserClient,
} from "@/infrastructure/supabase/client";

import {
  KoranaRepostRepository,
} from "../repositories/korana-repost.repository";

import {
  KoranaRepostService,
} from "../services/korana-repost.service";

import {
  SetKoranaRepostUseCase,
} from "../use-cases/korana-repost.use-cases";


let setRepostUseCase:
  SetKoranaRepostUseCase | null =
    null;


export function createSetKoranaRepostUseCase() {

  if (
    !setRepostUseCase
  ) {

    const client =
      createSupabaseBrowserClient();

    const repository =
      new KoranaRepostRepository(
        client,
      );

    const service =
      new KoranaRepostService(
        repository,
      );


    setRepostUseCase =
      new SetKoranaRepostUseCase(
        service,
      );
  }


  return setRepostUseCase;
}