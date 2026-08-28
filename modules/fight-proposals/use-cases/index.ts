import { FightProposalsService } from "../services";
import type { FightProposalsModuleStatus } from "../types";
export class GetFightProposalsStatusUseCase { constructor(private readonly service: FightProposalsService) {} execute(): FightProposalsModuleStatus { return this.service.status(); } }
