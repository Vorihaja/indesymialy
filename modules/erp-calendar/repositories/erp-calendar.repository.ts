import type {
  ErpCalendarCreateInput,
  ErpCalendarItem,
  ErpCalendarUpdateInput,
} from "../types";

export interface ErpCalendarRepository {
  list(from?: string, to?: string): Promise<ErpCalendarItem[]>;

  create(input: ErpCalendarCreateInput): Promise<string>;

  update(input: ErpCalendarUpdateInput): Promise<string>;

  archive(id: string): Promise<string>;
}
