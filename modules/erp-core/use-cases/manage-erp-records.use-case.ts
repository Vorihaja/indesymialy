import { ErpService } from "../services/erp.service";
import type { ErpFilters, ErpRecordInput } from "../types";

export class ManageErpRecordsUseCase {
  constructor(private readonly service: ErpService) {}
  list(filters: ErpFilters) { return this.service.list(filters); }
  detail(id: string) { return this.service.findById(id); }
  create(input: ErpRecordInput) { return this.service.create(input); }
  update(id: string, input: ErpRecordInput) { return this.service.update(id, input); }
  remove(id: string) { return this.service.delete(id); }
  statistics() { return this.service.statistics(); }
}
