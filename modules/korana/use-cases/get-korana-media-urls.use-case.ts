import {
  KoranaMediaService,
} from "../services/korana-media.service";


export class GetKoranaMediaUrlsUseCase {

  constructor(
    private readonly service:
      KoranaMediaService,
  ) {}


  execute(
    storagePaths:
      string[],
  ) {

    return this.service.createSignedUrls(
      storagePaths,
    );
  }
}