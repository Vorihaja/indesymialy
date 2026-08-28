import { ErpService } from "@/modules/erp-core"; import { LeagueRepository } from "../repositories"; export class LeagueService extends ErpService { constructor() { super(new LeagueRepository()); } }
