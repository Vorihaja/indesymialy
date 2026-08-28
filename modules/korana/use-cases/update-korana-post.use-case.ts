import type {
  UpdateKoranaPostInput,
} from "../post.types";

import {
  KoranaPostService,
} from "../services/korana-post.service";


export class UpdateKoranaPostUseCase {

  constructor(
    private readonly service:
      KoranaPostService,
  ) {}


  execute(
    input:
      UpdateKoranaPostInput,
  ) {

    return this.service.update(
      input,
    );
  }
}