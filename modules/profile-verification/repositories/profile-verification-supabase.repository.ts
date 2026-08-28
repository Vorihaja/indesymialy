import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/infrastructure/supabase/database.types";
import { BackendError, normalizeBackendError } from "@/shared/errors/backend-error";
import type { ProfileVerificationRepository } from "./profile-verification.repository";
import type { VerificationDetails, VerificationRequest } from "../types";

const allowed = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);

export class ProfileVerificationSupabaseRepository implements ProfileVerificationRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async get(): Promise<VerificationRequest | null> {
    try {
      const { data, error } = await this.client.rpc("get_my_profile_verification");
      if (error) throw error;
      return data && typeof data === "object" && !Array.isArray(data) ? data as unknown as VerificationRequest : null;
    } catch (reason) { throw normalizeBackendError(reason); }
  }

  async save(details: VerificationDetails): Promise<string> {
    try {
      const { data, error } = await this.client.rpc("save_my_profile_verification", {
        p_subject_type: details.subjectType, p_organization_id: details.organizationId ?? "",
        p_legal_name: details.legalName, p_identity_number: details.identityNumber || "",
        p_nif: details.nif, p_stat_number: details.statNumber || "",
        p_registered_address: details.registeredAddress,
      });
      if (error) throw error;
      if (!data) throw new BackendError("NOT_FOUND", "La demande de vérification n’a pas été créée.");
      return data;
    } catch (reason) { throw normalizeBackendError(reason); }
  }

  async upload(requestId: string, type: string, file: File, expiresAt?: string): Promise<void> {
    if (!allowed.has(file.type)) throw new BackendError("VALIDATION_ERROR", "Format refusé. Utilisez PDF, JPG, PNG ou WebP.");
    if (file.size <= 0 || file.size > 10 * 1024 * 1024) throw new BackendError("VALIDATION_ERROR", "Le fichier doit peser moins de 10 Mo.");
    const { data: auth, error: authError } = await this.client.auth.getUser();
    if (authError || !auth.user) throw new BackendError("UNAUTHENTICATED");
    const extension = file.name.split(".").pop()?.replace(/[^a-z0-9]/gi, "").toLowerCase() || "bin";
    const path = `${auth.user.id}/${requestId}/${type}-${Date.now()}.${extension}`;
    try {
      const { error: uploadError } = await this.client.storage.from("profile-verification").upload(path, file, { upsert: false, contentType: file.type });
      if (uploadError) throw uploadError;
      const { error } = await this.client.rpc("register_my_verification_document", {
        p_request_id: requestId, p_document_type: type, p_file_name: file.name,
        p_storage_path: path, p_mime_type: file.type, p_size_bytes: file.size,
        p_expires_at: expiresAt || undefined,
      });
      if (error) { await this.client.storage.from("profile-verification").remove([path]); throw error; }
    } catch (reason) { throw normalizeBackendError(reason); }
  }

  async submit(requestId: string): Promise<void> {
    try { const { error } = await this.client.rpc("submit_my_profile_verification", { p_request_id: requestId }); if (error) throw error; }
    catch (reason) { throw normalizeBackendError(reason); }
  }
}
