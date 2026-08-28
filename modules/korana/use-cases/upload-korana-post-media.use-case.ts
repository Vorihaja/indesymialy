import type {
  KoranaMediaUploadInput,
} from "../media.types";

import {
  KoranaMediaService,
} from "../services/korana-media.service";


export class UploadKoranaPostMediaUseCase {

  constructor(
    private readonly service:
      KoranaMediaService,
  ) {}


  execute(
    inputs:
      KoranaMediaUploadInput[],
  ) {

    return this.service.uploadMany(
      inputs,
    );
  }
}