import type {
  SetKoranaRepostInput,
} from "../repost.types";

import {
  KoranaRepostService,
} from "../services/korana-repost.service";


export class SetKoranaRepostUseCase {

  constructor(
    private readonly service:
      KoranaRepostService,
  ) {}


  execute(
    input:
      SetKoranaRepostInput,
  ) {

    return this.service.set(
      input,
    );
  }
}