import type {
  AgendaManualStatus,
  SellerAgendaItemInput,
} from "../types";

import {
  SellerAgendaService,
} from "../services/seller-agenda.service";

export class ManageSellerAgendaUseCase {
  constructor(
    private readonly service:
      SellerAgendaService,
  ) {}

  snapshot(
    from: string,
    to: string,
  ) {
    return this.service.snapshot(
      from,
      to,
    );
  }

  save(
    input: SellerAgendaItemInput,
  ) {
    return this.service.save(
      input,
    );
  }

  setStatus(
    id: string,
    status: AgendaManualStatus,
  ) {
    return this.service.setStatus(
      id,
      status,
    );
  }
}