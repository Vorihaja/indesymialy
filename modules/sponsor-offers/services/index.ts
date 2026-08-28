import { SponsorOffersRepository } from "../repositories";
import type { SponsorOffersModuleStatus } from "../types";
export class SponsorOffersService { constructor(private readonly repository: SponsorOffersRepository) {} status(): SponsorOffersModuleStatus { return this.repository.getStatus(); } }
