import {
  ProductMediaRepository,
} from "./product-media.repository";


export class ProductMediaService {
  constructor(
    private readonly repository:
      ProductMediaRepository,
  ) {}

  upload(files: File[]) {
    if (!files.length) {
      return Promise.resolve([]);
    }

    return this.repository.upload(
      files,
    );
  }

  list() {
    return this.repository.list();
  }

  remove(path: string) {
    if (!path.trim()) {
      throw new Error(
        "Chemin média obligatoire.",
      );
    }

    return this.repository.remove(
      path,
    );
  }
}