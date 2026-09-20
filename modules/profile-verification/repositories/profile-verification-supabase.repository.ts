import type {
  SupabaseClient,
} from "@supabase/supabase-js";

import type {
  Database,
} from "@/infrastructure/supabase/database.types";

import {
  BackendError,
  normalizeBackendError,
} from "@/shared/errors/backend-error";

import type {
  ProfileVerificationRepository,
} from "./profile-verification.repository";

import type {
  VerificationDetails,
  VerificationRequest,
} from "../types";

const allowed =
  new Set([
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
  ]);

export class ProfileVerificationSupabaseRepository
implements ProfileVerificationRepository {
  constructor(
    private readonly client:
      SupabaseClient<Database>,
  ) {}

  async get(
    subjectType?: VerificationDetails["subjectType"],
    organizationId?: string | null,
  ): Promise<VerificationRequest | null> {
    try {
      /*
       * Compatibilité des anciens appels internes.
       */
      if (!subjectType) {
        const {
          data,
          error,
        } =
          await this.client.rpc(
            "get_my_profile_verification",
          );

        if (error) {
          throw error;
        }

        return (
          data &&
          typeof data === "object" &&
          !Array.isArray(data)
        )
          ? data as unknown as VerificationRequest
          : null;
      }

      /*
       * Un dossier organisation doit toujours être explicitement
       * rattaché à une organisation.
       */
      if (
        subjectType === "organization" &&
        !organizationId
      ) {
        return null;
      }

      const {
        data: auth,
        error: authError,
      } =
        await this.client.auth.getUser();

      if (authError) {
        throw authError;
      }

      if (!auth.user) {
        return null;
      }

      let query =
        this.client
          .from(
            "profile_verification_requests",
          )
          .select(
            "id,subject_type,organization_id,legal_name,identity_number,nif,stat_number,registered_address,status,submitted_at,review_note,updated_at",
          )
          .eq(
            "profile_id",
            auth.user.id,
          )
          .eq(
            "subject_type",
            subjectType,
          );

      if (
        subjectType === "profile"
      ) {
        query =
          query.is(
            "organization_id",
            null,
          );
      }
      else {
        query =
          query.eq(
            "organization_id",
            organizationId as string,
          );
      }

      const {
        data: request,
        error: requestError,
      } =
        await query
          .order(
            "updated_at",
            {
              ascending: false,
            },
          )
          .limit(1)
          .maybeSingle();

      if (requestError) {
        throw requestError;
      }

      if (!request) {
        return null;
      }

      const {
        data: documents,
        error: documentsError,
      } =
        await this.client
          .from(
            "profile_verification_documents",
          )
          .select(
            "id,document_type,file_name,mime_type,size_bytes,status,expires_at,review_note",
          )
          .eq(
            "request_id",
            request.id,
          )
          .order(
            "document_type",
            {
              ascending: true,
            },
          );

      if (documentsError) {
        throw documentsError;
      }

      return {
        id:
          request.id,

        subjectType:
          request.subject_type,

        organizationId:
          request.organization_id,

        legalName:
          request.legal_name,

        identityNumber:
          request.identity_number,

        nif:
          request.nif,

        statNumber:
          request.stat_number,

        registeredAddress:
          request.registered_address,

        status:
          request.status,

        submittedAt:
          request.submitted_at,

        reviewNote:
          request.review_note,

        documents:
          (
            documents ??
            []
          ).map(
            (document) => ({
              id:
                document.id,

              type:
                document.document_type,

              fileName:
                document.file_name,

              mimeType:
                document.mime_type,

              sizeBytes:
                document.size_bytes,

              status:
                document.status,

              expiresAt:
                document.expires_at,

              reviewNote:
                document.review_note,
            }),
          ),
      } as unknown as VerificationRequest;
    }
    catch (reason) {
      throw normalizeBackendError(
        reason,
      );
    }
  }

  async save(
    details: VerificationDetails,
  ): Promise<string> {
    try {
      /*
       * PostgreSQL accepte NULL ici.
       * Le type Supabase généré actuellement déclare encore string.
       */
      const args = {
        p_subject_type:
          details.subjectType,

        p_organization_id:
          details.organizationId ??
          null,

        p_legal_name:
          details.legalName,

        p_identity_number:
          details.identityNumber ||
          "",

        p_nif:
          details.nif,

        p_stat_number:
          details.statNumber ||
          "",

        p_registered_address:
          details.registeredAddress,
      } as unknown as
        Database["public"]["Functions"]["save_my_profile_verification"]["Args"];

      const {
        data,
        error,
      } =
        await this.client.rpc(
          "save_my_profile_verification",
          args,
        );

      if (error) {
        throw error;
      }

      if (!data) {
        throw new BackendError(
          "NOT_FOUND",
          "La demande de vérification n’a pas été créée.",
        );
      }

      return data;
    }
    catch (reason) {
      throw normalizeBackendError(
        reason,
      );
    }
  }

  async upload(
    requestId: string,
    type: string,
    file: File,
    expiresAt?: string,
  ): Promise<void> {
    if (
      !allowed.has(
        file.type,
      )
    ) {
      throw new BackendError(
        "VALIDATION_ERROR",
        "Format refusé. Utilisez PDF, JPG, PNG ou WebP.",
      );
    }

    if (
      file.size <= 0 ||
      file.size >
        10 *
        1024 *
        1024
    ) {
      throw new BackendError(
        "VALIDATION_ERROR",
        "Le fichier doit peser moins de 10 Mo.",
      );
    }

    const {
      data: auth,
      error: authError,
    } =
      await this.client.auth.getUser();

    if (
      authError ||
      !auth.user
    ) {
      throw new BackendError(
        "UNAUTHENTICATED",
      );
    }

    const extension =
      file.name
        .split(".")
        .pop()
        ?.replace(
          /[^a-z0-9]/gi,
          "",
        )
        .toLowerCase() ||
      "bin";

    const path =
      `${auth.user.id}/${requestId}/${type}-${Date.now()}.${extension}`;

    try {
      const {
        error: uploadError,
      } =
        await this.client.storage
          .from(
            "profile-verification",
          )
          .upload(
            path,
            file,
            {
              upsert: false,
              contentType:
                file.type,
            },
          );

      if (uploadError) {
        throw uploadError;
      }

      const {
        error,
      } =
        await this.client.rpc(
          "register_my_verification_document",
          {
            p_request_id:
              requestId,

            p_document_type:
              type,

            p_file_name:
              file.name,

            p_storage_path:
              path,

            p_mime_type:
              file.type,

            p_size_bytes:
              file.size,

            p_expires_at:
              expiresAt ||
              undefined,
          },
        );

      if (error) {
        await this.client.storage
          .from(
            "profile-verification",
          )
          .remove([
            path,
          ]);

        throw error;
      }
    }
    catch (reason) {
      throw normalizeBackendError(
        reason,
      );
    }
  }

  async submit(
    requestId: string,
  ): Promise<void> {
    try {
      const {
        error,
      } =
        await this.client.rpc(
          "submit_my_profile_verification",
          {
            p_request_id:
              requestId,
          },
        );

      if (error) {
        throw error;
      }
    }
    catch (reason) {
      throw normalizeBackendError(
        reason,
      );
    }
  }
}