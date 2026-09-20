import {
  SellerPerformanceService,
} from "../services/seller-performance.service";

export class GetSellerPerformanceUseCase {
  constructor(
    private readonly service:
      SellerPerformanceService,
  ) {}

  execute(
    from: string,
    to: string,
  ) {
    return this.service.snapshot(
      from,
      to,
    );
  }
}