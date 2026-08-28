import { SponsorOffersRepository } from "../repositories";
import { SponsorOffersService } from "../services";
import { GetSponsorOffersStatusUseCase } from "../use-cases";
export function createSponsorOffersStatusUseCase(): GetSponsorOffersStatusUseCase { return new GetSponsorOffersStatusUseCase(new SponsorOffersService(new SponsorOffersRepository())); }
