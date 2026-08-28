import type {
  CreateKoranaCommentInput,
  GetKoranaCommentsInput,
  UpdateKoranaCommentInput,
} from "../comment.types";

import {
  KoranaCommentService,
} from "../services/korana-comment.service";


export class GetKoranaCommentsUseCase {

  constructor(
    private readonly service:
      KoranaCommentService,
  ) {}


  execute(
    input:
      GetKoranaCommentsInput,
  ) {

    return this.service.getComments(
      input,
    );
  }
}


export class CreateKoranaCommentUseCase {

  constructor(
    private readonly service:
      KoranaCommentService,
  ) {}


  execute(
    input:
      CreateKoranaCommentInput,
  ) {

    return this.service.createComment(
      input,
    );
  }
}


export class UpdateKoranaCommentUseCase {

  constructor(
    private readonly service:
      KoranaCommentService,
  ) {}


  execute(
    input:
      UpdateKoranaCommentInput,
  ) {

    return this.service.updateComment(
      input,
    );
  }
}


export class DeleteKoranaCommentUseCase {

  constructor(
    private readonly service:
      KoranaCommentService,
  ) {}


  execute(
    commentId:
      string,
  ) {

    return this.service.deleteComment(
      commentId,
    );
  }
}