"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Copy,
  ExternalLink,
  ImageIcon,
  Link2,
  MonitorUp,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import IndesyDualOrbitLoader from "@/components/loading/IndesyDualOrbitLoader";
import { useIndesyDialog } from "@/components/ui/indesy-dialog";

import { useProducts } from "../hooks";
import { useProductMedia } from "../media/useProductMedia";

type Filter = "all" | "used" | "unused";
type AddSource = "device" | "url";

const acceptedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

function remoteFileName(url: URL, type: string) {
  const name = decodeURIComponent(
    url.pathname.split("/").filter(Boolean).pop() ?? "",
  );

  if (name) return name;

  const extension =
    type === "image/png" ? "png" : type === "image/webp" ? "webp" : "jpg";

  return `image-${Date.now()}.${extension}`;
}

export function SellerMediaFeature() {
  const dialog = useIndesyDialog();
  const media = useProductMedia();
  const products = useProducts();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [adding, setAdding] = useState(false);
  const [source, setSource] = useState<AddSource>("device");
  const [remoteUrl, setRemoteUrl] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  useEffect(() => {
    void media.refresh().catch(() => undefined);
  }, [media.refresh]);

  const usage = useMemo(() => {
    const map = new Map<string, string[]>();

    for (const product of products.products) {
      for (const image of product.images) {
        map.set(image, [...(map.get(image) ?? []), product.id]);
      }
    }

    return map;
  }, [products.products]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase("fr");

    return media.library.filter((asset) => {
      const used = (usage.get(asset.url) ?? []).length > 0;

      if (filter === "used" && !used) return false;
      if (filter === "unused" && used) return false;

      return (
        !needle ||
        asset.name.toLocaleLowerCase("fr").includes(needle)
      );
    });
  }, [filter, media.library, search, usage]);

  const usedCount = media.library.filter(
    (asset) => (usage.get(asset.url) ?? []).length > 0,
  ).length;

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;

    setLocalError(null);

    try {
      await media.upload(Array.from(files));
      setAdding(false);
    } catch (cause) {
      setLocalError(
        cause instanceof Error
          ? cause.message
          : "Impossible d’importer les médias.",
      );
    }
  }

  async function importFromUrl() {
    setLocalError(null);

    const value = remoteUrl.trim();
    if (!value) return;

    let parsed: URL;

    try {
      parsed = new URL(value);
      if (!["http:", "https:"].includes(parsed.protocol)) throw new Error();
    } catch {
      setLocalError("Saisissez une URL HTTP ou HTTPS valide.");
      return;
    }

    try {
      const response = await fetch(parsed.toString(), { mode: "cors" });

      if (!response.ok) {
        throw new Error(`Téléchargement impossible (${response.status}).`);
      }

      const blob = await response.blob();

      if (!acceptedTypes.has(blob.type)) {
        throw new Error("L’URL doit pointer vers une image JPG, PNG ou WebP.");
      }

      const file = new File(
        [blob],
        remoteFileName(parsed, blob.type),
        { type: blob.type },
      );

      await media.upload([file]);
      setRemoteUrl("");
      setAdding(false);
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : "Import distant impossible.";

      setLocalError(
        `${message} Si le site distant bloque l’import, téléchargez l’image puis utilisez « Depuis l’appareil ».`,
      );
    }
  }

  async function copyUrl(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(url);

      window.setTimeout(() => {
        setCopiedUrl((current) => (current === url ? null : current));
      }, 1500);
    } catch {
      setLocalError("Impossible de copier l’URL.");
    }
  }

  async function removeAsset(path: string, url: string) {
    if ((usage.get(url) ?? []).length) return;

    const confirmed = await dialog.confirm({
      title: "Supprimer ce média ?",
      description:
        "Ce média inutilisé sera supprimé définitivement de votre bibliothèque.",
      confirmLabel: "Supprimer",
      cancelLabel: "Annuler",
      tone: "danger",
    });

    if (!confirmed) return;

    try {
      await media.remove(path);
    } catch {
      // Le hook expose déjà l'erreur.
    }
  }

  return (
    <div className="grid gap-3">
      <header className="flex flex-col gap-3 border-b border-[#303238] pb-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[8px] font-bold uppercase tracking-[0.15em] text-[#ed1b2f]">
            Catalogue
          </p>
          <h1 className="mt-1 text-[21px] font-semibold tracking-[-0.035em] text-zinc-100">
            Médias
          </h1>
          <p className="mt-1 text-[10px] text-zinc-500">
            Bibliothèque d’images réutilisable pour vos produits.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setLocalError(null);
            setAdding(true);
          }}
          className="inline-flex h-8 items-center justify-center gap-1.5 border border-[#ed1b2f] bg-[#ed1b2f] px-3 text-[9px] font-semibold text-white transition hover:bg-[#ff3045]"
        >
          <Plus size={12} />
          Ajouter des médias
        </button>
      </header>

      <section className="grid grid-cols-3 gap-px border border-[#303238] bg-[#303238]">
        <article className="bg-[#151619] p-4">
          <span className="text-[8px] uppercase tracking-[0.1em] text-zinc-500">
            Médias
          </span>
          <strong className="mt-2 block text-[23px] text-zinc-100">
            {media.library.length}
          </strong>
        </article>

        <article className="bg-[#151619] p-4">
          <span className="text-[8px] uppercase tracking-[0.1em] text-zinc-500">
            Utilisés
          </span>
          <strong className="mt-2 block text-[23px] text-emerald-400">
            {usedCount}
          </strong>
        </article>

        <article className="bg-[#151619] p-4">
          <span className="text-[8px] uppercase tracking-[0.1em] text-zinc-500">
            Non utilisés
          </span>
          <strong className="mt-2 block text-[23px] text-amber-400">
            {media.library.length - usedCount}
          </strong>
        </article>
      </section>

      {adding ? (
        <section className="border border-[#3d92ff]/30 bg-[#11151a]">
          <header className="flex items-center justify-between border-b border-[#303238] px-4 py-3">
            <div>
              <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-[#3d92ff]">
                Bibliothèque
              </p>
              <h2 className="mt-1 text-[12px] font-semibold text-zinc-100">
                Ajouter des médias
              </h2>
            </div>

            <button
              type="button"
              aria-label="Fermer"
              onClick={() => {
                setAdding(false);
                setLocalError(null);
              }}
              className="grid size-7 place-items-center text-zinc-500 hover:text-white"
            >
              <X size={14} />
            </button>
          </header>

          <div className="grid grid-cols-2 gap-px border-b border-[#303238] bg-[#303238]">
            <button
              type="button"
              onClick={() => {
                setSource("device");
                setLocalError(null);
              }}
              className={`flex h-10 items-center justify-center gap-2 text-[9px] font-semibold ${
                source === "device"
                  ? "bg-[#191c21] text-white"
                  : "bg-[#111214] text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <MonitorUp size={13} />
              Depuis l’appareil
            </button>

            <button
              type="button"
              onClick={() => {
                setSource("url");
                setLocalError(null);
              }}
              className={`flex h-10 items-center justify-center gap-2 text-[9px] font-semibold ${
                source === "url"
                  ? "bg-[#191c21] text-white"
                  : "bg-[#111214] text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Link2 size={13} />
              Depuis une URL
            </button>
          </div>

          <div className="p-4">
            {source === "device" ? (
              <label className="grid min-h-32 cursor-pointer place-items-center border border-dashed border-[#3a3d44] bg-[#0d0f12] px-5 text-center hover:border-[#3d92ff]">
                <div>
                  <Upload size={22} className="mx-auto text-zinc-600" />
                  <p className="mt-3 text-[10px] font-semibold text-zinc-300">
                    Sélectionner des images
                  </p>
                  <p className="mt-1 text-[8px] text-zinc-600">
                    JPG, PNG ou WebP · plusieurs fichiers · 8 Mo maximum par image
                  </p>
                  {media.loading ? (
                    <p className="mt-2 text-[8px] font-semibold text-[#3d92ff]">
                      Import en cours…
                    </p>
                  ) : null}
                </div>

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  disabled={media.loading}
                  onChange={(event) => void handleFiles(event.target.files)}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="grid gap-3">
                <label className="grid gap-1.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
                  URL de l’image

                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={remoteUrl}
                      onChange={(event) => setRemoteUrl(event.target.value)}
                      placeholder="https://exemple.com/image.jpg"
                      className="h-9 min-w-0 flex-1 border border-[#303238] bg-[#0d0f12] px-3 text-[10px] text-zinc-200 outline-none placeholder:text-zinc-700 focus:border-[#3d92ff]"
                    />

                    <button
                      type="button"
                      disabled={media.loading || !remoteUrl.trim()}
                      onClick={() => void importFromUrl()}
                      className="inline-flex h-9 items-center gap-1.5 border border-[#3d92ff]/40 bg-[#3d92ff]/10 px-4 text-[9px] font-semibold text-[#69abff] disabled:opacity-40"
                    >
                      <Upload size={11} />
                      Importer
                    </button>
                  </div>
                </label>

                <p className="text-[8px] leading-4 text-zinc-600">
                  L’image distante est copiée dans votre bibliothèque Indesy.
                </p>
              </div>
            )}

            {localError ? (
              <p
                role="alert"
                className="mt-3 border border-red-500/20 bg-red-500/5 px-3 py-2 text-[9px] leading-4 text-red-400"
              >
                {localError}
              </p>
            ) : null}
          </div>
        </section>
      ) : null}

      <section className="border border-[#303238] bg-[#111214]">
        <div className="grid gap-2 border-b border-[#303238] p-3 sm:grid-cols-[1fr_180px]">
          <label className="relative">
            <Search
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher un média..."
              className="h-9 w-full border border-[#303238] bg-[#0d0f12] pl-8 pr-3 text-[10px] text-zinc-200 outline-none focus:border-[#3d92ff]"
            />
          </label>

          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value as Filter)}
            className="h-9 border border-[#303238] bg-[#0d0f12] px-3 text-[9px] text-zinc-400 outline-none"
          >
            <option value="all">Tous les médias</option>
            <option value="used">Utilisés</option>
            <option value="unused">Non utilisés</option>
          </select>
        </div>

        {media.loading && !media.library.length ? (
          <div className="min-h-56">
            <IndesyDualOrbitLoader
              variant="data"
              label="Chargement de la bibliothèque"
            />
          </div>
        ) : filtered.length ? (
          <div className="grid grid-cols-2 gap-px bg-[#292c31] sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
            {filtered.map((asset) => {
              const productIds = usage.get(asset.url) ?? [];
              const used = productIds.length > 0;

              return (
                <article key={asset.path} className="group bg-[#111214]">
                  <div className="relative aspect-square overflow-hidden bg-black">
                    <img
                      src={asset.url}
                      alt=""
                      className="size-full object-cover"
                    />

                    <div className="absolute right-1.5 top-1.5 flex gap-1 opacity-0 transition group-hover:opacity-100">
                      <button
                        type="button"
                        title="Aperçu"
                        onClick={() =>
                          window.open(
                            asset.url,
                            "_blank",
                            "noopener,noreferrer",
                          )
                        }
                        className="grid size-7 place-items-center border border-white/10 bg-black/80 text-zinc-300 hover:text-white"
                      >
                        <ExternalLink size={11} />
                      </button>

                      <button
                        type="button"
                        title="Copier l’URL"
                        onClick={() => void copyUrl(asset.url)}
                        className="grid size-7 place-items-center border border-white/10 bg-black/80 text-zinc-300 hover:text-white"
                      >
                        <Copy size={11} />
                      </button>
                    </div>
                  </div>

                  <div className="p-2">
                    <p className="truncate text-[8px] text-zinc-500">
                      {asset.name}
                    </p>

                    <div className="mt-2 flex items-center justify-between gap-2">
                      {used ? (
                        <Link
                          href={`/dashboard/vendeur/products/${productIds[0]}`}
                          className="truncate text-[8px] font-semibold text-emerald-400 hover:text-emerald-300"
                        >
                          Utilisée · {productIds.length}
                        </Link>
                      ) : (
                        <span className="text-[8px] text-amber-400">
                          Non utilisée
                        </span>
                      )}

                      {!used ? (
                        <button
                          type="button"
                          title="Supprimer"
                          disabled={media.loading}
                          onClick={() =>
                            void removeAsset(asset.path, asset.url)
                          }
                          className="grid size-6 shrink-0 place-items-center text-zinc-600 hover:text-red-400 disabled:opacity-30"
                        >
                          <Trash2 size={11} />
                        </button>
                      ) : null}
                    </div>

                    {copiedUrl === asset.url ? (
                      <p className="mt-1 text-[7px] font-semibold text-[#3d92ff]">
                        URL copiée
                      </p>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="grid min-h-56 place-items-center text-center">
            <div>
              <ImageIcon size={22} className="mx-auto text-zinc-700" />
              <p className="mt-3 text-[10px] text-zinc-500">
                Aucun média correspondant.
              </p>
              {!media.library.length ? (
                <button
                  type="button"
                  onClick={() => setAdding(true)}
                  className="mt-4 inline-flex h-8 items-center gap-1.5 border border-[#ed1b2f] bg-[#ed1b2f] px-3 text-[9px] font-semibold text-white"
                >
                  <Plus size={11} />
                  Ajouter un média
                </button>
              ) : null}
            </div>
          </div>
        )}

        {media.error ? (
          <p className="border-t border-[#303238] p-3 text-[9px] text-red-400">
            {media.error}
          </p>
        ) : null}
      </section>
    </div>
  );
}
