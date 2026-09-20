"use client";

import Link from "next/link";

import type {
  ReactNode,
} from "react";

import {
  Bell,
  Building2,
  Eye,
  ExternalLink,
  LockKeyhole,
  MapPin,
  Settings2,
  ShieldCheck,
  UserRound,
  UsersRound,
} from "lucide-react";

import type {
  IdentitySnapshot,
} from "../types";

import {
  getAccountIdentityRoleLabel,
  isPublicIdentityRole,
} from "../role-policy";

import {
  identityPanelClass,
} from "./IdentityViews";


export type AccountProfileDraftView = {
  fullName: string;
  username: string;
  email: string;
  phone: string;
  regionId: string;
  cityId: string;
  disciplineIds: string[];
};


type SharedProps = {
  state: IdentitySnapshot;
  draft: AccountProfileDraftView;
};


function MetricCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article
      className={`${identityPanelClass} min-w-0`}
    >
      <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-zinc-600">
        {label}
      </p>

      <strong className="mt-2 block truncate text-[24px] font-black tracking-[-0.04em] text-white">
        {value}
      </strong>

      <p className="mt-1 truncate text-[10px] text-zinc-500">
        {detail}
      </p>
    </article>
  );
}


function AccountShortcut({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group grid min-h-28 grid-cols-[38px_minmax(0,1fr)_16px] items-start gap-3 border border-[#303238] bg-[#0f1012] p-4 transition hover:border-[#3d92ff]/60 hover:bg-[#11151b]"
    >
      <span className="grid h-9 w-9 place-items-center border border-[#343840] text-[#3d92ff] transition group-hover:border-[#3d92ff]/60">
        {icon}
      </span>

      <span className="min-w-0">
        <strong className="block text-[11px] font-semibold text-zinc-200">
          {title}
        </strong>

        <span className="mt-1 block text-[9px] leading-4 text-zinc-500">
          {description}
        </span>
      </span>

      <ExternalLink
        size={12}
        className="mt-1 text-zinc-700 transition group-hover:text-[#3d92ff]"
      />
    </Link>
  );
}


function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-start justify-between gap-5 border-b border-[#292c31] py-2.5 last:border-b-0">
      <span className="shrink-0 text-[9px] text-zinc-600">
        {label}
      </span>

      <strong className="min-w-0 text-right text-[10px] font-semibold text-zinc-300">
        {value}
      </strong>
    </div>
  );
}


function resolvePublicRoles(
  state: IdentitySnapshot,
) {
  const profile =
    state.draft.profile;

  const roles: string[] = [];

  if (
    profile.primaryRole &&
    (profile.primaryRole === "official" ||
      isPublicIdentityRole(
        profile.primaryRole,
      ))
  ) {
    roles.push(
      getAccountIdentityRoleLabel(
        profile.primaryRole,
      ),
    );
  }

  profile.secondaryRoles
    .filter(
      (role) =>
        role === "official" ||
        isPublicIdentityRole(role),
    )
    .forEach(
      (role) => {
        const label =
          getAccountIdentityRoleLabel(
            role,
          );

        if (
          !roles.includes(
            label,
          )
        ) {
          roles.push(
            label,
          );
        }
      },
    );

  return roles;
}


export function AccountProfileMetrics({
  state,
  draft,
  completion,
}: SharedProps & {
  completion: number;
}) {
  const roles =
    resolvePublicRoles(
      state,
    );

  const organizations =
    state.organizations.filter(
      (organization) =>
        organization.type !==
        "personal",
    );

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard
        label="Complétion"
        value={`${completion}%`}
        detail="Profil personnel Indesy"
      />

      <MetricCard
        label="Rôles"
        value={String(
          roles.length,
        )}
        detail={
          roles.length
            ? roles.join(" · ")
            : "Aucun rôle public actif"
        }
      />

      <MetricCard
        label="Disciplines"
        value={String(
          draft.disciplineIds.length,
        )}
        detail="Disciplines associées au profil"
      />

      <MetricCard
        label="Organisations"
        value={String(
          organizations.length,
        )}
        detail="Structures liées à votre compte"
      />
    </section>
  );
}


export function AccountProfileContext({
  state,
  draft,
}: SharedProps) {
  const profile =
    state.draft.profile;

  const roles =
    resolvePublicRoles(
      state,
    );

  const organizations =
    state.organizations.filter(
      (organization) =>
        organization.type !==
        "personal",
    );

  const activeOrganization =
    state.organizations.find(
      (organization) =>
        organization.id ===
        state.activeOrganizationId,
    ) ?? null;

  const regionName =
    state.regions.find(
      (region) =>
        region.id ===
        draft.regionId,
    )?.name ??
    "Non renseignée";

  const cityName =
    state.cities.find(
      (city) =>
        city.id ===
        draft.cityId,
    )?.name ??
    "Non renseignée";

  const disciplineNames =
    state.disciplines
      .filter(
        (discipline) =>
          draft.disciplineIds.includes(
            discipline.id,
          ),
      )
      .map(
        (discipline) =>
          discipline.name,
      );

  const visibilityLabels:
    Record<
      typeof state.preferences.profileVisibility,
      string
    > = {
      public: "Public",
      members: "Membres Indesy",
      private: "Privé",
    };

  const statusLabels:
    Record<
      typeof profile.status,
      string
    > = {
      active: "Actif",
      pending: "En attente",
      suspended: "Suspendu",
    };

  return (
    <div className="grid gap-3">

      <section className="grid gap-3 lg:grid-cols-2">

        <article
          className={`${identityPanelClass} min-w-0`}
        >
          <div className="flex items-start gap-4">

            {profile.photoPrepared ? (
              <img
                src={profile.photoPrepared}
                alt=""
                className="h-16 w-16 shrink-0 rounded-full border border-[#303844] object-cover"
              />
            ) : (
              <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full border border-[#303844] bg-[#0b0f15] text-zinc-600">
                <UserRound
                  size={22}
                />
              </span>
            )}

            <div className="min-w-0 flex-1">

              <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#6aafff]">
                Identité dans Indesy
              </p>

              <h3 className="mt-2 truncate text-[17px] font-black tracking-[-0.025em] text-white">
                {draft.fullName ||
                  "Nom non renseigné"}
              </h3>

              <p className="mt-1 truncate text-[11px] text-zinc-500">
                {draft.username
                  ? draft.username
                  : "Username non renseigné"}
              </p>

            </div>

          </div>


          <div className="mt-5 border-t border-[#303238] pt-2">

            <DetailRow
              label="Statut du compte"
              value={
                statusLabels[
                  profile.status
                ]
              }
            />

            <DetailRow
              label="Visibilité"
              value={
                visibilityLabels[
                  state.preferences
                    .profileVisibility
                ]
              }
            />

            <DetailRow
              label="Découvrable"
              value={
                state.preferences
                  .discoverable
                  ? "Oui"
                  : "Non"
              }
            />

            <DetailRow
              label="Localisation"
              value={`${cityName} · ${regionName}`}
            />

          </div>


          <div className="mt-4 border-t border-[#303238] pt-4">

            <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-zinc-600">
              Disciplines
            </p>

            <p className="mt-2 text-[10px] leading-5 text-zinc-300">
              {disciplineNames.length
                ? disciplineNames.join(
                    " · ",
                  )
                : "Aucune discipline associée"}
            </p>

          </div>
        </article>


        <article
          className={`${identityPanelClass} min-w-0`}
        >
          <div className="flex items-center gap-3">

            <UsersRound
              size={18}
              className="text-[#3d92ff]"
            />

            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-zinc-600">
                Rôles & espaces
              </p>

              <h3 className="mt-1 text-[14px] font-semibold text-white">
                Votre présence dans l’écosystème
              </h3>
            </div>

          </div>


          <div className="mt-4">

            <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-zinc-600">
              Rôles actifs
            </p>

            <div className="mt-2 flex flex-wrap gap-2">

              {roles.length ? (
                roles.map(
                  (role) => (
                    <span
                      key={role}
                      className="border border-[#3d92ff]/35 bg-[#3d92ff]/10 px-2.5 py-1.5 text-[9px] font-semibold text-[#6aafff]"
                    >
                      {role}
                    </span>
                  ),
                )
              ) : (
                <span className="text-[10px] text-zinc-500">
                  Aucun rôle public actif.
                </span>
              )}

            </div>

          </div>


          <div className="mt-5 border-t border-[#303238] pt-2">

            <DetailRow
              label="Organisations liées"
              value={String(
                organizations.length,
              )}
            />

            <DetailRow
              label="Organisation active"
              value={
                activeOrganization &&
                activeOrganization.type !==
                  "personal"
                  ? activeOrganization.name
                  : "Aucune"
              }
            />

            <DetailRow
              label="Rôle principal"
              value={
                profile.primaryRole &&
                (profile.primaryRole === "official" ||
                  isPublicIdentityRole(
                    profile.primaryRole,
                  ))
                  ? getAccountIdentityRoleLabel(
                      profile.primaryRole,
                    )
                  : "Aucun"
              }
            />

          </div>


          <div className="mt-4 flex flex-wrap gap-2">

            <Link
              href="/account/roles"
              className="border border-[#303844] bg-[#0f1012] px-3 py-2 text-[10px] font-semibold text-zinc-300 transition hover:border-[#3d92ff]/60 hover:text-white"
            >
              Gérer mes rôles
            </Link>

            <Link
              href="/account/organizations"
              className="border border-[#303844] bg-[#0f1012] px-3 py-2 text-[10px] font-semibold text-zinc-300 transition hover:border-[#3d92ff]/60 hover:text-white"
            >
              Mes organisations
            </Link>

          </div>
        </article>

      </section>


      <section
        className={`${identityPanelClass} min-w-0`}
      >
        <div className="flex items-start gap-3">

          <Settings2
            size={18}
            className="mt-0.5 text-[#3d92ff]"
          />

          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-zinc-600">
              Gestion du compte
            </p>

            <h3 className="mt-1 text-[14px] font-semibold text-white">
              Paramètres personnels Indesy
            </h3>

            <p className="mt-1 max-w-3xl text-[10px] leading-5 text-zinc-500">
              Le profil reste la source unique de votre identité.
              Les réglages de sécurité, visibilité et notifications
              sont gérés séparément sans être dupliqués dans les ERP.
            </p>
          </div>

        </div>


        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">

          <AccountShortcut
            href="/account/security"
            icon={
              <LockKeyhole
                size={16}
              />
            }
            title="Sécurité"
            description="Mot de passe et protection du compte."
          />

          <AccountShortcut
            href="/account/preferences"
            icon={
              <Settings2
                size={16}
              />
            }
            title="Préférences"
            description="Réglages personnels de votre expérience."
          />

          <AccountShortcut
            href="/account/notifications"
            icon={
              <Bell
                size={16}
              />
            }
            title="Notifications"
            description="Canaux de notification du compte."
          />

          <AccountShortcut
            href="/account/privacy"
            icon={
              <Eye
                size={16}
              />
            }
            title="Confidentialité"
            description="Visibilité et découvrabilité du profil."
          />

          <AccountShortcut
            href="/account/sessions"
            icon={
              <ShieldCheck
                size={16}
              />
            }
            title="Sessions"
            description="Accès et appareils connectés."
          />

        </div>
      </section>


      <section className="grid gap-3 md:grid-cols-2">

        <article
          className={`${identityPanelClass} min-w-0`}
        >
          <Building2
            size={17}
            className="text-[#3d92ff]"
          />

          <p className="mt-3 text-[9px] font-bold uppercase tracking-[0.12em] text-zinc-600">
            Organisations
          </p>

          <strong className="mt-1 block text-[14px] text-white">
            {organizations.length
              ? `${organizations.length} structure${organizations.length > 1 ? "s" : ""}`
              : "Aucune structure liée"}
          </strong>

          <p className="mt-2 text-[10px] leading-5 text-zinc-500">
            Clubs, organisations, sponsors, vendeurs, fédérations
            ou ligues sont des identités distinctes de votre profil personnel.
          </p>

          <Link
            href="/account/organizations"
            className="mt-4 inline-flex items-center gap-2 border border-[#303844] px-3 py-2 text-[10px] font-semibold text-zinc-300 transition hover:border-[#3d92ff]/60 hover:text-white"
          >
            Voir mes organisations

            <ExternalLink
              size={11}
            />
          </Link>
        </article>


        <article
          className={`${identityPanelClass} min-w-0`}
        >
          <MapPin
            size={17}
            className="text-[#3d92ff]"
          />

          <p className="mt-3 text-[9px] font-bold uppercase tracking-[0.12em] text-zinc-600">
            Ancrage territorial
          </p>

          <strong className="mt-1 block text-[14px] text-white">
            {cityName}
          </strong>

          <p className="mt-1 text-[10px] text-zinc-500">
            {regionName}
          </p>

          <p className="mt-3 text-[10px] leading-5 text-zinc-500">
            Cette localisation appartient à votre identité personnelle
            et peut être utilisée par les modules autorisés de l’écosystème.
          </p>
        </article>

      </section>

    </div>
  );
}
