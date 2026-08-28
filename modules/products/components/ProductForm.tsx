"use client";

import { useState, type FormEvent } from "react";

import type {
  ListingType,
  MarketplaceProduct,
  ProductCondition,
  ProductInput,
  ProductStatus,
} from "../types";

const fieldClassName =
  "h-10 w-full rounded-[2px] border border-[#303238] bg-[#0d0f12] px-3 text-xs text-zinc-200 outline-none transition-colors placeholder:text-zinc-600 hover:border-[#454951] focus:border-[#3d92ff]";
const labelClassName =
  "grid gap-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-zinc-500";

export function ProductForm({
  initial,
  onSubmit,
}: {
  initial?: MarketplaceProduct;
  onSubmit: (input: ProductInput) => Promise<void>;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [type, setType] = useState<ListingType>(initial?.type ?? "sale");
  const [category, setCategory] = useState(initial?.category ?? "Équipement");
  const [salePrice, setSalePrice] = useState(String(initial?.salePrice ?? ""));
  const [rentalPrice, setRentalPrice] = useState(String(initial?.rentalPricePerDay ?? ""));
  const [deposit, setDeposit] = useState(String(initial?.depositAmount ?? ""));
  const [stock, setStock] = useState(String(initial?.stock ?? 0));
  const [condition, setCondition] = useState<ProductCondition>(initial?.condition ?? "new");
  const [images, setImages] = useState(initial?.images.join(", ") ?? "");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [status, setStatus] = useState<ProductStatus>(initial?.status ?? "draft");

  async function submit(event: FormEvent) {
    event.preventDefault();
    await onSubmit({
      title,
      description,
      type,
      category,
      salePrice: salePrice ? Number(salePrice) : null,
      rentalPricePerDay: rentalPrice ? Number(rentalPrice) : null,
      depositAmount: deposit ? Number(deposit) : null,
      stock: Number(stock) || 0,
      condition,
      images: images
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
      sellerId: initial?.sellerId ?? "current-seller",
      sellerName: initial?.sellerName ?? "Vendeur",
      location,
      status,
    });
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-[2px] border border-[#303238] bg-[#151619] text-zinc-100"
    >
      <header className="border-b border-[#303238] p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#3d92ff]">
          Fiche produit
        </p>
        <h2 className="mt-1 text-xl font-black text-white">
          {initial ? "Modifier le produit" : "Créer un produit"}
        </h2>
      </header>

      <div className="grid gap-4 p-4">
        <label className={labelClassName}>
          Titre
          <input
            required
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Titre du produit"
            className={fieldClassName}
          />
        </label>

        <label className={labelClassName}>
          Description
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Description"
            className="min-h-28 w-full rounded-[2px] border border-[#303238] bg-[#0d0f12] p-3 text-xs text-zinc-200 outline-none transition-colors placeholder:text-zinc-600 hover:border-[#454951] focus:border-[#3d92ff]"
          />
        </label>

        <div className="grid gap-3 md:grid-cols-3">
          <label className={labelClassName}>
            Type d’offre
            <select
              value={type}
              onChange={(event) => setType(event.target.value as ListingType)}
              className={fieldClassName}
            >
              <option value="sale">Vente</option>
              <option value="rental">Location</option>
              <option value="used">Occasion</option>
            </select>
          </label>
          <label className={labelClassName}>
            Catégorie
            <input
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              placeholder="Catégorie"
              className={fieldClassName}
            />
          </label>
          <label className={labelClassName}>
            État
            <select
              value={condition}
              onChange={(event) => setCondition(event.target.value as ProductCondition)}
              className={fieldClassName}
            >
              <option value="new">Neuf</option>
              <option value="excellent">Excellent</option>
              <option value="good">Bon</option>
              <option value="used">Usagé</option>
            </select>
          </label>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <label className={labelClassName}>
            Prix de vente
            <input
              type="number"
              value={salePrice}
              onChange={(event) => setSalePrice(event.target.value)}
              placeholder="Montant"
              className={fieldClassName}
            />
          </label>
          <label className={labelClassName}>
            Location / jour
            <input
              type="number"
              value={rentalPrice}
              onChange={(event) => setRentalPrice(event.target.value)}
              placeholder="Montant"
              className={fieldClassName}
            />
          </label>
          <label className={labelClassName}>
            Caution
            <input
              type="number"
              value={deposit}
              onChange={(event) => setDeposit(event.target.value)}
              placeholder="Montant"
              className={fieldClassName}
            />
          </label>
          <label className={labelClassName}>
            Stock
            <input
              type="number"
              value={stock}
              onChange={(event) => setStock(event.target.value)}
              placeholder="Quantité"
              className={fieldClassName}
            />
          </label>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <label className={labelClassName}>
            Images
            <input
              value={images}
              onChange={(event) => setImages(event.target.value)}
              placeholder="URLs séparées par des virgules"
              className={fieldClassName}
            />
          </label>
          <label className={labelClassName}>
            Localisation
            <input
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="Localisation"
              className={fieldClassName}
            />
          </label>
        </div>

        <label className={labelClassName}>
          Statut
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as ProductStatus)}
            className={fieldClassName}
          >
            <option value="draft">Brouillon</option>
            <option value="published">Publié</option>
            <option value="inactive">Inactif</option>
            <option value="archived">Archivé</option>
          </select>
        </label>
      </div>

      <footer className="border-t border-[#303238] bg-[#101114] p-4">
        <button className="inline-flex h-9 items-center rounded-[2px] border border-[#d8273f] bg-[#c82335] px-4 text-xs font-bold text-white transition-colors hover:bg-[#df2a43]">
          Enregistrer
        </button>
      </footer>
    </form>
  );
}
