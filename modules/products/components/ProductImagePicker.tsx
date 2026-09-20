"use client";

import {
  useState,
} from "react";

import {
  ArrowLeft,
  ArrowRight,
  ImagePlus,
  Images,
  Link2,
  MonitorUp,
  Star,
  Trash2,
} from "lucide-react";

import {
  useProductMedia,
} from "../media/useProductMedia";


type Source =
  | "device"
  | "url"
  | "library";


export function ProductImagePicker({
  images,
  onChange,
}: {
  images: string[];
  onChange:
    (images: string[]) =>
      void;
}) {
  const media =
    useProductMedia();

  const [
    source,
    setSource,
  ] =
    useState<Source>(
      "device",
    );

  const [
    url,
    setUrl,
  ] =
    useState("");

  const [
    localError,
    setLocalError,
  ] =
    useState<string | null>(
      null,
    );


  function addImages(
    next: string[],
  ) {
    const merged =
      Array.from(
        new Set([
          ...images,
          ...next,
        ]),
      ).slice(
        0,
        10,
      );

    onChange(
      merged,
    );
  }


  function move(
    index: number,
    direction:
      | -1
      | 1,
  ) {
    const target =
      index +
      direction;

    if (
      target < 0 ||
      target >=
        images.length
    ) {
      return;
    }

    const next =
      [...images];

    [
      next[index],
      next[target],
    ] =
      [
        next[target],
        next[index],
      ];

    onChange(
      next,
    );
  }


  function makePrimary(
    index: number,
  ) {
    if (
      index === 0
    ) {
      return;
    }

    const next =
      [...images];

    const [
      selected,
    ] =
      next.splice(
        index,
        1,
      );

    next.unshift(
      selected,
    );

    onChange(
      next,
    );
  }


  function remove(
    index: number,
  ) {
    onChange(
      images.filter(
        (_, itemIndex) =>
          itemIndex !==
          index,
      ),
    );
  }


  function addUrl() {
    setLocalError(
      null,
    );

    const trimmed =
      url.trim();

    if (!trimmed) {
      return;
    }

    try {
      const parsed =
        new URL(
          trimmed,
        );

      if (
        ![
          "http:",
          "https:",
        ].includes(
          parsed.protocol,
        )
      ) {
        throw new Error();
      }
    }
    catch {
      setLocalError(
        "Saisissez une URL http ou https valide.",
      );

      return;
    }

    addImages([
      trimmed,
    ]);

    setUrl("");
  }


  async function handleFiles(
    files:
      FileList | null,
  ) {
    if (!files?.length) {
      return;
    }

    setLocalError(
      null,
    );

    try {
      const assets =
        await media.upload(
          Array.from(
            files,
          ),
        );

      addImages(
        assets.map(
          (asset) =>
            asset.url,
        ),
      );
    }
    catch (cause) {
      setLocalError(
        cause instanceof Error
          ? cause.message
          : "Import impossible.",
      );
    }
  }


  async function selectSource(
    next: Source,
  ) {
    setSource(
      next,
    );

    setLocalError(
      null,
    );

    if (
      next ===
      "library"
    ) {
      try {
        await media.refresh();
      }
      catch {
        // Error displayed below.
      }
    }
  }


  return (
    <section className="overflow-hidden border border-[#303238] bg-[#101114]">
      <header className="border-b border-[#303238] px-4 py-3">
        <p className="text-[9px] font-bold uppercase tracking-[0.13em] text-[#3d92ff]">
          Images du produit
        </p>

        <p className="mt-1 text-[9px] text-zinc-600">
          Jusqu’à 10 images. La première image est utilisée comme image principale.
        </p>
      </header>


      <div className="grid grid-cols-3 gap-px border-b border-[#303238] bg-[#303238]">
        <button
          type="button"
          onClick={() =>
            void selectSource(
              "device",
            )
          }
          className={`flex h-10 items-center justify-center gap-2 text-[9px] font-semibold ${
            source ===
            "device"
              ? "bg-[#1a1d22] text-white"
              : "bg-[#111214] text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <MonitorUp
            size={13}
          />
          Appareil
        </button>


        <button
          type="button"
          onClick={() =>
            void selectSource(
              "url",
            )
          }
          className={`flex h-10 items-center justify-center gap-2 text-[9px] font-semibold ${
            source ===
            "url"
              ? "bg-[#1a1d22] text-white"
              : "bg-[#111214] text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <Link2
            size={13}
          />
          URL
        </button>


        <button
          type="button"
          onClick={() =>
            void selectSource(
              "library",
            )
          }
          className={`flex h-10 items-center justify-center gap-2 text-[9px] font-semibold ${
            source ===
            "library"
              ? "bg-[#1a1d22] text-white"
              : "bg-[#111214] text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <Images
            size={13}
          />
          Bibliothèque
        </button>
      </div>


      <div className="p-4">
        {source ===
        "device" ? (
          <label className="grid min-h-28 cursor-pointer place-items-center border border-dashed border-[#3a3d44] bg-[#0d0f12] px-4 text-center transition hover:border-[#3d92ff]">
            <div>
              <ImagePlus
                size={20}
                className="mx-auto text-zinc-600"
              />

              <p className="mt-2 text-[10px] font-semibold text-zinc-300">
                Sélectionner des images
              </p>

              <p className="mt-1 text-[8px] text-zinc-600">
                JPG, PNG ou WebP · 8 Mo maximum par image
              </p>
            </div>

            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              disabled={
                media.loading
              }
              onChange={(
                event,
              ) =>
                void handleFiles(
                  event.target
                    .files,
                )
              }
              className="hidden"
            />
          </label>
        ) : null}


        {source ===
        "url" ? (
          <div className="flex gap-2">
            <input
              value={url}
              onChange={(
                event,
              ) =>
                setUrl(
                  event.target
                    .value,
                )
              }
              placeholder="https://..."
              className="h-9 min-w-0 flex-1 border border-[#303238] bg-[#0d0f12] px-3 text-[10px] text-zinc-200 outline-none focus:border-[#3d92ff]"
            />

            <button
              type="button"
              onClick={
                addUrl
              }
              className="h-9 border border-[#3d92ff]/40 bg-[#3d92ff]/10 px-4 text-[9px] font-semibold text-[#66aaff]"
            >
              Ajouter
            </button>
          </div>
        ) : null}


        {source ===
        "library" ? (
          <div>
            {media.loading ? (
              <p className="py-8 text-center text-[9px] text-zinc-600">
                Chargement de la bibliothèque…
              </p>
            ) : media.library.length ? (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
                {media.library.map(
                  (asset) => {
                    const selected =
                      images.includes(
                        asset.url,
                      );

                    return (
                      <button
                        key={
                          asset.path
                        }
                        type="button"
                        onClick={() => {
                          if (
                            !selected
                          ) {
                            addImages([
                              asset.url,
                            ]);
                          }
                        }}
                        className={`relative aspect-square overflow-hidden border ${
                          selected
                            ? "border-[#3d92ff]"
                            : "border-[#303238]"
                        }`}
                      >
                        <img
                          src={
                            asset.url
                          }
                          alt=""
                          className="size-full object-cover"
                        />

                        {selected ? (
                          <span className="absolute inset-x-0 bottom-0 bg-[#3d92ff] py-1 text-[7px] font-bold uppercase text-white">
                            Sélectionnée
                          </span>
                        ) : null}
                      </button>
                    );
                  },
                )}
              </div>
            ) : (
              <p className="py-8 text-center text-[9px] text-zinc-600">
                La bibliothèque est vide. Importez une première image depuis votre appareil.
              </p>
            )}
          </div>
        ) : null}


        {localError ||
        media.error ? (
          <p
            role="alert"
            className="mt-3 text-[9px] text-red-400"
          >
            {localError ??
              media.error}
          </p>
        ) : null}


        {images.length ? (
          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[8px] font-bold uppercase tracking-[0.1em] text-zinc-500">
                Galerie
              </p>

              <span className="text-[8px] text-zinc-600">
                {images.length}/10
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
              {images.map(
                (
                  image,
                  index,
                ) => (
                  <article
                    key={`${image}-${index}`}
                    className="overflow-hidden border border-[#303238] bg-[#111214]"
                  >
                    <div className="relative aspect-square bg-black">
                      <img
                        src={
                          image
                        }
                        alt=""
                        className="size-full object-cover"
                      />

                      {index ===
                      0 ? (
                        <span className="absolute left-1.5 top-1.5 flex items-center gap-1 bg-[#1B76ED] px-1.5 py-1 text-[7px] font-bold uppercase text-white">
                          <Star
                            size={
                              8
                            }
                          />
                          Principale
                        </span>
                      ) : null}
                    </div>

                    <div className="flex items-center justify-between border-t border-[#303238] p-1">
                      <button
                        type="button"
                        disabled={
                          index ===
                          0
                        }
                        onClick={() =>
                          move(
                            index,
                            -1,
                          )
                        }
                        className="grid size-6 place-items-center text-zinc-600 hover:text-white disabled:opacity-20"
                      >
                        <ArrowLeft
                          size={
                            11
                          }
                        />
                      </button>

                      <button
                        type="button"
                        title="Définir comme image principale"
                        onClick={() =>
                          makePrimary(
                            index,
                          )
                        }
                        className="grid size-6 place-items-center text-zinc-600 hover:text-amber-400"
                      >
                        <Star
                          size={
                            11
                          }
                        />
                      </button>

                      <button
                        type="button"
                        disabled={
                          index ===
                          images.length -
                            1
                        }
                        onClick={() =>
                          move(
                            index,
                            1,
                          )
                        }
                        className="grid size-6 place-items-center text-zinc-600 hover:text-white disabled:opacity-20"
                      >
                        <ArrowRight
                          size={
                            11
                          }
                        />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          remove(
                            index,
                          )
                        }
                        className="grid size-6 place-items-center text-zinc-600 hover:text-red-400"
                      >
                        <Trash2
                          size={
                            11
                          }
                        />
                      </button>
                    </div>
                  </article>
                ),
              )}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
