import { SocialRepository } from "../repositories/social.repository";
import type { SocialFilters, SocialRecordInput, SocialStatistics } from "../types";
export class SocialService {
  constructor(private readonly repository: SocialRepository) {}
  async list(filters: SocialFilters) { const records = await this.repository.list(); const search = filters.search.trim().toLocaleLowerCase(); return records.filter((item) => (!search || `${item.title} ${item.content} ${item.tags.join(" ")} ${item.author}`.toLocaleLowerCase().includes(search)) && (!filters.discipline || item.discipline === filters.discipline) && (!filters.region || item.region === filters.region) && (!filters.category || item.category === filters.category) && (!filters.date || item.createdAt.slice(0, 10) === filters.date)); }
  detail(id: string) { return this.repository.findById(id); }
  create(input: SocialRecordInput) { if (!input.title.trim() && !input.content.trim()) throw new Error("Un titre ou un contenu est obligatoire."); return this.repository.create(input); }
  update(id: string, input: SocialRecordInput) { return this.repository.update(id, input); }
  remove(id: string) { return this.repository.delete(id); }
  react(id: string) { return this.repository.react(id); }
  share(id: string) { return this.repository.share(id); }
  async statistics(): Promise<SocialStatistics> { const items = await this.repository.list(); return { total: items.length, published: items.filter((item) => item.status === "published").length, interactions: items.reduce((sum, item) => sum + item.likes + item.shares + item.replies, 0), reported: items.filter((item) => item.status === "reported").length }; }
}
