"use client";

import {
  useId,
} from "react";

import {
  Camera,
  LoaderCircle,
  Trash2,
  UserRound,
} from "lucide-react";

import {
  useProfileAvatar,
} from "../hooks/useProfileAvatar";

import {
  identitySecondaryActionClass,
} from "./IdentityViews";


function initials(
  value: string,
) {

  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(
      0,
      2,
    )
    .map(
      (part) =>
        part
          .charAt(0)
          .toUpperCase(),
    )
    .join("");
}


export function ProfileAvatarEditor({
  photoUrl,
  displayName,
  onChanged,
}: {
  photoUrl:
    string | null | undefined;

  displayName:
    string;

  onChanged:
    () => Promise<unknown>;
}) {

  const inputId =
    useId();


  const avatar =
    useProfileAvatar();


  async function upload(
    file: File,
  ) {

    avatar.clearError();


    try {

      await avatar.upload(
        file,
      );


      await onChanged();

    } catch {

      // L'erreur est déjà exposée par le hook.
    }
  }


  async function remove() {

    avatar.clearError();


    try {

      await avatar.remove();


      await onChanged();

    } catch {

      // L'erreur est déjà exposée par le hook.
    }
  }


  const fallback =
    initials(
      displayName,
    );


  return (
    <div className="sm:col-span-2">

      <div className="border border-[#303238] bg-[#0f1012] p-4">

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">

          <div className="relative grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-full border border-[#3d92ff]/35 bg-[#090b10] shadow-[0_0_28px_rgba(61,146,255,0.08)]">

            {photoUrl ? (

              <img
                src={photoUrl}
                alt={`Avatar de ${displayName || "votre profil"}`}
                className="h-full w-full object-cover"
              />

            ) : fallback ? (

              <span className="text-2xl font-black tracking-[-0.04em] text-[#dce4ee]">
                {fallback}
              </span>

            ) : (

              <UserRound
                size={32}
                className="text-[#778392]"
              />

            )}


            {avatar.pending ? (

              <div className="absolute inset-0 grid place-items-center bg-black/65">

                <LoaderCircle
                  size={23}
                  className="animate-spin text-[#6aafff]"
                />

              </div>

            ) : null}

          </div>


          <div className="min-w-0 flex-1">

            <h3 className="text-sm font-black text-[#f3f6fa]">
              Avatar Indesy
            </h3>


            <p className="mt-1 max-w-xl text-[11px] leading-5 text-[#94a0b0]">
              Cette photo appartient à votre profil Indesy unique.
              Elle peut être utilisée dans Korana, l’ERP,
              Marketplace et les autres espaces de l’écosystème.
            </p>


            <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-[#778392]">
              JPG, PNG ou WebP · 5 Mo maximum
            </p>


            <div className="mt-3 flex flex-wrap gap-2">

              <input
                id={inputId}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={
                  avatar.pending !==
                  null
                }
                className="hidden"
                onChange={
                  (event) => {

                    const file =
                      event.target.files?.[0];


                    event.target.value =
                      "";


                    if (
                      file
                    ) {

                      void upload(
                        file,
                      );
                    }
                  }
                }
              />


              <label
                htmlFor={inputId}
                className={`${identitySecondaryActionClass} cursor-pointer ${
                  avatar.pending
                    ? "pointer-events-none opacity-50"
                    : ""
                }`}
              >
                <Camera
                  size={15}
                  className="mr-2"
                />

                {photoUrl
                  ? "Remplacer la photo"
                  : "Ajouter une photo"}
              </label>


              {photoUrl ? (

                <button
                  type="button"
                  disabled={
                    avatar.pending !==
                    null
                  }
                  onClick={() =>
                    void remove()
                  }
                  className="inline-flex min-h-10 items-center justify-center border border-red-500/30 bg-red-500/[0.055] px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500/[0.1] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Trash2
                    size={14}
                    className="mr-2"
                  />

                  Supprimer
                </button>

              ) : null}

            </div>


            {avatar.error ? (

              <p className="mt-3 text-[11px] leading-5 text-red-300">
                {avatar.error}
              </p>

            ) : null}

          </div>

        </div>

      </div>

    </div>
  );
}