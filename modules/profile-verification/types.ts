export type VerificationStatus = "draft" | "submitted" | "in_review" | "verified" | "rejected" | "needs_changes";
export type VerificationDocumentStatus = "uploaded" | "accepted" | "rejected";

export interface VerificationDocument {
  id: string;
  type: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  status: VerificationDocumentStatus;
  expiresAt?: string | null;
  reviewNote?: string | null;
}

export interface VerificationRequest {
  id: string;
  subjectType: "profile" | "organization";
  organizationId?: string | null;
  legalName: string;
  identityNumber?: string | null;
  nif: string;
  statNumber?: string | null;
  registeredAddress: string;
  status: VerificationStatus;
  submittedAt?: string | null;
  reviewNote?: string | null;
  documents: VerificationDocument[];
}

export interface VerificationDetails {
  subjectType: "profile" | "organization";
  organizationId?: string | null;
  legalName: string;
  identityNumber: string;
  nif: string;
  statNumber: string;
  registeredAddress: string;
}

export interface RequiredVerificationDocument { type: string; label: string; required: boolean; expires: boolean }
