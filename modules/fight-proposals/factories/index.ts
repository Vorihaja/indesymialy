import { FightProposalsRepository } from "../repositories";
import { FightProposalsService } from "../services";
import { GetFightProposalsStatusUseCase } from "../use-cases";
export function createFightProposalsStatusUseCase(): GetFightProposalsStatusUseCase { return new GetFightProposalsStatusUseCase(new FightProposalsService(new FightProposalsRepository())); }
