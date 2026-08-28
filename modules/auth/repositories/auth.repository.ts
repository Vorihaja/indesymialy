import type {
  SupabaseClient,
} from "@supabase/supabase-js";

import type {
  Database,
} from "@/infrastructure/supabase/database.types";


type AuthObservationErrorCategory =
  | "invalid_credentials"
  | "email_not_confirmed"
  | "user_banned"
  | "rate_limited"
  | "network_error"
  | "service_error"
  | "validation_error"
  | "unknown";


function observationId(): string {

  if (
    typeof globalThis.crypto !==
      "undefined" &&
    typeof globalThis.crypto.randomUUID ===
      "function"
  ) {

    return globalThis.crypto.randomUUID();
  }


  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"
    .replace(
      /[xy]/g,
      (character) => {

        const random =
          Math.floor(
            Math.random() *
            16,
          );


        const value =
          character === "x"
            ? random
            : (
                random &
                0x3
              ) |
              0x8;


        return value.toString(
          16,
        );
      },
    );
}


function errorRecord(
  reason: unknown,
): Record<string, unknown> {

  if (
    reason &&
    typeof reason ===
      "object" &&
    !Array.isArray(
      reason,
    )
  ) {

    return reason as Record<
      string,
      unknown
    >;
  }


  return {};
}


function authErrorCategory(
  reason: unknown,
): AuthObservationErrorCategory {

  const error =
    errorRecord(
      reason,
    );


  const code =
    typeof error.code ===
    "string"
      ? error.code
          .trim()
          .toLowerCase()
      : "";


  const message =
    typeof error.message ===
    "string"
      ? error.message
          .trim()
          .toLowerCase()
      : "";


  const status =
    typeof error.status ===
      "number"
      ? error.status
      : Number(
          error.status,
        );


  if (
    code.includes(
      "invalid_credentials",
    ) ||
    message.includes(
      "invalid login credentials",
    ) ||
    message.includes(
      "invalid credentials",
    )
  ) {

    return "invalid_credentials";
  }


  if (
    code.includes(
      "email_not_confirmed",
    ) ||
    message.includes(
      "email not confirmed",
    )
  ) {

    return "email_not_confirmed";
  }


  if (
    code.includes(
      "user_banned",
    ) ||
    message.includes(
      "user is banned",
    )
  ) {

    return "user_banned";
  }


  if (
    status ===
      429 ||
    code.includes(
      "rate_limit",
    ) ||
    code.includes(
      "too_many",
    ) ||
    message.includes(
      "rate limit",
    ) ||
    message.includes(
      "too many requests",
    )
  ) {

    return "rate_limited";
  }


  if (
    code.includes(
      "validation",
    ) ||
    status ===
      400
  ) {

    return "validation_error";
  }


  if (
    message.includes(
      "failed to fetch",
    ) ||
    message.includes(
      "network",
    ) ||
    message.includes(
      "fetch failed",
    ) ||
    code.includes(
      "network",
    )
  ) {

    return "network_error";
  }


  if (
    (
      Number.isFinite(
        status,
      ) &&
      status >=
        500
    ) ||
    code.includes(
      "unexpected_failure",
    ) ||
    code.includes(
      "server_error",
    )
  ) {

    return "service_error";
  }


  return "unknown";
}


export class AuthRepository {

  constructor(
    private readonly supabase:
      SupabaseClient<Database>,
  ) {}


  private recordLoginObservation(
    input: {
      eventId: string;

      outcome:
        | "success"
        | "failure";

      durationMs: number;

      errorCategory:
        AuthObservationErrorCategory | null;
    },
  ) {

    /*
     * La télémétrie ne doit jamais devenir
     * une dépendance fonctionnelle de l'authentification.
     *
     * Une erreur de journalisation ne peut donc
     * jamais empêcher une connexion.
     *
     * database.types.ts déclare p_error_category
     * comme string obligatoire.
     *
     * Pour un succès, "unknown" est uniquement
     * une valeur de transport TypeScript :
     * la fonction SQL remet elle-même
     * error_category à NULL lorsque outcome = success.
     */
    void this.supabase
      .rpc(
        "record_auth_observability_event",
        {
          p_event_id:
            input.eventId,

          p_outcome:
            input.outcome,

          p_duration_ms:
            Math.max(
              0,
              Math.min(
                120000,
                Math.round(
                  input.durationMs,
                ),
              ),
            ),

          p_error_category:
            input.errorCategory ??
            "unknown",
        },
      )
      .then(
        () =>
          undefined,

        () =>
          undefined,
      );
  }


  async login(
    email: string,
    password: string,
  ) {

    const eventId =
      observationId();


    const startedAt =
      Date.now();


    let result:
      Awaited<
        ReturnType<
          SupabaseClient<Database>[
            "auth"
          ][
            "signInWithPassword"
          ]
        >
      >;


    try {

      result =
        await this.supabase.auth
          .signInWithPassword({
            email,
            password,
          });

    } catch (
      reason
    ) {

      this.recordLoginObservation({
        eventId,

        outcome:
          "failure",

        durationMs:
          Date.now() -
          startedAt,

        errorCategory:
          authErrorCategory(
            reason,
          ),
      });


      throw reason;
    }


    const durationMs =
      Date.now() -
      startedAt;


    if (
      result.error
    ) {

      this.recordLoginObservation({
        eventId,

        outcome:
          "failure",

        durationMs,

        errorCategory:
          authErrorCategory(
            result.error,
          ),
      });


      throw result.error;
    }


    this.recordLoginObservation({
      eventId,

      outcome:
        "success",

      durationMs,

      errorCategory:
        null,
    });


    return result.data;
  }


  async register(
    email: string,
    password: string,
    metadata?: Record<
      string,
      string
    >,
  ) {

    const {
      data,
      error,
    } =
      await this.supabase.auth
        .signUp({
          email,
          password,

          options: {
            data:
              metadata,

            emailRedirectTo:
              typeof window ===
              "undefined"
                ? undefined
                : `${window.location.origin}/auth/callback`,
          },
        });


    if (error) {
      throw error;
    }


    return data;
  }


  async requestPasswordReset(
    email: string,
    redirectTo: string,
  ) {

    const {
      error,
    } =
      await this.supabase.auth
        .resetPasswordForEmail(
          email,
          {
            redirectTo,
          },
        );


    if (error) {
      throw error;
    }
  }


  async resetPassword(
    password: string,
  ) {

    const {
      data,
      error,
    } =
      await this.supabase.auth
        .updateUser({
          password,
        });


    if (error) {
      throw error;
    }


    return data;
  }


  async refreshSession() {

    const {
      data,
      error,
    } =
      await this.supabase.auth
        .refreshSession();


    if (error) {
      throw error;
    }


    return data.session;
  }


  async completeCallback(
    code?: string | null,
  ) {

    if (code) {

      const {
        data,
        error,
      } =
        await this.supabase.auth
          .exchangeCodeForSession(
            code,
          );


      if (error) {
        throw error;
      }


      return data.session;
    }


    return this.refreshSession();
  }


  async resendVerification(
    email: string,
  ) {

    const {
      error,
    } =
      await this.supabase.auth
        .resend({
          type:
            "signup",

          email,
        });


    if (error) {
      throw error;
    }
  }


  async logout() {

    const {
      error,
    } =
      await this.supabase.auth
        .signOut();


    if (error) {
      throw error;
    }
  }


  async getSession() {

    const {
      data,
      error,
    } =
      await this.supabase.auth
        .getSession();


    if (error) {
      throw error;
    }


    return data.session;
  }


  async getCurrentUser() {

    const session =
      await this.getSession();


    if (!session) {
      return null;
    }


    const {
      data,
      error,
    } =
      await this.supabase.auth
        .getUser();


    if (error) {
      return null;
    }


    return data.user ??
      null;
  }
}