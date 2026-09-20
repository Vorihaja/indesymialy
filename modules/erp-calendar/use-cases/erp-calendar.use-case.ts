import type { ErpCalendarService } from "../services/erp-calendar.service";

import type {
  ErpCalendarCreateInput,
  ErpCalendarItem,
  ErpCalendarUpdateInput,
} from "../types";

export class ErpCalendarUseCase {
  constructor(
    private readonly service: ErpCalendarService,
  ) {}

  list(
    from?: string,
    to?: string,
  ): Promise<ErpCalendarItem[]> {
    return this.service.list(from, to);
  }

  create(
    input: ErpCalendarCreateInput,
  ): Promise<string> {
    return this.service.create(input);
  }

  update(
    input: ErpCalendarUpdateInput,
  ): Promise<string> {
    return this.service.update(input);
  }

  archive(id: string): Promise<string> {
    return this.service.archive(id);
  }
}
