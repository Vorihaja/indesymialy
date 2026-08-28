"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import {
  useRouter,
} from "next/navigation";

import {
  Building2,
  CheckCircle2,
  Circle,
  Dumbbell,
  ExternalLink,
  Globe2,
  LoaderCircle,
  MapPin,
  Plug,
  Save,
  Settings2,
  ShieldCheck,
  UsersRound,
} from "lucide-react";

import {
  GeographySelector,
  type GeographyValue,
} from "@/modules/geography";

import {
  DisciplineSelect,
} from "@/modules/disciplines";

import {
  useIdentity,
} from "@/modules/identity-core/hooks/useIdentity";

import type {
  IdentityOrganization,
} from "@/modules/identity-core/types";

import {
  OrganizerToast,
  organizerButtonClass,
  organizerPrimaryButtonClass,
  type OrganizerToastState,
} from "./OrganizerFeedback";

import {
  OrganizerVerificationView,
} from "./OrganizerVerificationView";


const fieldClass =
  "h-9 w-full border border-[#343840] bg-[#101114] px-2.5 text-[11px] text-white outline-none focus:border-[#087cff]";

const labelClass =
  "grid gap-1 text-[9px] font-semibold uppercase tracking-[0.08em] text-zinc-500";

const panelClass =
  "border border-[#303238] bg-[#151619]";

const emptyGeo = {
  regionId: "",
  districtId: "",
  cityId: "",
  communeId: "",
};


type OrganizationForm =
  typeof emptyGeo & {
    name: string;
    description: string;
    email: string;
    phone: string;
    website: string;
    disciplineIds: string[];
  };


const emptyOrganization: OrganizationForm = {
  ...emptyGeo,
  name: "",
  description: "",
  email: "",
  phone: "",
  website: "",
  disciplineIds: [],
};


const STATUS_LABELS:
  Record<
    IdentityOrganization["status"],
    string
  > = {
    draft: "Brouillon",
    pending: "En attente",
    active: "Active",
    suspended: "Suspendue",
  };


function CompletionBar({
  value,
}: {
  value: number;
}) {
  return (
    <div className="grid gap-1.5">

      <div className="flex justify-between text-[9px] uppercase tracking-[0.08em] text-zinc-500">

        <span>
          Complétion organisation
        </span>

        <strong className="text-zinc-200">
          {value} %
        </strong>

      </div>

      <div className="h-1.5 bg-[#292c31]">

        <div
          className="h-full bg-[#087cff]"
          style={{
            width: `${value}%`,
          }}
        />

      </div>

    </div>
  );
}


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
    <article className={`${panelClass} min-w-0 p-4`}>

      <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-zinc-600">
        {label}
      </p>

      <strong className="mt-2 block truncate text-[22px] font-black tracking-[-0.03em] text-white">
        {value}
      </strong>

      <p className="mt-1 truncate text-[10px] text-zinc-500">
        {detail}
      </p>

    </article>
  );
}


function SetupRow({
  done,
  label,
  detail,
}: {
  done: boolean;
  label: string;
  detail: string;
}) {
  return (
    <div className="flex gap-3 border-b border-[#292c31] py-3 last:border-b-0">

      {done ? (
        <CheckCircle2
          size={15}
          className="mt-0.5 shrink-0 text-emerald-400"
        />
      ) : (
        <Circle
          size={15}
          className="mt-0.5 shrink-0 text-zinc-700"
        />
      )}

      <div className="min-w-0">

        <p
          className={
            done
              ? "text-[10px] font-semibold text-zinc-200"
              : "text-[10px] font-semibold text-zinc-500"
          }
        >
          {label}
        </p>

        <p className="mt-0.5 text-[9px] leading-4 text-zinc-600">
          {detail}
        </p>

      </div>

    </div>
  );
}


function ConfigurationShortcut({
  icon,
  title,
  description,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick(): void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group grid min-h-28 grid-cols-[36px_minmax(0,1fr)_18px] items-start gap-3 border border-[#303238] bg-[#101114] p-4 text-left transition hover:border-[#087cff]/60 hover:bg-[#12151a]"
    >

      <span className="grid h-9 w-9 place-items-center border border-[#343840] text-[#3d92ff] transition group-hover:border-[#087cff]/60">
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

    </button>
  );
}


export function OrganizerSettingsView({
  tab,
  onTabChange,
}: {
  tab: string;

  onTabChange(
    tab: string,
  ): void;
}) {
  const router = useRouter();

  const api = useIdentity();

  const [
    organizationForm,
    setOrganizationForm,
  ] =
    useState<OrganizationForm>(
      emptyOrganization,
    );

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    notice,
    setNotice,
  ] =
    useState<OrganizerToastState>(
      null,
    );


  const organization =
    useMemo(
      () =>
        api.state?.organizations.find(
          (item) =>
            item.type === "organizer",
        ),
      [
        api.state?.organizations,
      ],
    );


  useEffect(
    () => {
      if (!organization) {
        setOrganizationForm(
          emptyOrganization,
        );

        return;
      }

      setOrganizationForm({
        name:
          organization.name,

        description:
          organization.description,

        email:
          organization.email ?? "",

        phone:
          organization.phone ?? "",

        website:
          organization.website ?? "",

        regionId:
          organization.regionId ?? "",

        districtId: "",

        cityId:
          organization.cityId ?? "",

        communeId: "",

        disciplineIds:
          [...organization.disciplines],
      });
    },
    [
      organization,
    ],
  );


  if (api.loading) {
    return (
      <div className="grid min-h-52 place-items-center border border-[#303238] bg-[#151619]">

        <span className="flex items-center gap-2 text-[11px] text-zinc-400">

          <LoaderCircle
            size={15}
            className="animate-spin"
          />

          Chargement des paramètres…

        </span>

      </div>
    );
  }


  if (
    api.error ||
    !api.state
  ) {
    return (
      <div className="border border-red-500/30 bg-red-500/5 p-4 text-[11px] text-red-300">
        {api.error ??
          "Paramètres indisponibles."}
      </div>
    );
  }


  const state =
    api.state;

  const profile =
    state.draft.profile;


  const organizationCompletion =
    Math.round(
      (
        [
          organizationForm.name,
          organizationForm.description,
          organizationForm.email,
          organizationForm.phone,
          organizationForm.regionId,
          organizationForm.cityId,
          organizationForm.disciplineIds.length,
        ].filter(Boolean).length /
        7
      ) *
        100,
    );


  const regionName =
    state.regions.find(
      (region) =>
        region.id ===
        organizationForm.regionId,
    )?.name ??
    "Non renseignée";


  const cityName =
    state.cities.find(
      (city) =>
        city.id ===
        organizationForm.cityId,
    )?.name ??
    "Non renseignée";


  const selectedDisciplineNames =
    state.disciplines
      .filter(
        (discipline) =>
          organizationForm.disciplineIds.includes(
            discipline.id,
          ),
      )
      .map(
        (discipline) =>
          discipline.name,
      );


  const memberCount =
    organization?.members.length ??
    0;


  const statusLabel =
    organization
      ? STATUS_LABELS[
          organization.status
        ]
      : "Non créée";


  const setupItems = [
    {
      done:
        Boolean(
          organizationForm.name.trim() &&
          organizationForm.description.trim(),
        ),

      label:
        "Identité de l’organisation",

      detail:
        "Nom officiel et présentation.",
    },
    {
      done:
        Boolean(
          organizationForm.email.trim() &&
          organizationForm.phone.trim(),
        ),

      label:
        "Coordonnées professionnelles",

      detail:
        "Email et téléphone professionnels.",
    },
    {
      done:
        Boolean(
          organizationForm.regionId &&
          organizationForm.cityId,
        ),

      label:
        "Localisation administrative",

      detail:
        "Région et ville ou commune.",
    },
    {
      done:
        organizationForm.disciplineIds.length >
        0,

      label:
        "Disciplines",

      detail:
        "Au moins une discipline liée à l’organisation.",
    },
    {
      done:
        Boolean(
          organizationForm.website.trim(),
        ),

      label:
        "Présence web",

      detail:
        "Site officiel de l’organisation.",
    },
    {
      done:
        Boolean(
          organization &&
          organization.status ===
            "active",
        ),

      label:
        "Organisation active",

      detail:
        "La structure est active dans Indesy.",
    },
    {
      done:
        memberCount >
        0,

      label:
        "Équipe enregistrée",

      detail:
        "Au moins un membre est rattaché à la structure.",
    },
  ];


  const completedSetup =
    setupItems.filter(
      (item) =>
        item.done,
    ).length;


  async function run(
    action:
      () =>
        Promise<unknown>,

    success:
      string,
  ) {
    setSaving(true);
    setNotice(null);

    try {
      await action();

      await api.refresh();

      setNotice({
        tone: "success",
        message: success,
      });
    } catch (reason) {
      setNotice({
        tone: "error",

        message:
          reason instanceof Error
            ? reason.message
            : "L’enregistrement a échoué.",
      });
    } finally {
      setSaving(false);
    }
  }


  function organizationPayload():
    Omit<
      IdentityOrganization,
      "id" |
      "ownerId" |
      "members" |
      "status"
    > {
    return {
      name:
        organizationForm.name.trim(),

      type:
        "organizer",

      description:
        organizationForm.description.trim(),

      email:
        organizationForm.email.trim(),

      phone:
        organizationForm.phone.trim(),

      website:
        organizationForm.website.trim(),

      regionId:
        organizationForm.regionId,

      cityId:
        organizationForm.cityId,

      disciplines:
        organizationForm.disciplineIds,

      invitationsPrepared: [],

      internalRolesPrepared: [],
    };
  }


  function saveOrganization() {
    if (
      !organizationForm.name.trim()
    ) {
      setNotice({
        tone: "error",

        message:
          "Le nom de l’organisation est obligatoire.",
      });

      return;
    }

    void run(
      async () => {
        const payload =
          organizationPayload();

        const saved =
          organization
            ? await api.useCase
                .updateOrganization(
                  organization.id,
                  payload,
                )
            : await api.useCase
                .createOrganization(
                  payload,
                );

        await api.useCase
          .activateOrganization(
            saved.id,
          );
      },

      organization
        ? "Organisation organisatrice mise à jour."
        : "Organisation organisatrice créée.",
    );
  }


  const header = (
    <div className="grid gap-4 border border-[#303238] bg-[#151619] p-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">

      <div>

        <span className="text-[8px] font-bold uppercase tracking-[0.14em] text-[#3d92ff]">
          Configuration Organisateur
        </span>

        <h2 className="mt-1 text-[17px] font-semibold tracking-[-0.02em] text-white">
          Paramètres de l’organisation
        </h2>

        <p className="mt-1 max-w-3xl text-[11px] leading-5 text-zinc-400">
          Configurez l’identité, la présence et le fonctionnement de
          l’organisation qui porte vos événements.
        </p>

      </div>


      <div className="flex flex-wrap gap-2">

        <Link
          href="/account/profile"
          className={
            organizerButtonClass
          }
        >
          Mon profil Indesy

          <ExternalLink
            size={12}
          />
        </Link>

        <Link
          href="/account/preferences"
          className={
            organizerButtonClass
          }
        >
          Paramètres du compte

          <ExternalLink
            size={12}
          />
        </Link>

      </div>

    </div>
  );


  const toast = (
    <OrganizerToast
      toast={notice}
      onClose={
        () =>
          setNotice(null)
      }
    />
  );


  if (
    tab ===
    "Vérification organisation"
  ) {
    return (
      <div className="grid gap-3">

        {header}

        <OrganizerVerificationView
          profile={profile}
          organization={organization}
          onProfileEdit={
            () =>
              router.push(
                "/account/profile",
              )
          }
        />

      </div>
    );
  }


  if (
    tab ===
    "Utilisateurs & droits"
  ) {
    return (
      <div className="grid gap-3">

        {header}

        <section className={`${panelClass} p-5`}>

          <UsersRound
            size={20}
            className="text-[#3d92ff]"
          />

          <h3 className="mt-3 text-[12px] font-semibold">
            Utilisateurs & droits
          </h3>

          <p className="mt-1 text-[11px] leading-5 text-zinc-500">
            Les membres et responsabilités sont rattachés à
            l’organisation active.
          </p>


          {organization ? (
            <div className="mt-4 border border-[#303238]">

              {organization.members.length ? (
                organization.members.map(
                  (member) => (
                    <div
                      key={member.profileId}
                      className="grid grid-cols-[minmax(0,1fr)_150px_100px] border-b border-[#303238] p-3 text-[10px] last:border-b-0"
                    >

                      <span className="truncate">
                        {member.profileId ===
                        profile.id
                          ? profile.fullName
                          : member.profileId}
                      </span>

                      <span>
                        {member.role}
                      </span>

                      <span className="text-emerald-400">
                        {member.status}
                      </span>

                    </div>
                  ),
                )
              ) : (
                <div className="p-4 text-[10px] text-zinc-500">
                  Aucun membre supplémentaire.
                </div>
              )}

            </div>
          ) : (
            <div className="mt-4 border border-amber-500/25 bg-amber-500/5 p-4 text-[10px] text-amber-200">
              Créez d’abord votre organisation organisatrice.
            </div>
          )}

        </section>

      </div>
    );
  }


  if (
    tab ===
    "Intégrations"
  ) {
    return (
      <div className="grid gap-3">

        {header}

        <section className={`${panelClass} p-5`}>

          <Plug
            size={20}
            className="text-[#3d92ff]"
          />

          <h3 className="mt-3 text-[12px] font-semibold">
            Intégrations
          </h3>

          <p className="mt-1 max-w-2xl text-[11px] leading-5 text-zinc-500">
            Les services externes propres à l’organisation
            seront configurés ici.
          </p>

          <button
            type="button"
            disabled
            className={`${organizerButtonClass} mt-4`}
          >
            Configuration bientôt disponible
          </button>

        </section>

      </div>
    );
  }


  return (
    <div className="grid gap-3">

      {header}

      {toast}


      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">

        <MetricCard
          label="Complétion"
          value={`${organizationCompletion}%`}
          detail={`${completedSetup}/${setupItems.length} éléments configurés`}
        />

        <MetricCard
          label="Statut"
          value={statusLabel}
          detail={
            organization
              ? "Statut actuel de la structure"
              : "Organisation à créer"
          }
        />

        <MetricCard
          label="Membres"
          value={String(memberCount)}
          detail="Profils rattachés à l’organisation"
        />

        <MetricCard
          label="Disciplines"
          value={String(
            organizationForm.disciplineIds.length,
          )}
          detail="Disciplines actuellement associées"
        />

      </section>


      <section className="grid min-w-0 gap-3 xl:grid-cols-[minmax(0,1fr)_300px]">

        <div className={`${panelClass} min-w-0`}>

          <header className="flex items-center gap-3 border-b border-[#303238] px-4 py-3">

            <Building2
              size={17}
              className="text-[#3d92ff]"
            />

            <div>

              <h3 className="text-[12px] font-semibold">
                Identité de l’organisation
              </h3>

              <p className="text-[10px] text-zinc-500">
                Informations administratives et professionnelles.
              </p>

            </div>

          </header>


          <div className="grid gap-5 p-4">

            <CompletionBar
              value={
                organizationCompletion
              }
            />


            <div className="grid gap-3 md:grid-cols-2">

              <label className={labelClass}>
                Nom officiel *

                <input
                  className={fieldClass}
                  value={
                    organizationForm.name
                  }
                  onChange={
                    (event) =>
                      setOrganizationForm(
                        (current) => ({
                          ...current,
                          name:
                            event.target.value,
                        }),
                      )
                  }
                />
              </label>


              <label className={labelClass}>
                Email professionnel

                <input
                  type="email"
                  className={fieldClass}
                  value={
                    organizationForm.email
                  }
                  onChange={
                    (event) =>
                      setOrganizationForm(
                        (current) => ({
                          ...current,
                          email:
                            event.target.value,
                        }),
                      )
                  }
                />
              </label>


              <label className={labelClass}>
                Téléphone professionnel

                <input
                  className={fieldClass}
                  value={
                    organizationForm.phone
                  }
                  onChange={
                    (event) =>
                      setOrganizationForm(
                        (current) => ({
                          ...current,
                          phone:
                            event.target.value,
                        }),
                      )
                  }
                />
              </label>


              <label className={labelClass}>
                Site web

                <input
                  type="url"
                  className={fieldClass}
                  value={
                    organizationForm.website
                  }
                  onChange={
                    (event) =>
                      setOrganizationForm(
                        (current) => ({
                          ...current,
                          website:
                            event.target.value,
                        }),
                      )
                  }
                />
              </label>


              <label className={`${labelClass} md:col-span-2`}>
                Présentation

                <textarea
                  className="min-h-24 border border-[#343840] bg-[#101114] p-2.5 text-[11px] text-white outline-none focus:border-[#087cff]"
                  value={
                    organizationForm.description
                  }
                  onChange={
                    (event) =>
                      setOrganizationForm(
                        (current) => ({
                          ...current,
                          description:
                            event.target.value,
                        }),
                      )
                  }
                />
              </label>

            </div>


            <div className="border-t border-[#303238] pt-4">

              <div className="mb-3 flex items-center gap-2">

                <MapPin
                  size={14}
                  className="text-[#3d92ff]"
                />

                <h4 className="text-[10px] font-semibold">
                  Localisation administrative
                </h4>

              </div>

              <GeographySelector
                value={
                  organizationForm
                }
                onChange={(
                  value:
                    GeographyValue,
                ) =>
                  setOrganizationForm(
                    (current) => ({
                      ...current,
                      ...value,
                    }),
                  )
                }
              />

            </div>


            <div className="border-t border-[#303238] pt-4">

              <div className="mb-3 flex items-center gap-2">

                <Dumbbell
                  size={14}
                  className="text-[#3d92ff]"
                />

                <h4 className="text-[10px] font-semibold">
                  Disciplines de l’organisation
                </h4>

              </div>

              <DisciplineSelect
                mode="multiple"
                valueMode="id"
                values={
                  organizationForm.disciplineIds
                }
                onValuesChange={
                  (
                    disciplineIds,
                  ) =>
                    setOrganizationForm(
                      (current) => ({
                        ...current,
                        disciplineIds,
                      }),
                    )
                }
                emptyLabel="Sélectionner les disciplines"
                aria-label="Choisir les disciplines de l’organisation"
              />

            </div>


            <div className="flex justify-end border-t border-[#303238] pt-4">

              <button
                type="button"
                disabled={saving}
                onClick={
                  saveOrganization
                }
                className={
                  organizerPrimaryButtonClass
                }
              >

                {saving ? (
                  <LoaderCircle
                    size={13}
                    className="animate-spin"
                  />
                ) : (
                  <Save
                    size={13}
                  />
                )}

                {organization
                  ? "Enregistrer l’organisation"
                  : "Créer mon organisation"}

              </button>

            </div>

          </div>

        </div>


        <aside className="grid content-start gap-3">

          <section className={`${panelClass} p-4`}>

            <div className="flex items-center justify-between gap-3">

              <div>

                <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-[#3d92ff]">
                  État de configuration
                </p>

                <p className="mt-1 text-[10px] text-zinc-500">
                  {completedSetup}/{setupItems.length} éléments terminés
                </p>

              </div>

              <strong className="text-[22px] font-black text-white">
                {Math.round(
                  (
                    completedSetup /
                    setupItems.length
                  ) *
                    100,
                )}
                %
              </strong>

            </div>


            <div className="mt-3 border-t border-[#303238]">

              {setupItems.map(
                (item) => (
                  <SetupRow
                    key={item.label}
                    done={item.done}
                    label={item.label}
                    detail={item.detail}
                  />
                ),
              )}

            </div>

          </section>


          <section className={`${panelClass} p-4`}>

            <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-zinc-600">
              Localisation
            </p>

            <strong className="mt-2 block text-[11px] text-zinc-200">
              {regionName}
            </strong>

            <p className="mt-1 text-[10px] text-zinc-500">
              {cityName}
            </p>

          </section>

        </aside>

      </section>


      <section className="grid gap-3 lg:grid-cols-2">

        <article className={`${panelClass} p-5`}>

          <Globe2
            size={19}
            className="text-[#3d92ff]"
          />

          <p className="mt-4 text-[8px] font-bold uppercase tracking-[0.12em] text-zinc-600">
            Présence dans Indesy
          </p>

          <h3 className="mt-1 text-[15px] font-semibold text-white">
            {organizationForm.name ||
              "Organisation non renseignée"}
          </h3>


          <div className="mt-4 grid gap-3 text-[10px]">

            <div className="flex justify-between gap-4 border-b border-[#292c31] pb-2">
              <span className="text-zinc-600">
                Type
              </span>
              <strong className="text-zinc-300">
                Organisateur
              </strong>
            </div>

            <div className="flex justify-between gap-4 border-b border-[#292c31] pb-2">
              <span className="text-zinc-600">
                Statut
              </span>
              <strong className="text-zinc-300">
                {statusLabel}
              </strong>
            </div>

            <div className="flex justify-between gap-4 border-b border-[#292c31] pb-2">
              <span className="text-zinc-600">
                Localisation
              </span>
              <strong className="text-right text-zinc-300">
                {cityName} · {regionName}
              </strong>
            </div>

            <div className="grid gap-2">

              <span className="text-zinc-600">
                Disciplines
              </span>

              <p className="leading-5 text-zinc-300">
                {selectedDisciplineNames.length
                  ? selectedDisciplineNames.join(
                      " · ",
                    )
                  : "Aucune discipline associée"}
              </p>

            </div>

          </div>

        </article>


        <article className={`${panelClass} p-5`}>

          <UsersRound
            size={19}
            className="text-[#3d92ff]"
          />

          <p className="mt-4 text-[8px] font-bold uppercase tracking-[0.12em] text-zinc-600">
            Équipe & gouvernance
          </p>

          <h3 className="mt-1 text-[15px] font-semibold text-white">
            {memberCount} membre{memberCount > 1 ? "s" : ""}
          </h3>

          <p className="mt-2 max-w-xl text-[10px] leading-5 text-zinc-500">
            Les accès ERP et responsabilités sont rattachés à
            l’organisation, indépendamment des profils personnels.
          </p>


          <div className="mt-4 border border-[#303238] bg-[#101114] p-3">

            <p className="text-[8px] uppercase tracking-[0.1em] text-zinc-600">
              Propriétaire
            </p>

            <strong className="mt-1 block text-[11px] text-zinc-200">
              {organization?.ownerId ===
              profile.id
                ? `${profile.fullName} · Vous`
                : "Propriétaire enregistré"}
            </strong>

          </div>


          <button
            type="button"
            onClick={
              () =>
                onTabChange(
                  "Utilisateurs & droits",
                )
            }
            className={`${organizerButtonClass} mt-4`}
          >
            Gérer les utilisateurs

            <ExternalLink
              size={12}
            />
          </button>

        </article>

      </section>


      <section className={`${panelClass} p-5`}>

        <div className="flex items-start gap-3">

          <Settings2
            size={19}
            className="mt-0.5 text-[#3d92ff]"
          />

          <div>

            <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-zinc-600">
              Centre de configuration
            </p>

            <h3 className="mt-1 text-[14px] font-semibold text-white">
              Continuer la configuration de l’organisation
            </h3>

            <p className="mt-1 text-[10px] text-zinc-500">
              Accédez directement aux autres paramètres métier de votre structure.
            </p>

          </div>

        </div>


        <div className="mt-4 grid gap-3 md:grid-cols-3">

          <ConfigurationShortcut
            icon={
              <ShieldCheck
                size={16}
              />
            }
            title="Vérification organisation"
            description="Consulter le dossier et les justificatifs de la structure."
            onClick={
              () =>
                onTabChange(
                  "Vérification organisation",
                )
            }
          />

          <ConfigurationShortcut
            icon={
              <UsersRound
                size={16}
              />
            }
            title="Utilisateurs & droits"
            description="Consulter les membres et responsabilités de l’organisation."
            onClick={
              () =>
                onTabChange(
                  "Utilisateurs & droits",
                )
            }
          />

          <ConfigurationShortcut
            icon={
              <Plug
                size={16}
              />
            }
            title="Intégrations"
            description="Préparer les connexions externes propres à l’organisation."
            onClick={
              () =>
                onTabChange(
                  "Intégrations",
                )
            }
          />

        </div>

      </section>

    </div>
  );
}