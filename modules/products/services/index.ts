import {
  ProductRepository,
} from "../repositories";

import type {
  ProductInput,
  ProductLifecycleTarget,
} from "../types";

export class ProductService {
  constructor(
    private readonly repository: ProductRepository,
  ) {}

  list() {
    return this.repository.list();
  }

  detail(id: string) {
    return this.repository.find(
      id,
    );
  }

  create(
    input: ProductInput,
  ) {
    if (!input.title.trim()) {
      throw new Error(
        "Titre obligatoire.",
      );
    }

    return this.repository.create(
      input,
    );
  }

  update(
    id: string,
    input: ProductInput,
  ) {
    return this.repository.update(
      id,
      input,
    );
  }

  status(
    id: string,
    targetStatus: ProductLifecycleTarget,
  ) {
    return this.repository.status(
      id,
      targetStatus,
    );
  }

  publish(id: string) {
    return this.repository.publish(
      id,
    );
  }

  deactivate(id: string) {
    return this.repository.deactivate(
      id,
    );
  }

  reactivate(id: string) {
    return this.repository.reactivate(
      id,
    );
  }

  archive(id: string) {
    return this.repository.archive(
      id,
    );
  }

  /*
   * Legacy compatibility.
   * remove() no longer physically deletes.
   */
  remove(id: string) {
    return this.repository.delete(
      id,
    );
  }
}