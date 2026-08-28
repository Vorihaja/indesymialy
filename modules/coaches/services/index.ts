import { ErpService } from "@/modules/erp-core"; import { CoachRepository } from "../repositories";
export class CoachService extends ErpService { constructor() { super(new CoachRepository()); } }
