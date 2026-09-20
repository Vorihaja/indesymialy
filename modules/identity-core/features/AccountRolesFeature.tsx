"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import {
  AccountNavigation,
  FormMessage,
  IdentityFrame,
  RoleSpecificFields,
  identityPanelClass,
  identityPrimaryActionClass,
  identitySecondaryActionClass,
} from "../components/IdentityViews";

import {
  useIdentity,
} from "../hooks/useIdentity";

import {
  getAccountIdentityRoleLabel,
  isPublicIdentityRole,
} from "../role-policy";

function parseRoleValues(
  value: string | undefined,
): Record<string, string> {
  if (!value) {
    return {};
  }

  try {
    const parsed: unknown =
      JSON.parse(value);

    if (
      !parsed ||
      typeof parsed !== "object" ||
      Array.isArray(parsed)
    ) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(parsed)
        .filter(
          (
            entry,
          ): entry is [string, string] =>
            typeof entry[1] === "string",
        ),
    );
  }
  catch {
    return {};
  }
}

export function AccountRolesFeature() {
  const api = useIdentity();

  const [
    values,
    setValues,
  ] =
    useState<Record<string, string>>({});

  const [
    message,
    setMessage,
  ] =
    useState<string | null>(null);

  const draft = api.state?.draft ?? null;

  const storedValues =
    useMemo(
      () =>
        parseRoleValues(
          draft?.roleData.experience,
        ),
      [draft?.roleData.experience],
    );

  useEffect(() => {
    setValues(storedValues);
  }, [storedValues]);

  if (
    api.loading ||
    !api.state ||
    !draft
  ) {
    return (
      <IdentityFrame
        eyebrow="Compte"
        title="Rôles et accès"
        description="Chargement des rôles et des accès du compte."
      >
        <div className={`${identityPanelClass} min-h-40`} />
      </IdentityFrame>
    );
  }

  const profile =
    draft.profile;

  const primaryRole =
    profile.primaryRole;

  const secondaryRoles =
    profile.secondaryRoles;

  const primaryRoleLabel =
    primaryRole
      ? getAccountIdentityRoleLabel(
          primaryRole,
        )
      : null;

  const secondaryRoleLabels =
    Array.from(
      new Set(
        secondaryRoles.map(
          getAccountIdentityRoleLabel,
        ),
      ),
    ).filter(
      (label) =>
        label !== primaryRoleLabel,
    );

  async function saveRoleDetails() {
    const currentDraft =
      api.state?.draft;

    if (!currentDraft) {
      return;
    }

    setMessage(null);

    await api.saveDraft({
      ...currentDraft,

      roleData: {
        ...currentDraft.roleData,

        experience:
          JSON.stringify(values),
      },

      updatedAt:
        new Date().toISOString(),
    });

    setMessage(
      "Les informations liées au rôle ont été enregistrées.",
    );
  }

  return (
    <IdentityFrame
      eyebrow="Compte"
      title="Rôles et accès"
      description="Gérez vos rôles, leurs validations et les informations professionnelles liées à votre rôle principal."
    >
      <AccountNavigation active="roles" />

      <div className="grid gap-4">
        <section className={`${identityPanelClass} space-y-4`}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
              Rôle principal
            </p>

            <h2 className="mt-2 text-lg font-black">
              {primaryRoleLabel ??
                "Aucun rôle principal"}
            </h2>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
              Autres rôles actifs
            </p>

            <p className="mt-2 text-sm text-zinc-300">
              {secondaryRoleLabels.length
                ? secondaryRoleLabels.join(", ")
                : "Aucun"}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/role-requests/new"
              className={identityPrimaryActionClass}
            >
              Ajouter ou demander un rôle
            </Link>

            <Link
              href="/role-requests"
              className={identitySecondaryActionClass}
            >
              Suivre mes demandes
            </Link>
          </div>
        </section>

        {primaryRole &&
        (primaryRole === "official" ||
          isPublicIdentityRole(
            primaryRole,
          )) ? (
          <section className={`${identityPanelClass} space-y-4`}>
            <div>
              <h2 className="font-black">
                Informations liées au rôle
              </h2>

              <p className="mt-2 text-sm text-zinc-500">
                Ces informations reprennent le contrat interne déjà utilisé par Indesy Mialy. Elles ne créent aucun onboarding séparé.
              </p>
            </div>

            <RoleSpecificFields
              role={primaryRole}
              values={values}
              onChange={
                (
                  key,
                  value,
                ) =>
                  setValues(
                    (current) => ({
                      ...current,
                      [key]: value,
                    }),
                  )
              }
            />

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() =>
                  void saveRoleDetails().catch(
                    () => undefined,
                  )
                }
                className={identityPrimaryActionClass}
              >
                Enregistrer
              </button>
            </div>
          </section>
        ) : null}

        <FormMessage
          error={api.error}
          success={message ?? undefined}
        />
      </div>
    </IdentityFrame>
  );
}
