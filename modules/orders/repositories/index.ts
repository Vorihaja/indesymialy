import { createMarketplaceRuntimeRepository } from "@/modules/marketplace-core";

const marketplaceRuntimeRepository =
  createMarketplaceRuntimeRepository();

export class OrderRepository {
  list() {
    return marketplaceRuntimeRepository.listOrders();
  }

  find(id: string) {
    return marketplaceRuntimeRepository.findOrder(id);
  }

  create(
    input: Parameters<
      typeof marketplaceRuntimeRepository.createOrder
    >[0]
  ) {
    return marketplaceRuntimeRepository.createOrder(
      input
    );
  }

  status(
    id: string,
    status: Parameters<
      typeof marketplaceRuntimeRepository.updateOrderStatus
    >[1],
    reason?: Parameters<
      typeof marketplaceRuntimeRepository.updateOrderStatus
    >[2]
  ) {
    return marketplaceRuntimeRepository.updateOrderStatus(
      id,
      status,
      reason
    );
  }

  confirmPaymentPaid(
    paymentId: string,
    providerReference?: Parameters<
      typeof marketplaceRuntimeRepository.confirmPaymentPaid
    >[1],
    reason?: Parameters<
      typeof marketplaceRuntimeRepository.confirmPaymentPaid
    >[2]
  ) {
    return marketplaceRuntimeRepository.confirmPaymentPaid(
      paymentId,
      providerReference,
      reason
    );
  }

  delete(id: string) {
    return marketplaceRuntimeRepository.deleteOrder(
      id
    );
  }
}