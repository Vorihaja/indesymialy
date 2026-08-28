import type { SocialRecord, SocialRecordInput } from "../types";
const stores = new Map<string, SocialRecord[]>();
export class SocialRepository {
  constructor(private readonly namespace: string) {}
  list(): Promise<SocialRecord[]> { return Promise.resolve([...(stores.get(this.namespace) ?? [])]); }
  findById(id: string): Promise<SocialRecord | null> { return Promise.resolve((stores.get(this.namespace) ?? []).find((item) => item.id === id) ?? null); }
  create(input: SocialRecordInput): Promise<SocialRecord> { const now = new Date().toISOString(); const item: SocialRecord = { ...input, id: crypto.randomUUID(), likes: 0, shares: 0, replies: 0, createdAt: now, updatedAt: now }; stores.set(this.namespace, [item, ...(stores.get(this.namespace) ?? [])]); return Promise.resolve(item); }
  update(id: string, input: SocialRecordInput): Promise<SocialRecord> { const current = (stores.get(this.namespace) ?? []).find((item) => item.id === id); const item: SocialRecord = { ...input, id, likes: current?.likes ?? 0, shares: current?.shares ?? 0, replies: current?.replies ?? 0, createdAt: current?.createdAt ?? new Date().toISOString(), updatedAt: new Date().toISOString() }; stores.set(this.namespace, (stores.get(this.namespace) ?? []).map((value) => value.id === id ? item : value)); return Promise.resolve(item); }
  delete(id: string): Promise<void> { stores.set(this.namespace, (stores.get(this.namespace) ?? []).filter((item) => item.id !== id)); return Promise.resolve(); }
  react(id: string): Promise<void> { stores.set(this.namespace, (stores.get(this.namespace) ?? []).map((item) => item.id === id ? { ...item, likes: item.likes + 1 } : item)); return Promise.resolve(); }
  share(id: string): Promise<void> { stores.set(this.namespace, (stores.get(this.namespace) ?? []).map((item) => item.id === id ? { ...item, shares: item.shares + 1 } : item)); return Promise.resolve(); }
}
