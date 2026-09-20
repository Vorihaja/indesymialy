import type {
  OrganizerContextRepository,
  OrganizerOperationsPersistentRepository,
  OrganizerOperationsRepository,
} from "./organizer-operations.repository";

import type {
  OrganizerSection,
} from "../types";

export class OrganizerOperationsHybridRepository
  implements OrganizerOperationsRepository
{
  constructor(
    private readonly contextRepository:
      OrganizerContextRepository,

    private readonly persistentRepository:
      OrganizerOperationsPersistentRepository,
  ) {}

  async getDashboard() {
    const context =
      await this.contextRepository.resolve();

    return this.persistentRepository.getDashboard(
      context,
    );
  }

  async getSection(
    section: OrganizerSection,
  ) {
    const context =
      await this.contextRepository.resolve();

    const connected =
      await this.persistentRepository.getSection(
        context,
        section,
      );

    return {
      ...connected,
      section,
      eyebrow: connected.eyebrow ?? "DONNÉES SUPABASE",
      title: connected.title ?? section.replaceAll("-", " "),
      description:
        connected.description ??
        "Données persistées accessibles dans le périmètre actif.",
      readiness: connected.readiness ?? 0,
      metrics: connected.metrics ?? [],
      workflow: connected.workflow ?? [],
      alerts: connected.alerts ?? [],
      primaryAction: connected.primaryAction ?? "",
      capabilities: connected.capabilities ?? [],
    };
  }

  async setActiveEvent(
    eventId: string,
  ) {
    await this.contextRepository.setActiveEventId(
      eventId,
    );

    return this.getDashboard();
  }
}
