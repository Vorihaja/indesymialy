import type { SponsorOffersModuleStatus } from "../types";
export class SponsorOffersRepository { getStatus(): SponsorOffersModuleStatus { return { domain: "sponsor-offers", storage: "memory", ready: true }; } }
