import { OrderService } from "../services";
import type {
  CheckoutInput,
  OrderStatus,
} from "../types";

export class ManageOrdersUseCase {
  constructor(
    private readonly service: OrderService
  ) {}

  list() {
    return this.service.list();
  }

  detail(id: string) {
    return this.service.detail(id);
  }

  checkout(input: CheckoutInput) {
    return this.service.create(input);
  }

  updateStatus(
    id: string,
    status: OrderStatus,
    reason?: string
  ) {
    return this.service.updateStatus(
      id,
      status,
      reason
    );
  }

  confirmPaymentPaid(
    paymentId: string,
    providerReference?: string,
    reason?: string
  ) {
    return this.service.confirmPaymentPaid(
      paymentId,
      providerReference,
      reason
    );
  }

  remove(id: string) {
    return this.service.remove(id);
  }
}