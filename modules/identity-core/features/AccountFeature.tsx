"use client";
import { DisciplineSelect } from "@/modules/disciplines";
import { useAuthContext } from "@/providers/auth";

import {
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import {
  useRouter,
} from "next/navigation";

import {
  Field,
  FormMessage,
  IdentityFrame,
  IdentitySummary,
  OnboardingProgress,
  identityControlClass,
  identityPanelClass,
  identityPrimaryActionClass,
  identitySecondaryActionClass,
} from "../components/IdentityViews";

import {
  ProfileAvatarEditor,
} from "../components/ProfileAvatarEditor";

import {
  AccountProfileContext,
  AccountProfileMetrics,
} from "../components/AccountProfileInsights";

import {
  useIdentity,
} from "../hooks/useIdentity";

import {
  IDENTITY_ROLE_LABELS,
  isPublicIdentityRole,
} from "../role-policy";

import type {
  AccountSection,
  IdentityOrganization,
} from "../types";

import {
  GeographySelector,
  type GeographyValue,
} from "@/modules/geography";


const ORGANIZATION_TYPE_LABELS:
  Record<
    IdentityOrganization["type"],
    string
  > = {
    personal: "Personnel",
    club: "Club",
    organizer: "Organisateur",
    sponsor: "Sponsor",
    seller: "Vendeur",
    federation: "Fédération",
    league: "Ligue",
  };


const ORGANIZATION_STATUS_LABELS:
  Record<
    IdentityOrganization["status"],
    string
  > = {
    draft: "Brouillon",
    pending: "En attente",
    active: "Active",
    suspended: "Suspendue",
  };


type ProfileForm = {
  fullName: string;
  username: string;
  email: string;
  phone: string;

  regionId: string;
  districtId: string;
  cityId: string;
  communeId: string;

  disciplineIds: string[];
};


const EMPTY_PROFILE_FORM:
  ProfileForm = {

  fullName: "",
  username: "",
  email: "",
  phone: "",

  regionId: "",
  districtId: "",
  cityId: "",
  communeId: "",

  disciplineIds: [],
};


function readableError(
  reason: unknown,
) {

  const message =
    reason instanceof Error
      ? reason.message
      : "Impossible d’enregistrer le profil.";


  const normalized =
    message.toLocaleLowerCase(
      "fr-FR",
    );


  if (
    normalized.includes(
      "duplicate",
    ) ||
    normalized.includes(
      "unique",
    )
  ) {

    return "Ce nom utilisateur est déjà utilisé.";
  }


  if (
    normalized.includes(
      "validation",
    ) ||
    normalized.includes(
      "obligatoire",
    )
  ) {

    return "Vérifiez les informations obligatoires.";
  }


  return message;
}


export function AccountFeature({
  section = "overview",
  onboardingMode = false,
}: {
  section?: AccountSection;

  onboardingMode?: boolean;
}) {

  const router =
    useRouter();


  const api =
    useIdentity();


  const {
    refreshUser,
  } =
    useAuthContext();


  const [
    message,
    setMessage,
  ] =
    useState<string | null>(
      null,
    );


  const [
    password,
    setPassword,
  ] =
    useState("");


  const [
    confirmation,
    setConfirmation,
  ] =
    useState("");


  const [
    profileForm,
    setProfileForm,
  ] =
    useState<ProfileForm>(
      EMPTY_PROFILE_FORM,
    );


  const [
    profileSaving,
    setProfileSaving,
  ] =
    useState(false);


  const [
    profileError,
    setProfileError,
  ] =
    useState<string | null>(
      null,
    );


  useEffect(
    () => {

      const profile =
        api.state?.draft.profile;


      if (
        !profile
      ) {

        return;
      }


      setProfileForm(
        {
          fullName:
            profile.fullName,

          username:
            profile.username,

          email:
            profile.email,

          phone:
            profile.phone ??
            "",

          regionId:
            profile.regionId,

          districtId:
            "",

          cityId:
            profile.cityId,

          communeId:
            "",

          disciplineIds:
            [
              ...profile.disciplineIds,
            ],
        },
      );

    },
    [
      api.state,
    ],
  );


  if (
    api.loading
  ) {

    return (
      <IdentityFrame
        eyebrow="Compte privé"
        title="Gestion du compte"
        description="Chargement du compte…"
      >
        <p className={identityPanelClass}>
          Chargement du compte…
        </p>
      </IdentityFrame>
    );
  }


  if (
    !api.state
  ) {

    return (
      <IdentityFrame
        eyebrow="Compte privé"
        title="Gestion du compte"
        description="Coordonnées, sécurité, organisations et confidentialité."
      >
        <FormMessage
          error={api.error}
        />
      </IdentityFrame>
    );
  }


  const state =
    api.state;


  const profile =
    state.draft.profile;


  const primaryRoleLabel =
    profile.primaryRole &&
    isPublicIdentityRole(
      profile.primaryRole,
    )
      ? IDENTITY_ROLE_LABELS[
          profile.primaryRole
        ]
      : "Aucun";


  const secondaryRoleLabels =
    profile.secondaryRoles
      .filter(
        isPublicIdentityRole,
      )
      .map(
        (role) =>
          IDENTITY_ROLE_LABELS[
            role
          ],
      );


  const requiredProfileValues = [
    profileForm.fullName.trim(),
    profileForm.username.trim(),
    profileForm.email.trim(),
    profileForm.phone.trim(),
    profileForm.regionId,
    profileForm.cityId,
    profileForm.disciplineIds.length
      ? "disciplines"
      : "",
  ];


  const profileCompletion =
    Math.round(
      (
        requiredProfileValues
          .filter(Boolean)
          .length /
        requiredProfileValues.length
      ) *
        100,
    );

  async function refreshProfileEverywhere() {

    await api.refresh();


    try {

      await refreshUser();

    } catch {

      console.error(
        "[Identity] Impossible de synchroniser immédiatement la session après la mise à jour du profil.",
      );
    }
  }


  async function saveProfile() {

    setProfileError(
      null,
    );

    setMessage(
      null,
    );


    const fullName =
      profileForm.fullName.trim();


    const username =
      profileForm.username
        .trim()
        .replace(
          /^@+/,
          "",
        );


    const email =
      profileForm.email.trim();


    const phone =
      profileForm.phone.trim();


    if (
      !fullName ||
      !username ||
      !email ||
      !profileForm.regionId ||
      !profileForm.cityId
    ) {

      setProfileError(
        "Nom, nom utilisateur, email, région et ville sont obligatoires.",
      );

      return;
    }


    if (
      onboardingMode &&
      (
        !phone ||
        profileForm.disciplineIds
          .length ===
          0
      )
    ) {

      setProfileError(
        "Pour continuer l’onboarding, renseignez aussi votre téléphone et au moins une discipline.",
      );

      return;
    }


    setProfileSaving(
      true,
    );


    try {

      await api.useCase
        .updateProfile(
          {
            fullName,
            username,
            email,

            phone:
              phone ||
              undefined,

            regionId:
              profileForm.regionId,

            cityId:
              profileForm.cityId,

            disciplineIds:
              profileForm.disciplineIds,
          },
        );


      await refreshProfileEverywhere();


      setMessage(
        onboardingMode
          ? "Profil enregistré. Vous pouvez poursuivre votre configuration."
          : "Profil Indesy enregistré.",
      );


      if (
        onboardingMode
      ) {

        router.push(
          "/onboarding/disciplines",
        );
      }

    } catch (
      reason
    ) {

      setProfileError(
        readableError(
          reason,
        ),
      );

    } finally {

      setProfileSaving(
        false,
      );
    }
  }


  return (
    <IdentityFrame
      eyebrow={
        onboardingMode
          ? "Onboarding · Profil Indesy"
          : "Compte privé"
      }
      title={
        section === "profile"
          ? "Mon profil Indesy"
          : "Gestion du compte"
      }
      description={
        section === "profile"
          ? "Une identité personnelle unique utilisée dans tout l’écosystème Indesy."
          : "Coordonnées, sécurité, organisations et confidentialité."
      }
    >

{section ===
        "profile" &&
      onboardingMode ? (

        <div className="grid gap-3">

          <div className="border border-[#3d92ff]/25 bg-[#3d92ff]/[0.055] p-4">

            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#6aafff]">
              Configuration initiale
            </p>


            <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
              Cette étape utilise maintenant votre véritable profil Indesy.
              Il n’existe plus de second profil propre à l’onboarding.
            </p>

          </div>


          <OnboardingProgress
            active="profile"
          />

        </div>

      ) : null}


      {section ===
        "overview" && (

        <div className="grid gap-4">

          <IdentitySummary
            state={state}
          />


          <AccountProfileContext
            state={state}
            draft={profileForm}
          />

        </div>

      )}


      {section ===
        "profile" &&
      !onboardingMode ? (

        <AccountProfileMetrics
          state={state}
          completion={profileCompletion}
          draft={profileForm}
        />

      ) : null}


      {section ===
        "profile" && (

        <section className="min-w-0">

          <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_220px] xl:items-start">

            <div className="flex min-w-0 flex-col gap-4">

              <div className="min-w-0">

                <ProfileAvatarEditor
                  photoUrl={
                    profile.photoPrepared ??
                    null
                  }
                  displayName={
                    profile.fullName
                  }
                  onChanged={refreshProfileEverywhere}
                />

              </div>


              <section
                className={`${identityPanelClass} min-w-0`}
              >

                <header className="mb-5 border-b border-[#303238] pb-4">

                  <p className="text-[10px] font-bold uppercase tracking-[0.11em] text-[#6aafff]">
                    Identité
                  </p>


                  <p className="mt-1 max-w-3xl text-xs leading-5 text-zinc-500">
                    Ces informations appartiennent au profil personnel Indesy commun à Korana, ERP, Marketplace et aux surfaces publiques autorisées.
                  </p>

                </header>


                <div className="grid min-w-0 gap-4 md:grid-cols-2">

                  <div className="min-w-0">

                    <Field
                      label="Nom complet"
                      value={
                        profileForm.fullName
                      }
                      onChange={
                        (value) =>
                          setProfileForm(
                            (current) => ({
                              ...current,

                              fullName:
                                value,
                            }),
                          )
                      }
                    />

                  </div>


                  <div className="min-w-0">

                    <Field
                      label="Nom utilisateur"
                      value={
                        profileForm.username
                      }
                      onChange={
                        (value) =>
                          setProfileForm(
                            (current) => ({
                              ...current,

                              username:
                                value,
                            }),
                          )
                      }
                    />

                  </div>


                  <div className="min-w-0">

                    <Field
                      label="Email de contact"
                      type="email"
                      value={
                        profileForm.email
                      }
                      onChange={
                        (value) =>
                          setProfileForm(
                            (current) => ({
                              ...current,

                              email:
                                value,
                            }),
                          )
                      }
                    />

                  </div>


                  <div className="min-w-0">

                    <Field
                      label="Téléphone"
                      value={
                        profileForm.phone
                      }
                      onChange={
                        (value) =>
                          setProfileForm(
                            (current) => ({
                              ...current,

                              phone:
                                value,
                            }),
                          )
                      }
                    />

                  </div>

                </div>

              </section>


              <section
                className={`${identityPanelClass} min-w-0`}
              >

                <header className="mb-5 border-b border-[#303238] pb-4">

                  <p className="text-[10px] font-bold uppercase tracking-[0.11em] text-[#6aafff]">
                    Localisation
                  </p>


                  <p className="mt-1 text-xs leading-5 text-zinc-500">
                    Région, district et commune ou ville associés à votre profil personnel.
                  </p>

                </header>


                <div className="min-w-0">

                  <GeographySelector
                    required
                    value={
                      {
                        regionId:
                          profileForm.regionId,

                        districtId:
                          profileForm.districtId,

                        cityId:
                          profileForm.cityId,

                        communeId:
                          profileForm.communeId,
                      }
                    }
                    onChange={
                      (
                        value:
                          GeographyValue,
                      ) => {

                        setProfileForm(
                          (current) => ({
                            ...current,
                            ...value,
                          }),
                        );
                      }
                    }
                  />

                </div>

              </section>


              <section
                className={`${identityPanelClass} min-w-0`}
              >

                <header className="mb-5 border-b border-[#303238] pb-4">

                  <p className="text-[10px] font-bold uppercase tracking-[0.11em] text-[#6aafff]">
                    Disciplines
                  </p>


                  <p className="mt-1 max-w-3xl text-xs leading-5 text-zinc-500">
                    Sélectionnez les disciplines qui font partie de votre identité et de vos centres d’intérêt dans Indesy.
                  </p>

                </header>


                <div className="grid gap-2">
                  <DisciplineSelect
                    mode="multiple"
                    valueMode="id"
                    values={profileForm.disciplineIds}
                    onValuesChange={(disciplineIds) =>
                      setProfileForm((current) => ({
                        ...current,
                        disciplineIds,
                      }))
                    }
                    emptyLabel="Sélectionner mes disciplines"
                    className="min-h-11 w-full"
                    aria-label="Choisir mes disciplines"
                  />

                  <p className="text-[10px] leading-5 text-zinc-600">
                    Vous pouvez sélectionner plusieurs disciplines.
                  </p>
                </div>

              </section>


              {profileError ? (

                <p
                  role="alert"
                  className="border border-red-500/30 bg-red-500/[0.055] p-3 text-sm text-red-300"
                >
                  {profileError}
                </p>

              ) : null}


              <footer className="flex flex-col gap-4 border-t border-[#303238] pt-4 sm:flex-row sm:items-center sm:justify-between">

                <p className="max-w-2xl text-[11px] leading-5 text-zinc-500">
                  Les informations purement sportives ou professionnelles restent gérées par les modules métier correspondants.
                </p>


                <button
                  type="button"
                  disabled={
                    profileSaving
                  }
                  onClick={() =>
                    void saveProfile()
                  }
                  className={`${identityPrimaryActionClass} shrink-0`}
                >
                  {profileSaving
                    ? "Enregistrement…"
                    : onboardingMode
                      ? "Enregistrer et continuer"
                      : "Enregistrer mon profil"}
                </button>

              </footer>

            </div>


            <aside className="grid min-w-0 content-start gap-3">

              <section className={identityPanelClass}>

                <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-zinc-600">
                  Complétion
                </p>


                <strong className="mt-2 block text-3xl font-black tracking-[-0.04em] text-white">
                  {profileCompletion} %
                </strong>


                <div className="mt-3 h-1.5 overflow-hidden bg-[#24272d]">

                  <div
                    className="h-full bg-[#3d92ff] transition-[width]"
                    style={
                      {
                        width:
                          `${profileCompletion}%`,
                      }
                    }
                  />

                </div>


                <p className="mt-3 text-[11px] leading-5 text-zinc-500">
                  Nom, username, coordonnées, localisation et disciplines composent la base de votre profil universel.
                </p>

              </section>


              <section className={identityPanelClass}>

                <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-zinc-600">
                  Source unique
                </p>


                <p className="mt-2 text-[11px] leading-5 text-zinc-400">
                  Vous n’avez pas à recréer ces informations dans chacun de vos ERP.
                </p>

              </section>


              {onboardingMode ? (

                <section className="border border-[#3d92ff]/25 bg-[#3d92ff]/[0.055] p-4">

                  <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#6aafff]">
                    Onboarding
                  </p>


                  <p className="mt-2 text-[11px] leading-5 text-zinc-400">
                    Après l’enregistrement, vous poursuivrez directement avec la configuration de votre espace.
                  </p>

                </section>

              ) : null}

            </aside>

          </div>

        </section>

      )}





      {section ===
        "security" && (

        <section
          className={`${identityPanelClass} max-w-xl space-y-4`}
        >

          <Field
            label="Nouveau mot de passe"
            type="password"
            value={password}
            onChange={
              setPassword
            }
          />


          <Field
            label="Confirmation"
            type="password"
            value={confirmation}
            onChange={
              setConfirmation
            }
          />


          <button
            type="button"
            onClick={
              () => {

                void api.useCase
                  .resetPassword(
                    password,
                    confirmation,
                  )
                  .then(
                    () =>
                      setMessage(
                        "Mot de passe modifié.",
                      ),
                  )
                  .catch(
                    (error) =>
                      setMessage(
                        error instanceof Error
                          ? error.message
                          : "Erreur",
                      ),
                  );
              }
            }
            className={
              identityPrimaryActionClass
            }
          >
            Modifier
          </button>

        </section>

      )}


      {section ===
        "roles" && (

        <section
          className={`${identityPanelClass} space-y-3`}
        >

          <p>
            Rôle principal :{" "}
            <strong>
              {primaryRoleLabel}
            </strong>
          </p>


          <p>
            Autres rôles actifs :{" "}
            <strong>
              {secondaryRoleLabels.length
                ? secondaryRoleLabels.join(
                    ", ",
                  )
                : "Aucun"}
            </strong>
          </p>


          <div className="flex flex-wrap gap-2">

            <Link
              href="/role-requests/new"
              className={
                identityPrimaryActionClass
              }
            >
              Ajouter ou demander un rôle
            </Link>


            <Link
              href="/role-requests"
              className={
                identitySecondaryActionClass
              }
            >
              Suivre mes demandes
            </Link>

          </div>

        </section>

      )}


      {section ===
        "organizations" && (

        <section className="grid gap-3 md:grid-cols-2">

          {state.organizations.map(
            (item) => (

              <article
                key={item.id}
                className={
                  identityPanelClass
                }
              >

                <h2 className="font-black">
                  {item.name}
                </h2>


                <p className="text-sm text-zinc-500">
                  {ORGANIZATION_TYPE_LABELS[
                    item.type
                  ]}{" "}
                  ·{" "}
                  {ORGANIZATION_STATUS_LABELS[
                    item.status
                  ]}
                </p>


                <button
                  type="button"
                  disabled={
                    state.activeOrganizationId ===
                    item.id
                  }
                  onClick={
                    () => {

                      if (
                        state.activeOrganizationId ===
                        item.id
                      ) {

                        return;
                      }


                      void api.useCase
                        .activateOrganization(
                          item.id,
                        )
                        .then(
                          () =>
                            api.refresh(),
                        );
                    }
                  }
                  className={`${identityPrimaryActionClass} mt-3 disabled:cursor-default disabled:opacity-60`}
                >
                  {state.activeOrganizationId ===
                  item.id
                    ? "Active"
                    : "Activer"}
                </button>

              </article>

            ),
          )}

        </section>

      )}


      {[
        "preferences",
        "notifications",
        "privacy",
      ].includes(
        section,
      ) && (

        <section
          className={`${identityPanelClass} space-y-4`}
        >

          <label className="block text-[12px] font-semibold text-zinc-300">

            Visibilité

            <select
              value={
                state.preferences
                  .profileVisibility
              }
              onChange={
                (event) => {

                  const profileVisibility =
                    event.target
                      .value as typeof state.preferences.profileVisibility;


                  void api.useCase
                    .savePreferences(
                      {
                        ...state.preferences,
                        profileVisibility,
                      },
                    )
                    .then(
                      () =>
                        api.refresh(),
                    );
                }
              }
              className={
                identityControlClass
              }
            >
              <option value="public">
                Public
              </option>

              <option value="members">
                Membres
              </option>

              <option value="private">
                Privé
              </option>
            </select>

          </label>


          <label className="block">

            <input
              type="checkbox"
              className="accent-[#3d92ff]"
              checked={
                state.preferences
                  .emailPrepared
              }
              onChange={
                (event) => {

                  void api.useCase
                    .savePreferences(
                      {
                        ...state.preferences,

                        emailPrepared:
                          event.target
                            .checked,
                      },
                    )
                    .then(
                      () =>
                        api.refresh(),
                    );
                }
              }
            />


            <span className="ml-2">
              Emails activés
            </span>

          </label>


          <p className="text-sm text-zinc-500">
            L’export des données et la suppression du compte restent soumis à une confirmation séparée.
          </p>

        </section>

      )}


      {section ===
        "sessions" && (

        <section className="space-y-3">

          {state.sessions.length >
          0 ? (

            state.sessions.map(
              (item) => (

                <article
                  key={item.id}
                  className={
                    identityPanelClass
                  }
                >

                  <strong>
                    {item.device}
                  </strong>


                  <p className="text-sm text-zinc-500">
                    {item.location} ·{" "}
                    {new Date(
                      item.lastActiveAt,
                    ).toLocaleString(
                      "fr-FR",
                    )}
                  </p>


                  <span className="text-xs">
                    {item.current
                      ? "Session actuelle"
                      : "Autre session"}
                  </span>

                </article>

              ),
            )

          ) : (

            <article
              className={
                identityPanelClass
              }
            >

              <strong>
                Gestion des sessions
              </strong>


              <p className="mt-2 text-sm leading-6 text-zinc-500">
                Aucune session multi-appareil fictive n’est affichée.
                L’inventaire sécurisé des sessions sera raccordé au
                système d’authentification avant d’être exposé ici.
              </p>

            </article>

          )}

        </section>

      )}


      <FormMessage
        success={message}
      />

    </IdentityFrame>
  );
}