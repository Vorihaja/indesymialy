import {
  ProductService,
} from "../services";

import type {
  ProductInput,
  ProductLifecycleTarget,
} from "../types";

export class ManageProductsUseCase {
  constructor(
    private readonly service: ProductService,
  ) {}

  list() {
    return this.service.list();
  }

  detail(id: string) {
    return this.service.detail(
      id,
    );
  }

  create(
    input: ProductInput,
  ) {
    return this.service.create(
      input,
    );
  }

  update(
    id: string,
    input: ProductInput,
  ) {
    return this.service.update(
      id,
      input,
    );
  }

  status(
    id: string,
    targetStatus: ProductLifecycleTarget,
  ) {
    return this.service.status(
      id,
      targetStatus,
    );
  }

  publish(id: string) {
    return this.service.publish(
      id,
    );
  }

  deactivate(id: string) {
    return this.service.deactivate(
      id,
    );
  }

  reactivate(id: string) {
    return this.service.reactivate(
      id,
    );
  }

  archive(id: string) {
    return this.service.archive(
      id,
    );
  }

  /*
   * Legacy compatibility.
   */
  remove(id: string) {
    return this.service.remove(
      id,
    );
  }
}