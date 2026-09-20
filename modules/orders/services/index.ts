import { OrderRepository } from "../repositories";
import type {
  CheckoutInput,
  OrderStatus,
} from "../types";

export class OrderService {
  constructor(
    private readonly repository: OrderRepository
  ) {}

  list() {
    return this.repository.list();
  }

  detail(id: string) {
    return this.repository.find(id);
  }

  create(input: CheckoutInput) {
    if (
      !input.customerName ||
      !input.customerEmail
    ) {
      throw new Error(
        "Coordonnées client obligatoires."
      );
    }

    return this.repository.create(input);
  }

  updateStatus(
    id: string,
    status: OrderStatus,
    reason?: string
  ) {
    return this.repository.status(
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
    return this.repository.confirmPaymentPaid(
      paymentId,
      providerReference,
      reason
    );
  }

  remove(id: string) {
    return this.repository.delete(id);
  }
}