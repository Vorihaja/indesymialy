import type {
  GetKoranaFeedInput,
  KoranaFeedMode,
} from "../feed.types";

import {
  KoranaFeedRepository,
} from "../repositories/korana-feed.repository";


export class KoranaFeedService {

  constructor(
    private readonly repository:
      KoranaFeedRepository,
  ) {}


  load(
    input:
      GetKoranaFeedInput = {},
  ) {

    const mode:
      KoranaFeedMode =
        input.mode ===
          "following"
          ? "following"
          : "for_you";


    const limit =
      Math.max(
        1,
        Math.min(
          input.limit ??
            20,
          50,
        ),
      );


    return this.repository.load(
      {
        mode,

        actorId:
          input.actorId ??
          null,

        limit,

        before:
          input.before ??
          null,
      },
    );
  }
}