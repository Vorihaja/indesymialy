"use client";

import Link from "next/link";

import {
  useAdminDomain,
  type AdminAccessLevel,
  type AdminDomain,
} from "@/modules/admin-core";
import {
  useAdminOrganizations,
  type AdminOrganizationsDomain,
} from "@/modules/admin-organizations";
import { useAdminUsers } from "@/modules/admin-users/hooks";

const organizationDomains =
  new Set<AdminOrganizationsDomain>([
    "organizations",
    "clubs",
    "fighters",
    "events",
  ]);

const memoryDomains =
  new Set<AdminDomain>([
    "audit-log",
  ]);

const stateClass =
  "border border-[#303238] bg-[#151619] p-6 text-sm text-zinc-500";

interface AdminDetailFeatureProps {
  section: string;
  id: string;
  access: AdminAccessLevel;
}

interface DetailViewProps {
  id: string;
  title: string;
  columns: string[];
  cells: string[];
  backHref: string;
  provisionalMutations?: boolean;
}

function DetailView({
  id,
  title,
  columns,
  cells,
  backHref,
  provisionalMutations = false,
}: DetailViewProps) {
  return (
    <section className="border border-[#303238] bg-[#151619]">
      <header className="border-b border-[#303238] p-4">
        <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#3d92ff]">
          Fiche détaillée
        </p>

        <h2 className="mt-1 text-xl font-black">
          {title}
        </h2>

        <p className="mt-1 text-[10px] text-zinc-500">
          Identifiant : {id}
        </p>
      </header>

      <div className="p-4">
        <dl className="grid gap-2 md:grid-cols-2">
          {cells.map(
            (cell, index) => (
              <div
                key={`${id}-${columns[index] ?? index}`}
                className="border border-[#303238] bg-[#101114] p-3"
              >
                <dt className="text-[9px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
                  {columns[index] ??
                    `Champ ${index + 1}`}
                </dt>

                <dd className="mt-1 text-xs font-semibold text-zinc-200">
                  {cell}
                </dd>
              </div>
            ),
          )}
        </dl>
      </div>

      <footer className="flex flex-wrap gap-2 border-t border-[#303238] bg-[#101114] p-4">
        {provisionalMutations ? (
          <>
            <button
              className="inline-flex h-9 items-center border border-[#d8273f] bg-[#c82335] px-4 text-[10px] font-bold text-white hover:bg-[#df2a43]"
              type="button"
            >
              Mettre à jour
            </button>

            <button
              className="inline-flex h-9 items-center border border-red-500/40 bg-red-500/5 px-4 text-[10px] font-semibold text-red-300"
              type="button"
            >
              Suspendre
            </button>
          </>
        ) : null}

        <Link
          href={backHref}
          className="inline-flex h-9 items-center border border-[#343840] px-4 text-[10px] font-semibold text-zinc-300 hover:border-[#2588ff]"
        >
          Retour à la liste
        </Link>
      </footer>
    </section>
  );
}

function AdminUserDetailFeature({
  id,
  access,
}: {
  id: string;
  access: AdminAccessLevel;
}) {
  const {
    data,
    loading,
    error,
  } = useAdminUsers("users");

  if (loading) {
    return (
      <p className={stateClass}>
        Chargement…
      </p>
    );
  }

  if (error) {
    return (
      <p className="border border-red-500/30 bg-red-500/5 p-6 text-sm text-red-400">
        {error}
      </p>
    );
  }

  const row =
    data?.rows.find(
      (item) => item.id === id,
    ) ?? null;

  if (!data || !row) {
    return (
      <p className={stateClass}>
        Utilisateur introuvable dans le stockage persistant.
      </p>
    );
  }

  return (
    <DetailView
      id={id}
      title={row.cells[0] ?? id}
      columns={data.columns}
      cells={row.cells}
      backHref={`/dashboard/${access}/users`}
    />
  );
}

function AdminOrganizationDetailFeature({
  domain,
  id,
  access,
}: {
  domain: AdminOrganizationsDomain;
  id: string;
  access: AdminAccessLevel;
}) {
  const {
    data,
    loading,
    error,
  } = useAdminOrganizations(domain);

  if (loading) {
    return (
      <p className={stateClass}>
        Chargement…
      </p>
    );
  }

  if (error) {
    return (
      <p className="border border-red-500/30 bg-red-500/5 p-6 text-sm text-red-400">
        {error}
      </p>
    );
  }

  const row =
    data?.rows.find(
      (item) => item.id === id,
    ) ?? null;

  if (!data || !row) {
    return (
      <p className={stateClass}>
        Ressource introuvable dans le stockage persistant.
      </p>
    );
  }

  return (
    <DetailView
      id={id}
      title={row.cells[0] ?? id}
      columns={data.columns}
      cells={row.cells}
      backHref={`/dashboard/${access}/${domain}`}
    />
  );
}

function AdminMemoryDetailFeature({
  domain,
  id,
  access,
}: {
  domain: AdminDomain;
  id: string;
  access: AdminAccessLevel;
}) {
  const {
    data,
    loading,
    error,
  } = useAdminDomain(domain);

  if (loading) {
    return (
      <p className={stateClass}>
        Chargement…
      </p>
    );
  }

  if (error) {
    return (
      <p className="border border-red-500/30 bg-red-500/5 p-6 text-sm text-red-400">
        {error}
      </p>
    );
  }

  const row =
    data?.rows.find(
      (item) => item.id === id,
    ) ?? null;

  if (!data || !row) {
    return (
      <p className={stateClass}>
        Cette ressource n’existe pas dans le stockage provisoire.
      </p>
    );
  }

  return (
    <DetailView
      id={id}
      title={row.cells[0] ?? id}
      columns={data.columns}
      cells={row.cells}
      backHref={`/dashboard/${access}/${domain}`}
      provisionalMutations
    />
  );
}

export function AdminDetailFeature({
  section,
  id,
  access,
}: AdminDetailFeatureProps) {
  if (section === "users") {
    return (
      <AdminUserDetailFeature
        id={id}
        access={access}
      />
    );
  }

  if (
    organizationDomains.has(
      section as AdminOrganizationsDomain,
    )
  ) {
    return (
      <AdminOrganizationDetailFeature
        domain={
          section as AdminOrganizationsDomain
        }
        id={id}
        access={access}
      />
    );
  }

  if (
    !memoryDomains.has(
      section as AdminDomain,
    )
  ) {
    return (
      <p className={stateClass}>
        Ressource inconnue.
      </p>
    );
  }

  return (
    <AdminMemoryDetailFeature
      domain={section as AdminDomain}
      id={id}
      access={access}
    />
  );
}