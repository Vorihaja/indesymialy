import type {
  CreateKoranaPostInput,
} from "../post.types";

import {
  KoranaPostService,
} from "../services/korana-post.service";


export class CreateKoranaPostUseCase {

  constructor(
    private readonly service:
      KoranaPostService,
  ) {}


  execute(
    input:
      CreateKoranaPostInput,
  ) {

    return this.service.create(
      input,
    );
  }
}