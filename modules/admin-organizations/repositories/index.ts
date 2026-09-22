import { supabase } from "@/lib/supabase";
import type { AdminDomainData } from "@/modules/admin-core";

import type { AdminOrganizationsDomain } from "../types";

interface SupabaseErrorLike {
  message: string;
}

interface FighterProfileMeta {
  regionId: string | null;
  verified: boolean;
}

function assertNoError(
  scope: string,
  error: SupabaseErrorLike | null,
): void {
  if (error) {
    throw new Error(
      `${scope}: ${error.message}`,
    );
  }
}

function uniqueValues(
  values: Array<string | null | undefined>,
): string[] {
  return [
    ...new Set(
      values.filter(
        (value): value is string =>
          typeof value === "string" &&
          value.length > 0,
      ),
    ),
  ];
}

function text(
  value: string | null | undefined,
  fallback = "Non renseigné",
): string {
  return value?.trim() || fallback;
}

function booleanLabel(
  value: boolean | null | undefined,
): string {
  if (value === true) {
    return "Oui";
  }

  if (value === false) {
    return "Non";
  }

  return "Indisponible";
}

async function readProfileNames(
  ids: string[],
): Promise<Map<string, string>> {
  if (ids.length === 0) {
    return new Map();
  }

  const {
    data,
    error,
  } = await supabase
    .from("profiles")
    .select(
      "id,full_name",
    )
    .in(
      "id",
      ids,
    );

  assertNoError(
    "Lecture des profils",
    error,
  );

  return new Map(
    (data ?? []).map(
      (row) => [
        row.id,
        row.full_name,
      ],
    ),
  );
}

async function readOrganizationNames(
  ids: string[],
): Promise<Map<string, string>> {
  if (ids.length === 0) {
    return new Map();
  }

  const {
    data,
    error,
  } = await supabase
    .from("organizations")
    .select(
      "id,name",
    )
    .in(
      "id",
      ids,
    );

  assertNoError(
    "Lecture des organisations liées",
    error,
  );

  return new Map(
    (data ?? []).map(
      (row) => [
        row.id,
        row.name,
      ],
    ),
  );
}

async function readRegionNames(
  ids: string[],
): Promise<Map<string, string>> {
  if (ids.length === 0) {
    return new Map();
  }

  const {
    data,
    error,
  } = await supabase
    .from("regions")
    .select(
      "id,name",
    )
    .in(
      "id",
      ids,
    );

  assertNoError(
    "Lecture des régions",
    error,
  );

  return new Map(
    (data ?? []).map(
      (row) => [
        row.id,
        row.name,
      ],
    ),
  );
}

async function readOrganizationMembershipCounts(
  organizationIds: string[],
): Promise<Map<string, number>> {
  if (organizationIds.length === 0) {
    return new Map();
  }

  const {
    data,
    error,
  } = await supabase
    .from("organization_members")
    .select(
      "organization_id",
    )
    .in(
      "organization_id",
      organizationIds,
    );

  assertNoError(
    "Lecture des adhésions d'organisation",
    error,
  );

  const counts =
    new Map<string, number>();

  for (const row of data ?? []) {
    if (!row.organization_id) {
      continue;
    }

    counts.set(
      row.organization_id,
      (counts.get(row.organization_id) ?? 0) + 1,
    );
  }

  return counts;
}

async function readFighterProfileMeta(
  profileIds: string[],
): Promise<Map<string, FighterProfileMeta>> {
  if (profileIds.length === 0) {
    return new Map();
  }

  const {
    data,
    error,
  } = await supabase
    .from("profiles")
    .select(
      "id,region_id,is_verified",
    )
    .in(
      "id",
      profileIds,
    );

  assertNoError(
    "Lecture des profils combattants",
    error,
  );

  return new Map(
    (data ?? []).map(
      (row) => [
        row.id,
        {
          regionId: row.region_id,
          verified: row.is_verified,
        },
      ],
    ),
  );
}

export class AdminOrganizationsRepository {
  list(
    domain: AdminOrganizationsDomain,
  ): Promise<AdminDomainData> {
    switch (domain) {
      case "organizations":
        return this.listOrganizations();

      case "clubs":
        return this.listClubs();

      case "fighters":
        return this.listFighters();

      case "events":
        return this.listEvents();
    }
  }

  private async listOrganizations(): Promise<AdminDomainData> {
    const {
      data,
      error,
    } = await supabase
      .from("organizations")
      .select(
        "id,name,type,owner_id,status,is_verified,discipline",
      )
      .neq(
        "type",
        "club",
      )
      .order(
        "name",
        {
          ascending: true,
        },
      );

    assertNoError(
      "Lecture des organisations",
      error,
    );

    const rows = data ?? [];

    const ownerNames =
      await readProfileNames(
        uniqueValues(
          rows.map(
            (row) => row.owner_id,
          ),
        ),
      );

    const membershipCounts =
      await readOrganizationMembershipCounts(
        rows.map(
          (row) => row.id,
        ),
      );

    return {
      title: "Organisations",
      description:
        "Projection persistée des organisations hors clubs. Les adhésions correspondent aux lignes réellement enregistrées dans organization_members.",
      metrics: [],
      columns: [
        "Nom",
        "Type",
        "Propriétaire",
        "Discipline",
        "Vérifié",
        "Statut",
        "Adhésions persistées",
      ],
      rows: rows.map(
        (row) => ({
          id: row.id,
          cells: [
            row.name,
            row.type,
            ownerNames.get(row.owner_id) ??
              row.owner_id,
            text(row.discipline),
            booleanLabel(row.is_verified),
            text(row.status),
            String(
              membershipCounts.get(row.id) ?? 0,
            ),
          ],
          status:
            row.status ?? undefined,
        }),
      ),
      actions: [],
    };
  }

  private async listClubs(): Promise<AdminDomainData> {
    const {
      data,
      error,
    } = await supabase
      .from("clubs")
      .select(
        "id,name,organization_id,profile_id,region_id,is_official_federated",
      )
      .order(
        "name",
        {
          ascending: true,
        },
      );

    assertNoError(
      "Lecture des clubs",
      error,
    );

    const rows = data ?? [];

    const [
      ownerNames,
      organizationNames,
      regionNames,
    ] = await Promise.all([
      readProfileNames(
        uniqueValues(
          rows.map(
            (row) => row.profile_id,
          ),
        ),
      ),

      readOrganizationNames(
        uniqueValues(
          rows.map(
            (row) => row.organization_id,
          ),
        ),
      ),

      readRegionNames(
        uniqueValues(
          rows.map(
            (row) => row.region_id,
          ),
        ),
      ),
    ]);

    return {
      title: "Clubs",
      description:
        "Projection persistée des clubs. La table clubs ne porte pas de statut administratif générique : aucun statut n'est inventé.",
      metrics: [],
      columns: [
        "Nom",
        "Propriétaire",
        "Région",
        "Organisation liée",
        "Fédéré officiellement",
      ],
      rows: rows.map(
        (row) => ({
          id: row.id,
          cells: [
            row.name,
            ownerNames.get(row.profile_id) ??
              row.profile_id,
            regionNames.get(row.region_id) ??
              row.region_id,
            row.organization_id
              ? organizationNames.get(
                  row.organization_id,
                ) ?? row.organization_id
              : "Aucune organisation liée",
            booleanLabel(
              row.is_official_federated,
            ),
          ],
        }),
      ),
      actions: [],
    };
  }

  private async listFighters(): Promise<AdminDomainData> {
    const {
      data,
      error,
    } = await supabase
      .from("fighters")
      .select(
        "id,full_name,profile_id,weight_class,elo_rating,status,status_professional,wins,losses,draws",
      )
      .order(
        "full_name",
        {
          ascending: true,
        },
      );

    assertNoError(
      "Lecture des combattants",
      error,
    );

    const rows = data ?? [];

    const profileMeta =
      await readFighterProfileMeta(
        uniqueValues(
          rows.map(
            (row) => row.profile_id,
          ),
        ),
      );

    const regionNames =
      await readRegionNames(
        uniqueValues(
          Array.from(
            profileMeta.values(),
          ).map(
            (meta) => meta.regionId,
          ),
        ),
      );

    return {
      title: "Combattants",
      description:
        "Projection persistée des combattants. La région et la vérification proviennent du profil lié. Aucune discipline n'est inventée car fighters ne porte pas cette donnée.",
      metrics: [],
      columns: [
        "Nom",
        "Région",
        "Catégorie",
        "ELO",
        "Bilan",
        "Profil vérifié",
        "Statut",
        "Statut professionnel",
      ],
      rows: rows.map(
        (row) => {
          const profile =
            profileMeta.get(
              row.profile_id,
            );

          const region =
            profile?.regionId
              ? regionNames.get(
                  profile.regionId,
                ) ?? profile.regionId
              : "Indisponible";

          const status =
            row.status ??
            row.status_professional ??
            undefined;

          return {
            id: row.id,
            cells: [
              row.full_name,
              region,
              text(row.weight_class),
              String(row.elo_rating),
              `${row.wins}-${row.losses}-${row.draws}`,
              profile
                ? booleanLabel(
                    profile.verified,
                  )
                : "Indisponible",
              text(row.status),
              String(
                row.status_professional,
              ),
            ],
            status,
          };
        },
      ),
      actions: [],
    };
  }

  private async listEvents(): Promise<AdminDomainData> {
    const {
      data,
      error,
    } = await supabase
      .from("events")
      .select(
        "id,title,organizer_id,region_id,event_type,status,visibility,starts_at,published_at,archived_at",
      )
      .order(
        "starts_at",
        {
          ascending: false,
          nullsFirst: false,
        },
      );

    assertNoError(
      "Lecture des événements",
      error,
    );

    const rows = data ?? [];

    const [
      organizerNames,
      regionNames,
    ] = await Promise.all([
      readOrganizationNames(
        uniqueValues(
          rows.map(
            (row) => row.organizer_id,
          ),
        ),
      ),

      readRegionNames(
        uniqueValues(
          rows.map(
            (row) => row.region_id,
          ),
        ),
      ),
    ]);

    return {
      title: "Événements",
      description:
        "Projection persistée des événements. event_type est affiché comme type; aucune discipline ni vérification n'est inventée.",
      metrics: [],
      columns: [
        "Titre",
        "Organisateur",
        "Région",
        "Type",
        "Début",
        "Visibilité",
        "Publication",
        "Archivage",
        "Statut",
      ],
      rows: rows.map(
        (row) => ({
          id: row.id,
          cells: [
            row.title,
            row.organizer_id
              ? organizerNames.get(
                  row.organizer_id,
                ) ?? row.organizer_id
              : "Aucun organisateur",
            row.region_id
              ? regionNames.get(
                  row.region_id,
                ) ?? row.region_id
              : "Non renseigné",
            text(row.event_type),
            row.starts_at ??
              "Non planifié",
            row.visibility,
            row.published_at
              ? "Publié"
              : "Non publié",
            row.archived_at
              ? "Archivé"
              : "Non archivé",
            text(row.status),
          ],
          status:
            row.status ?? undefined,
        }),
      ),
      actions: [],
    };
  }
}