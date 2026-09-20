import {
  createMarketplaceRuntimeRepository,
} from "@/modules/marketplace-core";

import type {
  ProductLifecycleTarget,
} from "../types";

const marketplaceRuntimeRepository =
  createMarketplaceRuntimeRepository();

export class ProductRepository {
  list() {
    return marketplaceRuntimeRepository.listProducts();
  }

  find(id: string) {
    return marketplaceRuntimeRepository.findProduct(
      id,
    );
  }

  create(
    input: Parameters<
      typeof marketplaceRuntimeRepository.createProduct
    >[0],
  ) {
    return marketplaceRuntimeRepository.createProduct(
      input,
    );
  }

  update(
    id: string,
    input: Parameters<
      typeof marketplaceRuntimeRepository.updateProduct
    >[1],
  ) {
    return marketplaceRuntimeRepository.updateProduct(
      id,
      input,
    );
  }

  status(
    id: string,
    targetStatus: ProductLifecycleTarget,
  ) {
    return marketplaceRuntimeRepository.setProductStatus(
      id,
      targetStatus,
    );
  }

  publish(id: string) {
    return this.status(
      id,
      "published",
    );
  }

  deactivate(id: string) {
    return this.status(
      id,
      "inactive",
    );
  }

  reactivate(id: string) {
    return this.status(
      id,
      "published",
    );
  }

  archive(id: string) {
    return this.status(
      id,
      "archived",
    );
  }

  /*
   * Legacy contract.
   *
   * deleteProduct() is overridden by MarketplaceRuntimeRepository
   * and now performs an archive through the lifecycle RPC.
   */
  delete(id: string) {
    return marketplaceRuntimeRepository.deleteProduct(
      id,
    );
  }
}