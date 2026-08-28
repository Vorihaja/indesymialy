import { SponsorOffersService } from "../services";
import type { SponsorOffersModuleStatus } from "../types";
export class GetSponsorOffersStatusUseCase { constructor(private readonly service: SponsorOffersService) {} execute(): SponsorOffersModuleStatus { return this.service.status(); } }
