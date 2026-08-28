import {
  createSupabaseBrowserClient,
} from "@/infrastructure/supabase/client";

import {
  KoranaPostRepository,
} from "../repositories/korana-post.repository";

import {
  KoranaPostService,
} from "../services/korana-post.service";

import {
  CreateKoranaPostUseCase,
} from "../use-cases/create-korana-post.use-case";

import {
  UpdateKoranaPostUseCase,
} from "../use-cases/update-korana-post.use-case";

import {
  DeleteKoranaPostUseCase,
} from "../use-cases/delete-korana-post.use-case";


let service:
  KoranaPostService | null =
    null;


export function makeKoranaPostService() {

  service ??=
    new KoranaPostService(

      new KoranaPostRepository(
        createSupabaseBrowserClient(),
      ),

    );


  return service;
}


export function makeCreateKoranaPostUseCase() {

  return new CreateKoranaPostUseCase(
    makeKoranaPostService(),
  );
}


export function makeUpdateKoranaPostUseCase() {

  return new UpdateKoranaPostUseCase(
    makeKoranaPostService(),
  );
}


export function makeDeleteKoranaPostUseCase() {

  return new DeleteKoranaPostUseCase(
    makeKoranaPostService(),
  );
}