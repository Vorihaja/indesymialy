import type {
  KoranaSetPostReactionInput,
} from "../reaction.types";

import {
  KoranaReactionService,
} from "../services/korana-reaction.service";


export class SetKoranaPostReactionUseCase {

  constructor(
    private readonly service:
      KoranaReactionService,
  ) {}


  execute(
    input:
      KoranaSetPostReactionInput,
  ) {

    return this.service.setPostReaction(
      input,
    );
  }
}