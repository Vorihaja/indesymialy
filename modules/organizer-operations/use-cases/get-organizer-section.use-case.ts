import type { OrganizerOperationsService } from '../services/organizer-operations.service';
import type { OrganizerSection } from '../types';

export class GetOrganizerSectionUseCase {
  constructor(private readonly service: OrganizerOperationsService) {}
  execute(section: OrganizerSection) { return this.service.getSection(section); }
}
