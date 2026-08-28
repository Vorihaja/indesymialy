import type {
  KoranaFollowInput,
} from "../follow.types";

import {
  KoranaFollowService,
} from "../services/korana-follow.service";


export class FollowKoranaActorUseCase {

  constructor(
    private readonly service:
      KoranaFollowService,
  ) {}


  execute(
    input:
      KoranaFollowInput,
  ) {

    return this.service.follow(
      input,
    );
  }
}