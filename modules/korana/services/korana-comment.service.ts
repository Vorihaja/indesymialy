import type {
  CreateKoranaCommentInput,
  GetKoranaCommentsInput,
  KoranaCommentMutationResult,
  KoranaCommentsSnapshot,
  UpdateKoranaCommentInput,
} from "../comment.types";

import {
  KoranaCommentRepository,
} from "../repositories/korana-comment.repository";


function normalizeContent(
  value: string,
) {

  const content =
    value.trim();


  if (
    content.length <
    1
  ) {

    throw new Error(
      "Le commentaire ne peut pas être vide.",
    );
  }


  if (
    content.length >
    5000
  ) {

    throw new Error(
      "Le commentaire ne peut pas dépasser 5 000 caractères.",
    );
  }


  return content;
}


export class KoranaCommentService {

  constructor(
    private readonly repository:
      KoranaCommentRepository,
  ) {}


  getComments(
    input:
      GetKoranaCommentsInput,
  ): Promise<KoranaCommentsSnapshot> {

    return this.repository.getComments(
      input,
    );
  }


  createComment(
    input:
      CreateKoranaCommentInput,
  ): Promise<KoranaCommentMutationResult> {

    return this.repository.createComment(
      {
        ...input,

        content:
          normalizeContent(
            input.content,
          ),
      },
    );
  }


  updateComment(
    input:
      UpdateKoranaCommentInput,
  ): Promise<KoranaCommentMutationResult> {

    return this.repository.updateComment(
      {
        ...input,

        content:
          normalizeContent(
            input.content,
          ),
      },
    );
  }


  deleteComment(
    commentId:
      string,
  ): Promise<KoranaCommentMutationResult> {

    return this.repository.deleteComment(
      commentId,
    );
  }
}