"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import {
  ArrowRight,
  Check,
  UserRound,
} from "lucide-react";

import {
  createIdentityUseCase,
} from "@/modules/identity-core/factories/identity.factory";


const SESSION_KEY =
  "indesy-profile-prompt-later";


const PROFILE_SETUP_HREF =
  "/account/profile?onboarding=1";


export function ProfileCompletionPrompt() {

  const useCase =
    useMemo(
      () =>
        createIdentityUseCase(),
      [],
    );


  const [
    open,
    setOpen,
  ] =
    useState(false);


  const [
    primaryRole,
    setPrimaryRole,
  ] =
    useState<string>(
      "",
    );


  useEffect(
    () => {

      let active =
        true;


      if (
        sessionStorage.getItem(
          SESSION_KEY,
        )
      ) {

        return;
      }


      void useCase
        .execute()
        .then(
          (state) => {

            if (
              !active
            ) {

              return;
            }


            const profile =
              state.draft.profile;


            setPrimaryRole(
              profile.primaryRole ??
              "",
            );


            const organizerContextMissing =
              profile.primaryRole ===
                "organizer" &&
              !state.organizations.some(
                (item) =>
                  item.type ===
                  "organizer",
              );


            if (
              !profile.onboardingComplete ||
              !profile.phone ||
              profile.disciplineIds
                .length ===
                0 ||
              organizerContextMissing
            ) {

              setOpen(
                true,
              );
            }
          },
        )
        .catch(
          () =>
            undefined,
        );


      return () => {

        active =
          false;
      };

    },
    [
      useCase,
    ],
  );


  if (
    !open
  ) {

    return null;
  }


  const later =
    () => {

      sessionStorage.setItem(
        SESSION_KEY,
        "1",
      );


      setOpen(
        false,
      );
    };


  const items = [
    "Identité et coordonnées",
    "Disciplines",
    "Visibilité et préférences",

    ...(
      primaryRole ===
      "organizer"
        ? [
            "Créer votre organisation pour enregistrer et piloter vos événements",
          ]
        : []
    ),
  ];


  return (
    <div
      className="fixed inset-0 z-[200] grid place-items-center bg-black/75 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-prompt-title"
    >

      <section className="w-full max-w-[520px] border border-white/15 bg-[#0b0e14] text-white shadow-[0_28px_90px_rgba(0,0,0,.5)]">

        <div className="grid grid-cols-[5px_1fr]">

          <div className="bg-[#ff1638]" />


          <div className="p-6 sm:p-7">

            <div className="flex items-start justify-between gap-5">

              <span className="grid h-11 w-11 place-items-center border border-[#087cff]/50 bg-[#087cff]/10 text-[#3d92ff]">

                <UserRound
                  size={20}
                />

              </span>


              <span className="text-[9px] font-bold uppercase tracking-[.16em] text-zinc-600">
                Bienvenue
              </span>

            </div>


            <h2
              id="profile-prompt-title"
              className="mt-5 text-[21px] font-semibold tracking-[-.02em]"
            >
              Profitez pleinement de votre espace
            </h2>


            <p className="mt-2 text-[13px] leading-6 text-zinc-400">
              Complétez votre profil Indesy unique pour être correctement identifié dans tous vos espaces.
            </p>


            <ul className="mt-5 grid gap-2 text-[12px] text-zinc-300">

              {items.map(
                (label) => (

                  <li
                    key={label}
                    className="flex items-center gap-2"
                  >

                    <Check
                      size={13}
                      className="text-[#3d92ff]"
                    />

                    {label}

                  </li>

                ),
              )}

            </ul>


            <div className="mt-6 flex flex-wrap justify-end gap-2">

              <button
                type="button"
                onClick={later}
                className="h-10 border border-white/15 px-4 text-[11px] font-semibold text-zinc-400 hover:text-white"
              >
                Plus tard
              </button>


              <Link
                href={
                  PROFILE_SETUP_HREF
                }
                onClick={() =>
                  setOpen(
                    false,
                  )
                }
                className="flex h-10 items-center gap-2 border border-[#087cff] bg-[#087cff] px-4 text-[11px] font-semibold text-white hover:bg-[#2165c8]"
              >
                Configurer maintenant

                <ArrowRight
                  size={13}
                />
              </Link>

            </div>

          </div>

        </div>

      </section>

    </div>
  );
}