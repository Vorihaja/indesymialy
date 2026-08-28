import { ErpService } from "@/modules/erp-core"; import { FanRepository } from "../repositories"; export class FanService extends ErpService { constructor() { super(new FanRepository()); } }
