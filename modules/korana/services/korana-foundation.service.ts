import {
  KoranaFoundationRepository,
} from "../repositories/korana-foundation.repository";


export class KoranaFoundationService {

  constructor(
    private readonly repository:
      KoranaFoundationRepository,
  ) {}


  getSnapshot() {

    return this.repository.snapshot();
  }
}