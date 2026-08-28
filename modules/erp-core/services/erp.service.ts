import { ErpRepository } from "../repositories/erp.repository";
import type { ErpFilters, ErpRecord, ErpRecordInput, ErpStatistics } from "../types";

export class ErpService {
  constructor(private readonly repository: ErpRepository) {}
  async list(filters: ErpFilters): Promise<ErpRecord[]> { const records = await this.repository.list(); const search = filters.search.trim().toLocaleLowerCase(); return records.filter((item) => (filters.status === "all" || item.status === filters.status) && (!search || `${item.title} ${item.category} ${item.description}`.toLocaleLowerCase().includes(search))); }
  findById(id: string) { return this.repository.findById(id); }
  create(input: ErpRecordInput) { if (!input.title.trim()) throw new Error("Le titre est obligatoire."); return this.repository.create(input); }
  update(id: string, input: ErpRecordInput) { if (!input.title.trim()) throw new Error("Le titre est obligatoire."); return this.repository.update(id, input); }
  delete(id: string) { return this.repository.delete(id); }
  async statistics(): Promise<ErpStatistics> { const records = await this.repository.list(); return { total: records.length, active: records.filter((item) => item.status === "active").length, draft: records.filter((item) => item.status === "draft").length, archived: records.filter((item) => item.status === "archived").length }; }
}
