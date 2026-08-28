import type {
  GetKoranaSavedPostsInput,
  SetKoranaSavedPostInput,
} from "../saved-post.types";

import {
  KoranaSavedPostService,
} from "../services/korana-saved-post.service";


export class SetKoranaSavedPostUseCase {

  constructor(
    private readonly service:
      KoranaSavedPostService,
  ) {}


  execute(
    input:
      SetKoranaSavedPostInput,
  ) {

    return this.service.set(
      input,
    );
  }
}


export class GetKoranaSavedPostsUseCase {

  constructor(
    private readonly service:
      KoranaSavedPostService,
  ) {}


  execute(
    input:
      GetKoranaSavedPostsInput = {},
  ) {

    return this.service.loadLibrary(
      input,
    );
  }
}