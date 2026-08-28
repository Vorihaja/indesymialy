import type { RealErpDataService } from "./real-erp-data.service";
import type { RealErpMutation, RealErpQuery } from "./types";

export class LoadRealErpDataUseCase {
  constructor(private readonly service: RealErpDataService) {}
  execute(query: RealErpQuery) { return this.service.load(query); }
  create(mutation: RealErpMutation) { return this.service.create(mutation); }
  update(id: string, mutation: RealErpMutation) { return this.service.update(id, mutation); }
  remove(entity: RealErpMutation["entity"], id: string) { return this.service.remove(entity, id); }
}
