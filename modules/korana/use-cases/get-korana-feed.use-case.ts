import type {
  GetKoranaFeedInput,
} from "../feed.types";

import {
  KoranaFeedService,
} from "../services/korana-feed.service";


export class GetKoranaFeedUseCase {

  constructor(
    private readonly service:
      KoranaFeedService,
  ) {}


  execute(
    input:
      GetKoranaFeedInput = {},
  ) {

    return this.service.load(
      input,
    );
  }
}