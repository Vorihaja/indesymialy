import { FinanceService } from './service';
import type {
  CreateFinanceCategoryInput,
  FinanceOwner,
  FinanceOwnerContext,
  FinancePeriod,
  ManualFinanceOperationInput,
  ReverseManualOperationInput,
  UpdateFinanceCategoryInput,
} from './types';

export class FinanceUseCase {
  constructor(
    private readonly service: FinanceService,
  ) {}

  owners() {
    return this.service.owners();
  }

  snapshot(owner: FinanceOwner) {
    return this.service.snapshot(owner);
  }

  entries(
    owner: FinanceOwner,
    period: FinancePeriod = {},
  ) {
    return this.service.entries(
      owner,
      period,
    );
  }

  manualOperation(
    owner: FinanceOwnerContext,
    operationId: string,
  ) {
    return this.service.manualOperation(
      owner,
      operationId,
    );
  }

  categories(owner: FinanceOwner) {
    return this.service.categories(owner);
  }

  createCategory(
    input: CreateFinanceCategoryInput,
  ) {
    return this.service.createCategory(input);
  }

  updateCategory(
    input: UpdateFinanceCategoryInput,
  ) {
    return this.service.updateCategory(input);
  }

  archiveCategory(
    owner: FinanceOwnerContext,
    categoryId: string,
  ) {
    return this.service.archiveCategory(
      owner,
      categoryId,
    );
  }

  postManualOperation(
    input: ManualFinanceOperationInput,
  ) {
    return this.service.postManualOperation(
      input,
    );
  }

  reverseManualOperation(
    input: ReverseManualOperationInput,
  ) {
    return this.service.reverseManualOperation(
      input,
    );
  }
}
