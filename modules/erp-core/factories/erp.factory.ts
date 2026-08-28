import { ErpRepository } from "../repositories/erp.repository";
import { ErpService } from "../services/erp.service";
import { ManageErpRecordsUseCase } from "../use-cases/manage-erp-records.use-case";
export function createErpUseCase(namespace: string) { return new ManageErpRecordsUseCase(new ErpService(new ErpRepository(namespace))); }
