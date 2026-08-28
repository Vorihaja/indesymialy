import type {
  GetKoranaSavedPostsInput,
  SetKoranaSavedPostInput,
} from "../saved-post.types";

import {
  KoranaSavedPostRepository,
} from "../repositories/korana-saved-post.repository";


export class KoranaSavedPostService {

  constructor(
    private readonly repository:
      KoranaSavedPostRepository,
  ) {}


  set(
    input:
      SetKoranaSavedPostInput,
  ) {

    const actorId =
      input.actorId.trim();

    const postId =
      input.postId.trim();


    if (!actorId) {

      throw new Error(
        "Sélectionne une identité Korana.",
      );
    }


    if (!postId) {

      throw new Error(
        "Publication Korana introuvable.",
      );
    }


    return this.repository.set(
      {
        actorId,
        postId,
        saved:
          input.saved,
      },
    );
  }


  loadLibrary(
    input:
      GetKoranaSavedPostsInput = {},
  ) {

    const actorId =
      input.actorId?.trim() ||
      null;


    const limit =
      Math.max(
        1,
        Math.min(
          input.limit ??
            30,
          50,
        ),
      );


    return this.repository.loadLibrary(
      {
        actorId,

        limit,

        before:
          input.before ??
          null,
      },
    );
  }
}