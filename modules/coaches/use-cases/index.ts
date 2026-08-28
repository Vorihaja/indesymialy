import { ManageErpRecordsUseCase } from "@/modules/erp-core"; import { CoachService } from "../services";
export class ManageCoachStudentsUseCase extends ManageErpRecordsUseCase { constructor() { super(new CoachService()); } }
