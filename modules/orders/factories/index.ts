import { OrderRepository } from "../repositories";
import { OrderService } from "../services";
import { ManageOrdersUseCase } from "../use-cases";

export const createOrdersUseCase = (seller = false) =>
  new ManageOrdersUseCase(new OrderService(new OrderRepository(seller)));
