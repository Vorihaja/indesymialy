"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Building2,
  Check,
  LoaderCircle,
  Plus,
  Store,
} from "lucide-react";

import IndesyDualOrbitLoader from "@/components/loading/IndesyDualOrbitLoader";

import {
  AccountNavigation,
  FormMessage,
  IdentityFrame,
  identityControlClass,
  identityPanelClass,
  identityPrimaryActionClass,
  identitySecondaryActionClass,
} from "../components/IdentityViews";

import {
  useIdentity,
} from "../hooks/useIdentity";

import type {
  IdentityOrganization,
} from "../types";

type OrganizationType =
  IdentityOrganization["type"];

type OrganizationForm = {
  name: string;
  type: OrganizationType;
  description: string;
  email: string;
  phone: string;
  website: string;
  regionId: string;
  cityId: string;
  disciplineId: string;
};

const EMPTY_FORM:
  OrganizationForm = {
    name: "",
    type: "seller",
    description: "",
    email: "",
    phone: "",
    website: "",
    regionId: "",
    cityId: "",
    disciplineId: "",
  };

const TYPE_OPTIONS:
  Array<{
    value: OrganizationType;
    label: string;
  }> = [
    {
      value: "seller",
      label: "Vendeur",
    },
    {
      value: "club",
      label: "Club",
    },
    {
      value: "organizer",
      label: "Organisateur",
    },
    {
      value: "sponsor",
      label: "Sponsor",
    },
    {
      value: "federation",
      label: "Fédération",
    },
    {
      value: "league",
      label: "Ligue",
    },
    {
      value: "personal",
      label: "Personnel",
    },
  ];

const TYPE_LABELS:
  Record<
    OrganizationType,
    string
  > = {
    personal:
      "Personnel",

    club:
      "Club",

    organizer:
      "Organisateur",

    sponsor:
      "Sponsor",

    seller:
      "Vendeur",

    federation:
      "Fédération",

    league:
      "Ligue",
  };

const STATUS_LABELS:
  Record<
    IdentityOrganization["status"],
    string
  > = {
    draft:
      "Brouillon",

    pending:
      "En attente",

    active:
      "Active",

    suspended:
      "Suspendue",
  };

export function AccountOrganizationsFeature() {
  const api =
    useIdentity();

  const [
    form,
    setForm,
  ] =
    useState<OrganizationForm>(
      EMPTY_FORM,
    );

  const [
    creating,
    setCreating,
  ] =
    useState(false);

  const [
    activatingId,
    setActivatingId,
  ] =
    useState<string | null>(
      null,
    );

  const [
    message,
    setMessage,
  ] =
    useState<string | null>(
      null,
    );

  const [
    localError,
    setLocalError,
  ] =
    useState<string | null>(
      null,
    );

  useEffect(() => {
    const profile =
      api.state?.draft.profile;

    if (!profile) {
      return;
    }

    const roles =
      new Set([
        profile.primaryRole,
        ...profile.secondaryRoles,
      ]);

    if (
      roles.has("seller")
    ) {
      setForm(
        (current) => ({
          ...current,
          type:
            "seller",
        }),
      );
    }
  }, [
    api.state,
  ]);

  const availableCities =
    useMemo(
      () => {
        if (!api.state) {
          return [];
        }

        if (!form.regionId) {
          return api.state.cities;
        }

        return api.state.cities.filter(
          (city) =>
            city.regionId ===
            form.regionId,
        );
      },
      [
        api.state,
        form.regionId,
      ],
    );

  if (api.loading) {
    return (
      <IdentityFrame
        eyebrow="Compte"
        title="Organisations"
        description="Chargement de vos organisations."
      >
        <AccountNavigation
          active="organizations"
        />

        <section className={identityPanelClass}>
          <IndesyDualOrbitLoader
            variant="data"
            label="Chargement de vos organisations"
          />
        </section>
      </IdentityFrame>
    );
  }

  if (!api.state) {
    return (
      <IdentityFrame
        eyebrow="Compte"
        title="Organisations"
        description="Gérez les structures liées à votre compte."
      >
        <AccountNavigation
          active="organizations"
        />

        <FormMessage
          error={
            api.error ??
            "Impossible de charger les organisations."
          }
        />
      </IdentityFrame>
    );
  }

  const state =
    api.state;

  const activeOrganization =
    state.organizations.find(
      (organization) =>
        organization.id ===
        state.activeOrganizationId,
    );

  function updateForm<K extends keyof OrganizationForm>(
    key: K,
    value: OrganizationForm[K],
  ) {
    setForm(
      (current) => ({
        ...current,
        [key]:
          value,
      }),
    );

    setLocalError(null);
    setMessage(null);
  }

  async function createOrganization() {
    setLocalError(null);
    setMessage(null);

    if (
      !form.name.trim()
    ) {
      setLocalError(
        "Le nom de l’organisation est obligatoire.",
      );

      return;
    }

    setCreating(true);

    try {
      const organization =
        await api.useCase
          .createOrganization({
            name:
              form.name.trim(),

            type:
              form.type,

            description:
              form.description.trim(),

            email:
              form.email.trim(),

            phone:
              form.phone.trim(),

            website:
              form.website.trim(),

            regionId:
              form.regionId ||
              undefined,

            cityId:
              form.cityId ||
              undefined,

            disciplines:
              form.disciplineId
                ? [
                    form.disciplineId,
                  ]
                : [],

            invitationsPrepared:
              [],

            internalRolesPrepared:
              [],
          });

      await api.useCase
        .activateOrganization(
          organization.id,
        );

      await api.refresh();

      setForm(
        EMPTY_FORM,
      );

      setMessage(
        form.type === "seller"
          ? "Organisation vendeuse créée et activée. Vous pouvez maintenant l’utiliser dans l’ERP Vendeur."
          : "Organisation créée et activée.",
      );
    }
    catch (reason) {
      setLocalError(
        reason instanceof Error
          ? reason.message
          : "La création de l’organisation a échoué.",
      );
    }
    finally {
      setCreating(false);
    }
  }

  async function activateOrganization(
    organizationId: string,
  ) {
    if (
      organizationId ===
      state.activeOrganizationId
    ) {
      return;
    }

    setActivatingId(
      organizationId,
    );

    setLocalError(null);
    setMessage(null);

    try {
      await api.useCase
        .activateOrganization(
          organizationId,
        );

      await api.refresh();

      setMessage(
        "Organisation active mise à jour.",
      );
    }
    catch (reason) {
      setLocalError(
        reason instanceof Error
          ? reason.message
          : "Impossible d’activer cette organisation.",
      );
    }
    finally {
      setActivatingId(
        null,
      );
    }
  }

  return (
    <IdentityFrame
      eyebrow="Compte"
      title="Organisations"
      description="Créez et sélectionnez les structures au nom desquelles vous utilisez les différents ERP Indesy Mialy."
    >
      <AccountNavigation
        active="organizations"
      />

      <div className="grid gap-4">
        <section
          className={`${identityPanelClass} flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between`}
        >
          <div className="flex items-start gap-3">
            <div className="grid size-10 shrink-0 place-items-center border border-[#303238] bg-[#111214]">
              <Building2
                size={18}
                className="text-[#3d92ff]"
                aria-hidden="true"
              />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
                Organisation active
              </p>

              <h2 className="mt-1 text-lg font-black">
                {activeOrganization
                  ?.name ??
                  "Aucune organisation active"}
              </h2>

              {activeOrganization ? (
                <p className="mt-1 text-sm text-zinc-500">
                  {
                    TYPE_LABELS[
                      activeOrganization.type
                    ]
                  }
                  {" · "}
                  {
                    STATUS_LABELS[
                      activeOrganization.status
                    ]
                  }
                </p>
              ) : (
                <p className="mt-1 text-sm text-amber-400">
                  Créez ou activez une organisation pour l’utiliser dans un ERP professionnel.
                </p>
              )}
            </div>
          </div>

          {activeOrganization?.type ===
          "seller" ? (
            <div className="flex items-center gap-2 border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-300">
              <Store
                size={15}
                aria-hidden="true"
              />

              Organisation vendeuse active
            </div>
          ) : null}
        </section>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.72fr)]">
          <section className={`${identityPanelClass} space-y-4`}>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
                Mes organisations
              </p>

              <h2 className="mt-1 text-lg font-black">
                Structures liées à ce compte
              </h2>
            </div>

            {state.organizations.length ? (
              <div className="grid gap-3">
                {state.organizations.map(
                  (organization) => {
                    const active =
                      organization.id ===
                      state.activeOrganizationId;

                    const activating =
                      activatingId ===
                      organization.id;

                    return (
                      <article
                        key={organization.id}
                        className="border border-[#303238] bg-[#111214] p-4"
                      >
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-black">
                                {
                                  organization.name
                                }
                              </h3>

                              {active ? (
                                <span className="inline-flex items-center gap-1 border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-emerald-300">
                                  <Check
                                    size={11}
                                    aria-hidden="true"
                                  />
                                  Active
                                </span>
                              ) : null}

                              {organization.type ===
                              "seller" ? (
                                <span className="border border-[#3d92ff]/30 bg-[#3d92ff]/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#75b5ff]">
                                  Vendeur
                                </span>
                              ) : null}
                            </div>

                            <p className="mt-1 text-sm text-zinc-500">
                              {
                                TYPE_LABELS[
                                  organization.type
                                ]
                              }
                              {" · "}
                              {
                                STATUS_LABELS[
                                  organization.status
                                ]
                              }
                            </p>

                            {organization.description ? (
                              <p className="mt-2 text-sm text-zinc-400">
                                {
                                  organization.description
                                }
                              </p>
                            ) : null}
                          </div>

                          <button
                            type="button"
                            disabled={
                              active ||
                              activating
                            }
                            onClick={
                              () =>
                                void activateOrganization(
                                  organization.id,
                                )
                            }
                            className={
                              active
                                ? `${identitySecondaryActionClass} cursor-default opacity-60`
                                : identitySecondaryActionClass
                            }
                          >
                            {activating ? (
                              <>
                                <LoaderCircle
                                  size={14}
                                  className="animate-spin"
                                  aria-hidden="true"
                                />
                                Activation…
                              </>
                            ) : active ? (
                              "Organisation active"
                            ) : (
                              "Activer"
                            )}
                          </button>
                        </div>
                      </article>
                    );
                  },
                )}
              </div>
            ) : (
              <div className="border border-dashed border-[#303238] bg-[#111214] p-8 text-center">
                <Building2
                  size={28}
                  className="mx-auto text-zinc-600"
                  aria-hidden="true"
                />

                <h3 className="mt-3 font-black">
                  Aucune organisation
                </h3>

                <p className="mx-auto mt-2 max-w-lg text-sm text-zinc-500">
                  Créez votre première organisation avec le formulaire ci-contre.
                </p>
              </div>
            )}
          </section>

          <section className={`${identityPanelClass} space-y-4`}>
            <div className="flex items-start gap-3">
              <div className="grid size-9 shrink-0 place-items-center border border-[#303238] bg-[#111214]">
                <Plus
                  size={16}
                  className="text-[#3d92ff]"
                  aria-hidden="true"
                />
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
                  Nouvelle organisation
                </p>

                <h2 className="mt-1 font-black">
                  Créer une structure
                </h2>
              </div>
            </div>

            <div className="border border-[#3d92ff]/20 bg-[#3d92ff]/5 p-3 text-xs leading-5 text-zinc-400">
              Pour utiliser l’ERP Vendeur et publier des produits, choisissez le type{" "}
              <strong className="text-white">
                Vendeur
              </strong>.
            </div>

            <label className="block text-xs font-semibold text-zinc-300">
              Nom de l’organisation *

              <input
                value={form.name}
                disabled={creating}
                onChange={
                  (event) =>
                    updateForm(
                      "name",
                      event.target.value,
                    )
                }
                placeholder="Ex. Rakoto Shop"
                className={identityControlClass}
              />
            </label>

            <label className="block text-xs font-semibold text-zinc-300">
              Type *

              <select
                value={form.type}
                disabled={creating}
                onChange={
                  (event) =>
                    updateForm(
                      "type",
                      event.target
                        .value as
                        OrganizationType,
                    )
                }
                className={identityControlClass}
              >
                {TYPE_OPTIONS.map(
                  (option) => (
                    <option
                      key={option.value}
                      value={option.value}
                    >
                      {option.label}
                    </option>
                  ),
                )}
              </select>
            </label>

            <label className="block text-xs font-semibold text-zinc-300">
              Description

              <textarea
                value={form.description}
                disabled={creating}
                onChange={
                  (event) =>
                    updateForm(
                      "description",
                      event.target.value,
                    )
                }
                placeholder="Présentez brièvement votre activité."
                className="mt-1.5 min-h-24 w-full resize-y border border-[#303238] bg-[#0f1012] px-3 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-[#3d92ff]"
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-xs font-semibold text-zinc-300">
                Email

                <input
                  type="email"
                  value={form.email}
                  disabled={creating}
                  onChange={
                    (event) =>
                      updateForm(
                        "email",
                        event.target.value,
                      )
                  }
                  className={identityControlClass}
                />
              </label>

              <label className="block text-xs font-semibold text-zinc-300">
                Téléphone

                <input
                  value={form.phone}
                  disabled={creating}
                  onChange={
                    (event) =>
                      updateForm(
                        "phone",
                        event.target.value,
                      )
                  }
                  className={identityControlClass}
                />
              </label>
            </div>

            <label className="block text-xs font-semibold text-zinc-300">
              Site web

              <input
                value={form.website}
                disabled={creating}
                onChange={
                  (event) =>
                    updateForm(
                      "website",
                      event.target.value,
                    )
                }
                placeholder="https://"
                className={identityControlClass}
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-xs font-semibold text-zinc-300">
                Région

                <select
                  value={form.regionId}
                  disabled={creating}
                  onChange={
                    (event) => {
                      updateForm(
                        "regionId",
                        event.target.value,
                      );

                      updateForm(
                        "cityId",
                        "",
                      );
                    }
                  }
                  className={identityControlClass}
                >
                  <option value="">
                    Sélectionner
                  </option>

                  {state.regions.map(
                    (region) => (
                      <option
                        key={region.id}
                        value={region.id}
                      >
                        {region.name}
                      </option>
                    ),
                  )}
                </select>
              </label>

              <label className="block text-xs font-semibold text-zinc-300">
                Ville

                <select
                  value={form.cityId}
                  disabled={creating}
                  onChange={
                    (event) =>
                      updateForm(
                        "cityId",
                        event.target.value,
                      )
                  }
                  className={identityControlClass}
                >
                  <option value="">
                    Sélectionner
                  </option>

                  {availableCities.map(
                    (city) => (
                      <option
                        key={city.id}
                        value={city.id}
                      >
                        {city.name}
                      </option>
                    ),
                  )}
                </select>
              </label>
            </div>

            <label className="block text-xs font-semibold text-zinc-300">
              Discipline principale

              <select
                value={form.disciplineId}
                disabled={creating}
                onChange={
                  (event) =>
                    updateForm(
                      "disciplineId",
                      event.target.value,
                    )
                }
                className={identityControlClass}
              >
                <option value="">
                  Aucune
                </option>

                {state.disciplines.map(
                  (discipline) => (
                    <option
                      key={discipline.id}
                      value={discipline.id}
                    >
                      {discipline.name}
                    </option>
                  ),
                )}
              </select>
            </label>

            <div className="flex justify-end border-t border-[#303238] pt-4">
              <button
                type="button"
                disabled={
                  creating ||
                  !form.name.trim()
                }
                onClick={
                  () =>
                    void createOrganization()
                }
                className={identityPrimaryActionClass}
              >
                {creating ? (
                  <>
                    <LoaderCircle
                      size={14}
                      className="animate-spin"
                      aria-hidden="true"
                    />

                    Création…
                  </>
                ) : (
                  <>
                    <Plus
                      size={14}
                      aria-hidden="true"
                    />

                    Créer et activer
                  </>
                )}
              </button>
            </div>
          </section>
        </div>

        <FormMessage
          error={
            localError ??
            api.error
          }
          success={
            message ??
            undefined
          }
        />
      </div>
    </IdentityFrame>
  );
}