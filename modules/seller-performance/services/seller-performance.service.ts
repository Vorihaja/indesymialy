import {
  SellerPerformanceRepository,
} from "../repositories/seller-performance.repository";

export class SellerPerformanceService {
  constructor(
    private readonly repository:
      SellerPerformanceRepository,
  ) {}

  snapshot(
    from: string,
    to: string,
  ) {
    return this.repository.snapshot(
      from,
      to,
    );
  }
}