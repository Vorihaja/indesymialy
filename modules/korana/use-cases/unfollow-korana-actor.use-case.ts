import type {
  KoranaFollowInput,
} from "../follow.types";

import {
  KoranaFollowService,
} from "../services/korana-follow.service";


export class UnfollowKoranaActorUseCase {

  constructor(
    private readonly service:
      KoranaFollowService,
  ) {}


  execute(
    input:
      KoranaFollowInput,
  ) {

    return this.service.unfollow(
      input,
    );
  }
}