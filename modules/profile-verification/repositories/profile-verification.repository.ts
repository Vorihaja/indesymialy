import type { VerificationDetails, VerificationRequest } from "../types";

export interface ProfileVerificationRepository {
  get(): Promise<VerificationRequest | null>;
  save(details: VerificationDetails): Promise<string>;
  upload(requestId: string, type: string, file: File, expiresAt?: string): Promise<void>;
  submit(requestId: string): Promise<void>;
}
