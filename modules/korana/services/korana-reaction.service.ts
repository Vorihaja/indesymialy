import type {
  KoranaSetPostReactionInput,
} from "../reaction.types";

import {
  KoranaReactionRepository,
} from "../repositories/korana-reaction.repository";


const ALLOWED =
  new Set([
    "like",
    "support",
    "respect",
    "fire",
  ]);


export class KoranaReactionService {

  constructor(
    private readonly repository:
      KoranaReactionRepository,
  ) {}


  setPostReaction(
    input:
      KoranaSetPostReactionInput,
  ) {

    if (
      !input.actorId.trim()
    ) {

      throw new Error(
        "Actor Korana actif introuvable.",
      );
    }


    if (
      !input.postId.trim()
    ) {

      throw new Error(
        "Publication Korana introuvable.",
      );
    }


    if (
      !ALLOWED.has(
        input.reactionType,
      )
    ) {

      throw new Error(
        "Réaction Korana invalide.",
      );
    }


    return this.repository.setPostReaction(
      input,
    );
  }
}