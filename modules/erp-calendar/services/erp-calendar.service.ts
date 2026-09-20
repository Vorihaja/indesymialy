import type { ErpCalendarRepository } from "../repositories/erp-calendar.repository";

import type {
  ErpCalendarCreateInput,
  ErpCalendarItem,
  ErpCalendarUpdateInput,
} from "../types";

function validate(
  input: ErpCalendarCreateInput,
): ErpCalendarCreateInput {
  const title = input.title.trim();

  if (!title) {
    throw new Error("Le titre est obligatoire.");
  }

  const start = new Date(input.startsAt);
  const end = new Date(input.endsAt);

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime())
  ) {
    throw new Error("Date invalide.");
  }

  if (end.getTime() <= start.getTime()) {
    throw new Error(
      "La fin doit être postérieure au début.",
    );
  }

  return {
    ...input,
    title,
    description: input.description?.trim() || null,
    location: input.location?.trim() || null,
    contextRole: input.contextRole?.trim() || null,
  };
}

export class ErpCalendarService {
  constructor(
    private readonly repository: ErpCalendarRepository,
  ) {}

  list(
    from?: string,
    to?: string,
  ): Promise<ErpCalendarItem[]> {
    return this.repository.list(from, to);
  }

  create(
    input: ErpCalendarCreateInput,
  ): Promise<string> {
    return this.repository.create(validate(input));
  }

  update(
    input: ErpCalendarUpdateInput,
  ): Promise<string> {
    return this.repository.update({
      ...validate(input),
      id: input.id,
    });
  }

  archive(id: string): Promise<string> {
    return this.repository.archive(id);
  }
}
