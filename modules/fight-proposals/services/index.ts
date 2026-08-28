import { FightProposalsRepository } from "../repositories";
import type { FightProposalsModuleStatus } from "../types";
export class FightProposalsService { constructor(private readonly repository: FightProposalsRepository) {} status(): FightProposalsModuleStatus { return this.repository.getStatus(); } }
