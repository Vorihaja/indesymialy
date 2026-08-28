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

    private readonly templateRepository:
      OrganizerOperationsRepository,
  ) {}

  async getDashboard() {
    const context =
      await this.contextRepository.resolve();

    const connected =
      await this.persistentRepository.getDashboard(
        context,
      );

    const templates =
      await this.templateRepository.getDashboard();

    return {
      ...templates,
      ...connected,

      weather:
        templates.weather,

      quickActions:
        templates.quickActions,
    };
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

    const template =
      await this.templateRepository.getSection(
        section,
      );

    return {
      ...template,
      ...connected,

      section,

      capabilities:
        template.capabilities,

      workflow:
        template.workflow,

      primaryAction:
        template.primaryAction,
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