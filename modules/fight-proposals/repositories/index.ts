import type { FightProposalsModuleStatus } from "../types";
export class FightProposalsRepository { getStatus(): FightProposalsModuleStatus { return { domain: "fight-proposals", storage: "memory", ready: true }; } }
