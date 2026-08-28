import {
  KoranaPostService,
} from "../services/korana-post.service";


export class DeleteKoranaPostUseCase {

  constructor(
    private readonly service:
      KoranaPostService,
  ) {}


  execute(
    postId: string,
  ) {

    return this.service.remove(
      postId,
    );
  }
}