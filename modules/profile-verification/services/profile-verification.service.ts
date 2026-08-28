import type { ProfileVerificationRepository } from "../repositories/profile-verification.repository";
import type { VerificationDetails } from "../types";

export class ProfileVerificationService {
  constructor(private readonly repository: ProfileVerificationRepository) {}
  get() { return this.repository.get(); }
  save(details: VerificationDetails) {
    if (!details.legalName.trim() || !details.nif.trim() || !details.registeredAddress.trim()) throw new Error("Le nom légal, le NIF et l’adresse officielle sont obligatoires.");
    if (details.subjectType === "organization" && (!details.organizationId || !details.statNumber.trim() || !details.identityNumber.trim())) throw new Error("L’organisation, le numéro STAT et l’identité du représentant sont obligatoires.");
    return this.repository.save(details);
  }
  upload(requestId: string, type: string, file: File, expiresAt?: string) { return this.repository.upload(requestId, type, file, expiresAt); }
  submit(requestId: string) { return this.repository.submit(requestId); }
}
