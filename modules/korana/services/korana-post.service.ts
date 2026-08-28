import type {
  CreateKoranaPostInput,
  UpdateKoranaPostInput,
} from "../post.types";

import {
  KoranaPostRepository,
} from "../repositories/korana-post.repository";


function normalizeHashtags(
  values:
    string[] | undefined,
): string[] {

  if (!values) {

    return [];
  }


  return Array.from(
    new Set(
      values
        .map(
          (value) =>
            value
              .trim()
              .replace(
                /^#+/,
                "",
              )
              .toLowerCase(),
        )
        .filter(Boolean),
    ),
  ).slice(
    0,
    20,
  );
}


function normalizeContent(
  value: string,
): string {

  const content =
    value.trim();


  if (!content) {

    throw new Error(
      "La publication ne peut pas être vide.",
    );
  }


  if (
    content.length >
    10000
  ) {

    throw new Error(
      "La publication dépasse la longueur maximale autorisée.",
    );
  }


  return content;
}


export class KoranaPostService {

  constructor(
    private readonly repository:
      KoranaPostRepository,
  ) {}


  create(
    input:
      CreateKoranaPostInput,
  ) {

    return this.repository.create(
      {
        ...input,

        content:
          normalizeContent(
            input.content,
          ),

        visibility:
          input.visibility ??
          "public",

        replyControl:
          input.replyControl ??
          "everyone",

        hashtags:
          normalizeHashtags(
            input.hashtags,
          ),
      },
    );
  }


  update(
    input:
      UpdateKoranaPostInput,
  ) {

    return this.repository.update(
      {
        ...input,

        content:
          normalizeContent(
            input.content,
          ),

        visibility:
          input.visibility ??
          "public",

        replyControl:
          input.replyControl ??
          "everyone",

        hashtags:
          normalizeHashtags(
            input.hashtags,
          ),
      },
    );
  }


  remove(
    postId: string,
  ) {

    if (!postId.trim()) {

      throw new Error(
        "Publication introuvable.",
      );
    }


    return this.repository.remove(
      postId,
    );
  }
}