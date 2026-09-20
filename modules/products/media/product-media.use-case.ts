import {
  ProductMediaService,
} from "./product-media.service";


export class ProductMediaUseCase {
  constructor(
    private readonly service:
      ProductMediaService,
  ) {}

  upload(files: File[]) {
    return this.service.upload(
      files,
    );
  }

  list() {
    return this.service.list();
  }

  remove(path: string) {
    return this.service.remove(
      path,
    );
  }
}