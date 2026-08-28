import type { GeographyService } from "../services/geography.service";
export class LoadGeographyUseCase { constructor(private readonly service: GeographyService) {} execute() { return this.service.load(); } }
