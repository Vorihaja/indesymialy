import { FinanceRepository } from './repository';
import type {
  CreateFinanceCategoryInput,
  FinanceOwner,
  FinanceOwnerContext,
  FinancePeriod,
  ManualFinanceOperationInput,
  ReverseManualOperationInput,
  UpdateFinanceCategoryInput,
} from './types';

export class FinanceService {
  constructor(
    private readonly repository: FinanceRepository,
  ) {}

  owners() {
    return this.repository.owners();
  }

  snapshot(owner: FinanceOwner) {
    return this.repository.snapshot(owner);
  }

  entries(
    owner: FinanceOwner,
    period: FinancePeriod = {},
  ) {
    return this.repository.entries(
      owner,
      period,
    );
  }

  manualOperation(
    owner: FinanceOwnerContext,
    operationId: string,
  ) {
    if (!operationId) {
      throw new Error(
        'Opération financière introuvable.',
      );
    }

    return this.repository.manualOperation(
      owner,
      operationId,
    );
  }

  categories(owner: FinanceOwner) {
    return this.repository.categories(owner);
  }

  createCategory(
    input: CreateFinanceCategoryInput,
  ) {
    const name = input.name.trim();

    if (!name) {
      throw new Error(
        'Le nom de la catégorie est obligatoire.',
      );
    }

    return this.repository.createCategory({
      ...input,
      name,
    });
  }

  updateCategory(
    input: UpdateFinanceCategoryInput,
  ) {
    const name = input.name.trim();

    if (!name) {
      throw new Error(
        'Le nom de la catégorie est obligatoire.',
      );
    }

    return this.repository.updateCategory({
      ...input,
      name,
    });
  }

  archiveCategory(
    owner: FinanceOwnerContext,
    categoryId: string,
  ) {
    return this.repository.archiveCategory(
      owner,
      categoryId,
    );
  }

  postManualOperation(
    input: ManualFinanceOperationInput,
  ) {
    if (
      !Number.isFinite(input.amount) ||
      input.amount <= 0
    ) {
      throw new Error(
        'Le montant doit être supérieur à zéro.',
      );
    }

    if (!input.categoryName.trim()) {
      throw new Error(
        'Choisissez ou créez une catégorie.',
      );
    }

    if (!input.description.trim()) {
      throw new Error(
        'Le libellé de l’opération est obligatoire.',
      );
    }

    return this.repository.postManualOperation({
      ...input,
      categoryName:
        input.categoryName.trim(),
      description:
        input.description.trim(),
    });
  }

  reverseManualOperation(
    input: ReverseManualOperationInput,
  ) {
    if (!input.operationId) {
      throw new Error(
        'Opération financière introuvable.',
      );
    }

    return this.repository.reverseManualOperation(
      input,
    );
  }
}
