import {
  KoranaMediaService,
} from "../services/korana-media.service";


export class DeleteKoranaPostMediaUseCase {

  constructor(
    private readonly service:
      KoranaMediaService,
  ) {}


  execute(
    mediaId: string,
  ) {

    return this.service.detach(
      mediaId,
    );
  }
}