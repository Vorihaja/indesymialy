import type { OrganizerOperationsService } from '../services/organizer-operations.service';

export class GetOrganizerDashboardUseCase {
  constructor(private readonly service: OrganizerOperationsService) {}
  execute() { return this.service.getDashboard(); }
}
