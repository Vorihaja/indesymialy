import type { ErpRecord, ErpRecordInput } from "../types";

const stores = new Map<string, ErpRecord[]>();

export class ErpRepository {
  constructor(private readonly namespace: string) {}
  list(): Promise<ErpRecord[]> { return Promise.resolve([...(stores.get(this.namespace) ?? [])]); }
  findById(id: string): Promise<ErpRecord | null> { return Promise.resolve((stores.get(this.namespace) ?? []).find((item) => item.id === id) ?? null); }
  create(input: ErpRecordInput): Promise<ErpRecord> { const item = { ...input, id: crypto.randomUUID(), updatedAt: new Date().toISOString() }; stores.set(this.namespace, [item, ...(stores.get(this.namespace) ?? [])]); return Promise.resolve(item); }
  update(id: string, input: ErpRecordInput): Promise<ErpRecord> { const item = { ...input, id, updatedAt: new Date().toISOString() }; stores.set(this.namespace, (stores.get(this.namespace) ?? []).map((current) => current.id === id ? item : current)); return Promise.resolve(item); }
  delete(id: string): Promise<void> { stores.set(this.namespace, (stores.get(this.namespace) ?? []).filter((item) => item.id !== id)); return Promise.resolve(); }
}
