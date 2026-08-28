import type {
  SupabaseClient,
} from "@supabase/supabase-js";

import type {
  Database,
} from "@/infrastructure/supabase/database.types";

import type {
  KoranaActorStatus,
  KoranaActorType,
  KoranaActorVisibility,
  KoranaFoundationActor,
  KoranaFoundationSnapshot,
} from "../types";


type RecordValue =
  Record<string, unknown>;


function asRecord(
  value: unknown,
): RecordValue {

  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  ) {

    return value as RecordValue;
  }

  return {};
}


function asArray(
  value: unknown,
): unknown[] {

  return Array.isArray(value)
    ? value
    : [];
}


function asString(
  value: unknown,
  fallback = "",
): string {

  return typeof value === "string"
    ? value
    : fallback;
}


function asNullableString(
  value: unknown,
): string | null {

  return typeof value === "string"
    ? value
    : null;
}


function asBoolean(
  value: unknown,
): boolean {

  return value === true;
}


function asNumber(
  value: unknown,
): number {

  const result =
    Number(value);

  return Number.isFinite(result)
    ? result
    : 0;
}


function actorType(
  value: unknown,
): KoranaActorType {

  return value === "organization"
    ? "organization"
    : "profile";
}


function actorVisibility(
  value: unknown,
): KoranaActorVisibility {

  return value === "private"
    ? "private"
    : "public";
}


function actorStatus(
  value: unknown,
): KoranaActorStatus {

  if (
    value === "disabled" ||
    value === "suspended"
  ) {

    return value;
  }

  return "active";
}


function mapActor(
  value: unknown,
): KoranaFoundationActor {

  const row =
    asRecord(value);

  return {
    id:
      asString(row.id),

    type:
      actorType(row.type),

    handle:
      asString(row.handle),

    displayName:
      asString(row.displayName),

    avatarUrl:
      asNullableString(row.avatarUrl),

    verified:
      asBoolean(row.verified),

    visibility:
      actorVisibility(row.visibility),

    status:
      actorStatus(row.status),

    profileId:
      asNullableString(row.profileId),

    organizationId:
      asNullableString(row.organizationId),
  };
}


export class KoranaFoundationRepository {

  constructor(
    private readonly supabase:
      SupabaseClient<Database>,
  ) {}


  async snapshot():
    Promise<KoranaFoundationSnapshot> {

    const {
      data,
      error,
    } =
      await this.supabase.rpc(
        "korana_foundation_snapshot",
      );


    if (error) {

      throw new Error(
        error.message,
      );
    }


    const root =
      asRecord(data);

    const actors =
      asRecord(root.actors);

    const content =
      asRecord(root.content);

    const storage =
      asRecord(root.storage);


    return {
      ready:
        asBoolean(root.ready),

      actors: {
        total:
          asNumber(actors.total),

        profiles:
          asNumber(actors.profiles),

        organizations:
          asNumber(actors.organizations),
      },

      content: {
        posts:
          asNumber(content.posts),

        comments:
          asNumber(content.comments),

        reactions:
          asNumber(content.reactions),

        reposts:
          asNumber(content.reposts),

        follows:
          asNumber(content.follows),
      },

      myActors:
        asArray(
          root.myActors,
        ).map(
          mapActor,
        ),

      storage: {
        bucket:
          asString(
            storage.bucket,
            "korana-media",
          ),

        public:
          asBoolean(
            storage.public,
          ),
      },

      directWrites:
        asBoolean(
          root.directWrites,
        ),
    };
  }
}