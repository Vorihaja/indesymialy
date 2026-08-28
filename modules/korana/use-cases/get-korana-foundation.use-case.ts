import {
  KoranaFoundationService,
} from "../services/korana-foundation.service";


export class GetKoranaFoundationUseCase {

  constructor(
    private readonly service:
      KoranaFoundationService,
  ) {}


  execute() {

    return this.service.getSnapshot();
  }
}