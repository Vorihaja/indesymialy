import type { GeographyRepository } from "../repositories/geography.repository";
export class GeographyService { constructor(private readonly repository: GeographyRepository) {} load() { return this.repository.load(); } }
