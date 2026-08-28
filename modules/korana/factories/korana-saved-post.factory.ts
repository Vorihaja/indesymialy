import {
  createSupabaseBrowserClient,
} from "@/infrastructure/supabase/client";

import {
  KoranaSavedPostRepository,
} from "../repositories/korana-saved-post.repository";

import {
  KoranaSavedPostService,
} from "../services/korana-saved-post.service";

import {
  GetKoranaSavedPostsUseCase,
  SetKoranaSavedPostUseCase,
} from "../use-cases/korana-saved-post.use-cases";


let service:
  KoranaSavedPostService | null =
    null;


let setSavedPostUseCase:
  SetKoranaSavedPostUseCase | null =
    null;


let getSavedPostsUseCase:
  GetKoranaSavedPostsUseCase | null =
    null;


function createService() {

  if (!service) {

    const client =
      createSupabaseBrowserClient();


    const repository =
      new KoranaSavedPostRepository(
        client,
      );


    service =
      new KoranaSavedPostService(
        repository,
      );
  }


  return service;
}


export function createSetKoranaSavedPostUseCase() {

  if (
    !setSavedPostUseCase
  ) {

    setSavedPostUseCase =
      new SetKoranaSavedPostUseCase(
        createService(),
      );
  }


  return setSavedPostUseCase;
}


export function createGetKoranaSavedPostsUseCase() {

  if (
    !getSavedPostsUseCase
  ) {

    getSavedPostsUseCase =
      new GetKoranaSavedPostsUseCase(
        createService(),
      );
  }


  return getSavedPostsUseCase;
}