import type { ProfileVerificationService } from "../services/profile-verification.service";
import type { VerificationDetails } from "../types";

export class ManageProfileVerificationUseCase {
  constructor(private readonly service: ProfileVerificationService) {}
  execute() { return this.service.get(); }
  save(details: VerificationDetails) { return this.service.save(details); }
  upload(requestId: string, type: string, file: File, expiresAt?: string) { return this.service.upload(requestId, type, file, expiresAt); }
  submit(requestId: string) { return this.service.submit(requestId); }
}
