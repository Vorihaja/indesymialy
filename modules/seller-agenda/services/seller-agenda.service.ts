import type {
  AgendaManualStatus,
  SellerAgendaItemInput,
} from "../types";

import {
  SellerAgendaRepository,
} from "../repositories/seller-agenda.repository";

function validDate(
  value: string,
): boolean {
  return Number.isFinite(
    new Date(value).getTime(),
  );
}

export class SellerAgendaService {
  constructor(
    private readonly repository:
      SellerAgendaRepository,
  ) {}

  snapshot(
    from: string,
    to: string,
  ) {
    if (
      !validDate(from) ||
      !validDate(to) ||
      new Date(to).getTime() <=
        new Date(from).getTime()
    ) {
      throw new Error(
        "Période Agenda invalide.",
      );
    }

    return this.repository.snapshot(
      from,
      to,
    );
  }

  save(
    input: SellerAgendaItemInput,
  ) {
    const title =
      input.title.trim();

    if (!title) {
      throw new Error(
        "Le titre est obligatoire.",
      );
    }

    if (
      !validDate(
        input.startsAt,
      )
    ) {
      throw new Error(
        "La date de début est invalide.",
      );
    }

    if (
      input.endsAt &&
      (
        !validDate(
          input.endsAt,
        ) ||
        new Date(
          input.endsAt,
        ).getTime() <
          new Date(
            input.startsAt,
          ).getTime()
      )
    ) {
      throw new Error(
        "La fin doit être postérieure ou égale au début.",
      );
    }

    return this.repository.save({
      ...input,

      title,

      description:
        input.description.trim(),

      location:
        input.location.trim(),
    });
  }

  setStatus(
    id: string,
    status: AgendaManualStatus,
  ) {
    if (!id) {
      throw new Error(
        "Élément Agenda introuvable.",
      );
    }

    return this.repository.setStatus(
      id,
      status,
    );
  }
}