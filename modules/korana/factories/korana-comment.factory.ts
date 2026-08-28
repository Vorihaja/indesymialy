import {
  createSupabaseBrowserClient,
} from "@/infrastructure/supabase/client";

import {
  KoranaCommentRepository,
} from "../repositories/korana-comment.repository";

import {
  KoranaCommentService,
} from "../services/korana-comment.service";

import {
  CreateKoranaCommentUseCase,
  DeleteKoranaCommentUseCase,
  GetKoranaCommentsUseCase,
  UpdateKoranaCommentUseCase,
} from "../use-cases/korana-comment.use-cases";


export function createKoranaCommentUseCases() {

  const client =
    createSupabaseBrowserClient();


  const repository =
    new KoranaCommentRepository(
      client,
    );


  const service =
    new KoranaCommentService(
      repository,
    );


  return {

    get:
      new GetKoranaCommentsUseCase(
        service,
      ),

    create:
      new CreateKoranaCommentUseCase(
        service,
      ),

    update:
      new UpdateKoranaCommentUseCase(
        service,
      ),

    remove:
      new DeleteKoranaCommentUseCase(
        service,
      ),

  };
}