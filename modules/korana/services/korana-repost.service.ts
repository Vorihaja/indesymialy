import type {
  SetKoranaRepostInput,
} from "../repost.types";

import {
  KoranaRepostRepository,
} from "../repositories/korana-repost.repository";


export class KoranaRepostService {

  constructor(
    private readonly repository:
      KoranaRepostRepository,
  ) {}


  set(
    input:
      SetKoranaRepostInput,
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
        reposted:
          input.reposted,
      },
    );
  }
}