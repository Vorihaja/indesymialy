import type {
  KoranaFollowInput,
} from "../follow.types";

import {
  KoranaFollowRepository,
} from "../repositories/korana-follow.repository";


function validate(
  input:
    KoranaFollowInput,
) {

  if (
    !input.followerActorId.trim()
  ) {

    throw new Error(
      "Actor Korana actif introuvable.",
    );
  }


  if (
    !input.followedActorId.trim()
  ) {

    throw new Error(
      "Actor Korana à suivre introuvable.",
    );
  }


  if (
    input.followerActorId ===
    input.followedActorId
  ) {

    throw new Error(
      "Un Actor ne peut pas se suivre lui-même.",
    );
  }
}


export class KoranaFollowService {

  constructor(
    private readonly repository:
      KoranaFollowRepository,
  ) {}


  follow(
    input:
      KoranaFollowInput,
  ) {

    validate(
      input,
    );


    return this.repository.follow(
      input,
    );
  }


  unfollow(
    input:
      KoranaFollowInput,
  ) {

    validate(
      input,
    );


    return this.repository.unfollow(
      input,
    );
  }
}