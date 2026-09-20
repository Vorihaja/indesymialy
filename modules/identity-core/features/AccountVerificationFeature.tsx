"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import IndesyDualOrbitLoader from "@/components/loading/IndesyDualOrbitLoader";

import {
  useProfileVerification,
  type VerificationDetails,
  type VerificationRequest,
} from "@/modules/profile-verification";

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

const REQUIRED_DOCUMENTS = [
  {
    type: "identity",
    label: "Pièce d’identité",
  },
  {
    type: "fiscal_card",
    label: "Carte fiscale",
  },
  {
    type: "nif",
    label: "Justificatif NIF",
  },
] as const;

const STATUS_LABELS:
  Record<
    VerificationRequest["status"],
    string
  > = {
    draft:
      "Brouillon",

    submitted:
      "Soumise",

    in_review:
      "En cours d’examen",

    verified:
      "Vérifiée",

    rejected:
      "Refusée",

    needs_changes:
      "Modifications demandées",
  };

const EMPTY_DETAILS:
  VerificationDetails = {
    subjectType:
      "profile",

    organizationId:
      null,

    legalName:
      "",

    identityNumber:
      "",

    nif:
      "",

    statNumber:
      "",

    registeredAddress:
      "",
  };

export function AccountVerificationFeature() {
  const identity =
    useIdentity();

  const verification =
    useProfileVerification(
      "profile",
      null,
    );

  const [
    form,
    setForm,
  ] =
    useState<VerificationDetails>(
      EMPTY_DETAILS,
    );

  const [
    message,
    setMessage,
  ] =
    useState<string | null>(
      null,
    );

  useEffect(() => {
    if (
      verification.data
    ) {
      setForm({
        subjectType:
          "profile",

        organizationId:
          null,

        legalName:
          verification.data
            .legalName,

        identityNumber:
          verification.data
            .identityNumber ??
          "",

        nif:
          verification.data
            .nif,

        statNumber:
          "",

        registeredAddress:
          verification.data
            .registeredAddress,
      });

      return;
    }

    const name =
      identity.state
        ?.draft
        .profile
        .fullName ??
      "";

    setForm(
      (current) => ({
        ...current,

        subjectType:
          "profile",

        organizationId:
          null,

        legalName:
          current.legalName ||
          name,

        statNumber:
          "",
      }),
    );
  }, [
    identity.state,
    verification.data,
  ]);

  const uploaded =
    useMemo(
      () =>
        new Set(
          (
            verification.data
              ?.documents ??
            []
          )
            .filter(
              (document) =>
                document.status !==
                "rejected",
            )
            .map(
              (document) =>
                document.type,
            ),
        ),
      [
        verification.data,
      ],
    );

  const complete =
    REQUIRED_DOCUMENTS.every(
      (document) =>
        uploaded.has(
          document.type,
        ),
    );

  const status =
    verification.data
      ?.status ??
    "draft";

  const locked =
    status === "submitted" ||
    status === "in_review" ||
    status === "verified";

  function update(
    key:
      | "legalName"
      | "identityNumber"
      | "nif"
      | "registeredAddress",
    value: string,
  ) {
    setForm(
      (current) => ({
        ...current,

        [key]:
          value,

        subjectType:
          "profile",

        organizationId:
          null,

        statNumber:
          "",
      }),
    );
  }

  async function save() {
    setMessage(
      null,
    );

    await verification.save({
      ...form,

      subjectType:
        "profile",

      organizationId:
        null,

      statNumber:
        "",
    });

    setMessage(
      "Dossier personnel enregistré.",
    );
  }

  async function upload(
    type: string,
    file: File,
  ) {
    setMessage(
      null,
    );

    let requestId =
      verification.data
        ?.id;

    if (!requestId) {
      requestId =
        await verification.save({
          ...form,

          subjectType:
            "profile",

          organizationId:
            null,

          statNumber:
            "",
        });
    }

    await verification.upload(
      requestId,
      type,
      file,
    );

    setMessage(
      "Document téléversé.",
    );
  }

  async function submit() {
    const requestId =
      verification.data
        ?.id;

    if (
      !requestId ||
      !complete
    ) {
      return;
    }

    setMessage(
      null,
    );

    await verification.submit(
      requestId,
    );

    setMessage(
      "Dossier soumis pour vérification.",
    );
  }

  if (
    identity.loading ||
    verification.loading
  ) {
    return (
      <IdentityFrame
        eyebrow="Compte"
        title="Vérification"
        description="Chargement de votre dossier personnel."
      >
        <AccountNavigation
          active="verification"
        />

        <section
          className={identityPanelClass}
        >
          <IndesyDualOrbitLoader
            variant="data"
            label="Chargement de votre dossier de vérification"
          />
        </section>
      </IdentityFrame>
    );
  }

  return (
    <IdentityFrame
      eyebrow="Compte"
      title="Vérification"
      description="Gérez votre dossier personnel de vérification. Les dossiers des organisations restent séparés dans leurs ERP."
    >
      <AccountNavigation
        active="verification"
      />

      <div className="grid gap-4">
        <section
          className={`${identityPanelClass} flex flex-wrap items-center justify-between gap-4`}
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
              Statut
            </p>

            <p className="mt-2 text-lg font-black">
              {verification.data
                ? STATUS_LABELS[
                    verification.data
                      .status
                  ]
                : "Non créé"}
            </p>
          </div>

          <p className="text-xs text-zinc-500">
            Profil personnel · aucune organisation
          </p>
        </section>

        <section
          className={`${identityPanelClass} space-y-4`}
        >
          <div>
            <h2 className="font-black">
              Informations de vérification
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Ces informations appartiennent uniquement à votre dossier personnel.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-semibold text-zinc-300">
              Nom légal *

              <input
                value={form.legalName}
                disabled={locked}
                onChange={
                  (event) =>
                    update(
                      "legalName",
                      event.target.value,
                    )
                }
                className={identityControlClass}
              />
            </label>

            <label className="text-xs font-semibold text-zinc-300">
              CIN / passeport

              <input
                value={form.identityNumber}
                disabled={locked}
                onChange={
                  (event) =>
                    update(
                      "identityNumber",
                      event.target.value,
                    )
                }
                className={identityControlClass}
              />
            </label>

            <label className="text-xs font-semibold text-zinc-300">
              NIF *

              <input
                value={form.nif}
                disabled={locked}
                onChange={
                  (event) =>
                    update(
                      "nif",
                      event.target.value,
                    )
                }
                className={identityControlClass}
              />
            </label>

            <label className="text-xs font-semibold text-zinc-300 sm:col-span-2">
              Adresse officielle *

              <input
                value={form.registeredAddress}
                disabled={locked}
                onChange={
                  (event) =>
                    update(
                      "registeredAddress",
                      event.target.value,
                    )
                }
                className={identityControlClass}
              />
            </label>
          </div>

          {!locked ? (
            <div className="flex justify-end">
              <button
                type="button"
                disabled={
                  verification.mutating
                }
                onClick={
                  () =>
                    void save().catch(
                      () => undefined,
                    )
                }
                className={
                  identityPrimaryActionClass
                }
              >
                Enregistrer le dossier
              </button>
            </div>
          ) : null}
        </section>

        <section
          className={`${identityPanelClass} space-y-4`}
        >
          <div>
            <h2 className="font-black">
              Documents requis
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              PDF, JPG, PNG ou WebP · 10 Mo maximum.
            </p>
          </div>

          <div className="grid gap-3">
            {REQUIRED_DOCUMENTS.map(
              (document) => {
                const current =
                  verification.data
                    ?.documents
                    .find(
                      (item) =>
                        item.type ===
                        document.type,
                    );

                return (
                  <div
                    key={
                      document.type
                    }
                    className="flex flex-col gap-3 border border-[#303238] bg-[#111214] p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <strong className="text-sm">
                        {
                          document.label
                        }
                      </strong>

                      <p className="mt-1 text-xs text-zinc-500">
                        {current
                          ? `${current.fileName} · ${current.status}`
                          : "Document requis"}
                      </p>
                    </div>

                    {!locked ? (
                      <label
                        className={`${identitySecondaryActionClass} cursor-pointer`}
                      >
                        {current
                          ? "Remplacer"
                          : "Ajouter"}

                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,.webp"
                          disabled={
                            verification.mutating
                          }
                          className="sr-only"
                          onChange={
                            (event) => {
                              const file =
                                event
                                  .currentTarget
                                  .files?.[0];

                              if (!file) {
                                return;
                              }

                              event.currentTarget
                                .value =
                                "";

                              void upload(
                                document.type,
                                file,
                              ).catch(
                                () =>
                                  undefined,
                              );
                            }
                          }
                        />
                      </label>
                    ) : null}
                  </div>
                );
              },
            )}
          </div>

          {!locked ? (
            <div className="flex justify-end">
              <button
                type="button"
                disabled={
                  !verification.data ||
                  !complete ||
                  verification.mutating
                }
                onClick={
                  () =>
                    void submit().catch(
                      () => undefined,
                    )
                }
                className={
                  identityPrimaryActionClass
                }
              >
                Soumettre pour vérification
              </button>
            </div>
          ) : null}
        </section>

        {verification.data
          ?.reviewNote ? (
          <section
            className={identityPanelClass}
          >
            <h2 className="font-black">
              Retour de vérification
            </h2>

            <p className="mt-2 text-sm text-zinc-400">
              {
                verification.data
                  .reviewNote
              }
            </p>
          </section>
        ) : null}

        <FormMessage
          error={
            verification.error ??
            identity.error
          }
          success={
            message
          }
        />
      </div>
    </IdentityFrame>
  );
}