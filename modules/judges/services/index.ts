import { ErpService } from "@/modules/erp-core"; import { JudgeRepository } from "../repositories"; export class JudgeService extends ErpService { constructor() { super(new JudgeRepository()); } }
