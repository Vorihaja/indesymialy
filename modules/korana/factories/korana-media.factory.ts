import {
  createSupabaseBrowserClient,
} from "@/infrastructure/supabase/client";

import {
  KoranaMediaRepository,
} from "../repositories/korana-media.repository";

import {
  KoranaMediaService,
} from "../services/korana-media.service";

import {
  UploadKoranaPostMediaUseCase,
} from "../use-cases/upload-korana-post-media.use-case";

import {
  GetKoranaMediaUrlsUseCase,
} from "../use-cases/get-korana-media-urls.use-case";

import {
  DeleteKoranaPostMediaUseCase,
} from "../use-cases/delete-korana-post-media.use-case";


let service:
  KoranaMediaService | null =
    null;


function makeService() {

  service ??=
    new KoranaMediaService(
      new KoranaMediaRepository(
        createSupabaseBrowserClient(),
      ),
    );


  return service;
}


export function makeUploadKoranaPostMediaUseCase() {

  return new UploadKoranaPostMediaUseCase(
    makeService(),
  );
}


export function makeGetKoranaMediaUrlsUseCase() {

  return new GetKoranaMediaUrlsUseCase(
    makeService(),
  );
}


export function makeDeleteKoranaPostMediaUseCase() {

  return new DeleteKoranaPostMediaUseCase(
    makeService(),
  );
}