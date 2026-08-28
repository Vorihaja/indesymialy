"use client";

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
  RoleSpecificFields,
  identityControlClass,
  identityPanelClass,
  identityPrimaryActionClass,
  identitySecondaryActionClass,
} from "../components/IdentityViews";

import {
  useIdentity,
} from "../hooks/useIdentity";

import {
  getIdentityDashboard,
} from "../routing";

import {
  getIdentityRoleLabel,
  isPublicIdentityRole,
} from "../role-policy";

import type {
  OnboardingStep,
} from "../types";


const ORGANIZATION_TYPE_OPTIONS = [
  {
    value: "personal",
    label: "Personnel",
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
    value: "seller",
    label: "Vendeur",
  },
  {
    value: "federation",
    label: "Fédération",
  },
  {
    value: "league",
    label: "Ligue",
  },
] as const;


type OnboardingOrganizationType =
  (typeof ORGANIZATION_TYPE_OPTIONS)[number]["value"];


const PREVIOUS_STEP_LINKS:
  Partial<
    Record<
      OnboardingStep,
      {
        href: string;
        label: string;
      }
    >
  > = {

    disciplines: {
      href: "/account/profile?onboarding=1",
      label: "Retour au profil",
    },

    role: {
      href: "/onboarding/disciplines",
      label: "Retour aux disciplines",
    },

    organization: {
      href: "/onboarding/role",
      label: "Retour aux rôles",
    },

    documents: {
      href: "/onboarding/organization",
      label: "Retour à l’organisation",
    },

    review: {
      href: "/onboarding/documents",
      label: "Retour aux documents",
    },
  };


export function OnboardingFeature({
  step,
}: {
  step: OnboardingStep;
}) {

  const router =
    useRouter();


  const api =
    useIdentity();


  const [
    message,
    setMessage,
  ] =
    useState<string | null>(
      null,
    );


  const [
    roleValues,
    setRoleValues,
  ] =
    useState<
      Record<string, string>
    >(
      {},
    );


  /*
   * Sécurité de compatibilité :
   * aucune UI profile ne subsiste dans OnboardingFeature.
   */
  useEffect(
    () => {

      if (
        step ===
        "profile"
      ) {

        router.replace(
          "/account/profile?onboarding=1",
        );
      }

    },
    [
      router,
      step,
    ],
  );


  if (
    step ===
    "profile"
  ) {

    return (
      <IdentityFrame
        eyebrow="Onboarding"
        title="Profil Indesy"
        description="Redirection vers le profil personnel unique…"
      >
        <p className={identityPanelClass}>
          Ouverture de votre profil Indesy…
        </p>
      </IdentityFrame>
    );
  }


  if (
    api.loading
  ) {

    return (
      <IdentityFrame
        eyebrow="Onboarding"
        title="Configurez votre espace"
        description="Chargement de l’onboarding…"
      >
        <p className={identityPanelClass}>
          Chargement de l’onboarding…
        </p>
      </IdentityFrame>
    );
  }


  if (
    !api.state
  ) {

    return (
      <IdentityFrame
        eyebrow="Onboarding"
        title="Configurez votre espace"
        description="Le parcours peut être repris tant qu’il n’est pas validé."
      >
        <FormMessage
          error={
            api.error ??
            "ONBOARDING_INCOMPLETE"
          }
        />
      </IdentityFrame>
    );
  }


  const state =
    api.state;


  const draft =
    state.draft;


  const secondaryRoleLabels =
    draft.profile.secondaryRoles
      .filter(
        isPublicIdentityRole,
      )
      .map(
        getIdentityRoleLabel,
      );


  const previousStep =
    PREVIOUS_STEP_LINKS[
      step
    ];


  const save =
    async (
      nextPath?: string,
    ) => {

      await api.saveDraft(
        {
          ...draft,

          updatedAt:
            new Date()
              .toISOString(),
        },
      );


      setMessage(
        "Progression sauvegardée.",
      );


      if (
        nextPath
      ) {

        router.push(
          nextPath,
        );
      }
    };


  if (
    step ===
    "success"
  ) {

    return (
      <IdentityFrame
        eyebrow="Onboarding"
        title="Votre espace est prêt"
        description="Votre profil Indesy et votre configuration ont été enregistrés."
      >

        <Link
          href={
            getIdentityDashboard(
              draft.profile
                .primaryRole,
            )
          }
          className={
            identitySecondaryActionClass
          }
        >
          Accéder à mon workspace
        </Link>

      </IdentityFrame>
    );
  }


  return (
    <IdentityFrame
      eyebrow="Onboarding"
      title="Configurez votre espace"
      description="Votre profil personnel est désormais centralisé dans Mon profil Indesy."
      backHref={
        previousStep?.href
      }
      backLabel={
        previousStep?.label
      }
    >

      <OnboardingProgress
        active={step}
      />


      {step ===
        "disciplines" && (

        <section
          className={`${identityPanelClass} space-y-4`}
        >

          <div>

            <h2 className="font-black">
              Disciplines de votre profil
            </h2>


            <p className="mt-1 text-sm leading-6 text-zinc-500">
              Les disciplines sont déjà gérées par votre profil Indesy.
              Vous pouvez les modifier depuis Mon profil puis poursuivre ici.
            </p>

          </div>


          <div className="grid gap-3 sm:grid-cols-2">

            {state.disciplines.map(
              (item) => {

                const selected =
                  draft.profile
                    .disciplineIds
                    .includes(
                      item.id,
                    );


                return (
                  <article
                    key={item.id}
                    className={
                      selected
                        ? "border border-[#3d92ff]/60 bg-[#3d92ff]/10 p-3 text-sm text-white"
                        : "border border-[#303238] bg-[#0f1012] p-3 text-sm text-zinc-500"
                    }
                  >
                    <strong>
                      {item.name}
                    </strong>

                    <span className="ml-2 text-xs">
                      {selected
                        ? "Sélectionnée"
                        : "Non sélectionnée"}
                    </span>
                  </article>
                );
              },
            )}

          </div>


          <Link
            href="/account/profile?onboarding=1"
            className={
              identitySecondaryActionClass
            }
          >
            Modifier mes disciplines
          </Link>

        </section>

      )}


      {step ===
        "role" && (

        <section
          className={`${identityPanelClass} space-y-4`}
        >

          <div>

            <h2 className="font-black">
              Rôles réellement actifs
            </h2>


            <p className="mt-2 text-sm">
              Rôle principal :{" "}
              <strong>
                {getIdentityRoleLabel(
                  draft.profile
                    .primaryRole,
                )}
              </strong>
            </p>


            <p className="text-sm text-neutral-500">
              Autres rôles :{" "}
              {secondaryRoleLabels.length
                ? secondaryRoleLabels.join(
                    ", ",
                  )
                : "Aucun"}
            </p>

          </div>


          <p className="text-sm text-neutral-500">
            Les rôles se gèrent depuis le circuit réel d’attribution.
            Fédération et Ligue restent inactifs tant qu’une demande
            n’a pas été approuvée.
          </p>


          <Link
            href="/role-requests/new"
            className={
              identitySecondaryActionClass
            }
          >
            Ajouter ou demander un rôle
          </Link>


          {draft.profile
            .primaryRole &&
          isPublicIdentityRole(
            draft.profile
              .primaryRole,
          ) ? (

            <RoleSpecificFields
              role={
                draft.profile
                  .primaryRole
              }
              values={
                roleValues
              }
              onChange={
                (
                  key,
                  value,
                ) => {

                  setRoleValues(
                    (current) => ({
                      ...current,

                      [key]:
                        value,
                    }),
                  );


                  void api.saveDraft(
                    {
                      ...draft,

                      roleData: {
                        ...draft.roleData,

                        experience:
                          JSON.stringify(
                            {
                              ...roleValues,

                              [key]:
                                value,
                            },
                          ),
                      },

                      updatedAt:
                        new Date()
                          .toISOString(),
                    },
                  );
                }
              }
            />

          ) : null}

        </section>

      )}


      {step ===
        "organization" ? (

        <OrganizationStep />

      ) : null}


      {step ===
        "documents" && (

        <section
          className={`${identityPanelClass} space-y-4`}
        >

          <p>
            Ajoutez les justificatifs requis par votre rôle.
            Aucun fichier n’est téléversé dans cette mission.
          </p>


          <input
            type="file"
            multiple
            className="block text-sm"
          />


          <Field
            label="Expérience"
            value={
              draft.profile
                .experience ??
              ""
            }
            onChange={
              (value) => {

                void api.saveDraft(
                  {
                    ...draft,

                    profile: {
                      ...draft.profile,

                      experience:
                        value,
                    },

                    updatedAt:
                      new Date()
                        .toISOString(),
                  },
                );
              }
            }
          />


          <Field
            label="Disponibilité préparée"
            value={
              draft.profile
                .availabilityPrepared ??
              ""
            }
            onChange={
              (value) => {

                void api.saveDraft(
                  {
                    ...draft,

                    profile: {
                      ...draft.profile,

                      availabilityPrepared:
                        value,
                    },

                    updatedAt:
                      new Date()
                        .toISOString(),
                  },
                );
              }
            }
          />

        </section>

      )}


      {step ===
        "review" && (

        <>

          <IdentitySummary
            state={state}
          />


          <button
            type="button"
            onClick={
              () => {

                void api.useCase
                  .complete()
                  .then(
                    () =>
                      router.push(
                        "/onboarding/success",
                      ),
                  );
              }
            }
            className={
              identityPrimaryActionClass
            }
          >
            Valider l’onboarding
          </button>

        </>

      )}


      <FormMessage
        success={message}
      />


      {[
        "disciplines",
        "role",
        "organization",
        "documents",
      ].includes(
        step,
      ) && (

        <button
          type="button"
          onClick={
            () => {

              const sequence = [
                "disciplines",
                "role",
                "organization",
                "documents",
              ] as const;


              const destinations = [
                "/onboarding/role",
                "/onboarding/organization",
                "/onboarding/documents",
                "/onboarding/review",
              ] as const;


              const index =
                sequence.indexOf(
                  step as
                    (typeof sequence)[number],
                );


              if (
                index >=
                0
              ) {

                void save(
                  destinations[
                    index
                  ],
                );
              }
            }
          }
          className={
            identityPrimaryActionClass
          }
        >
          Sauvegarder et continuer
        </button>

      )}

    </IdentityFrame>
  );
}


function OrganizationStep() {

  const api =
    useIdentity();


  const [
    name,
    setName,
  ] =
    useState("");


  const [
    type,
    setType,
  ] =
    useState<OnboardingOrganizationType>(
      "personal",
    );


  const [
    description,
    setDescription,
  ] =
    useState("");


  return (
    <section
      className={`${identityPanelClass} space-y-4`}
    >

      <h2 className="font-black">
        Organisation éventuelle
      </h2>


      <Field
        label="Nom"
        value={name}
        onChange={setName}
      />


      <label className="block text-sm">

        Type

        <select
          value={type}
          onChange={
            (event) =>
              setType(
                event.target
                  .value as OnboardingOrganizationType,
              )
          }
          className={
            identityControlClass
          }
        >

          {ORGANIZATION_TYPE_OPTIONS.map(
            (item) => (

              <option
                key={item.value}
                value={item.value}
              >
                {item.label}
              </option>

            ),
          )}

        </select>

      </label>


      <Field
        label="Description"
        value={description}
        onChange={
          setDescription
        }
      />


      <button
        type="button"
        onClick={
          () => {

            void api.useCase
              .createOrganization(
                {
                  name,
                  type,
                  description,
                  disciplines: [],
                  invitationsPrepared: [],
                  internalRolesPrepared: [],
                },
              )
              .then(
                () =>
                  api.refresh(),
              );
          }
        }
        className={
          identityPrimaryActionClass
        }
      >
        Créer l’organisation
      </button>


      <p className="text-xs text-neutral-500">
        Créer une organisation n’attribue aucun rôle.
        Fédération et Ligue nécessitent toujours une demande approuvée.
      </p>

    </section>
  );
}