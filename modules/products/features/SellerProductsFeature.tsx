"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { ProductForm } from "../components/ProductForm";
import { useProducts } from "../hooks";
import type { ListingType, MarketplaceProduct, ProductStatus } from "../types";

const typeLabels: Record<ListingType, string> = {
  sale: "Vente",
  rental: "Location",
  used: "Occasion",
};

const statusLabels: Record<ProductStatus, string> = {
  draft: "Brouillon",
  published: "Publié",
  inactive: "Inactif",
  archived: "Archivé",
};

const statusStyles: Record<ProductStatus, string> = {
  draft: "border-zinc-700 bg-zinc-900 text-zinc-400",
  published: "border-emerald-800/70 bg-emerald-950/40 text-emerald-300",
  inactive: "border-amber-800/70 bg-amber-950/40 text-amber-300",
  archived: "border-zinc-700 bg-zinc-900 text-zinc-500",
};

export function SellerProductsFeature({
  mode = "list",
  productId,
}: {
  mode?: "list" | "new" | "detail";
  productId?: string;
}) {
  const data = useProducts();
  const [editing, setEditing] = useState<MarketplaceProduct | null>(null);
  const [selected, setSelected] = useState<MarketplaceProduct | null>(null);

  useEffect(() => {
    if (productId) void data.detail(productId).then(setSelected);
  }, [data.detail, productId]);

  if (data.loading) {
    return (
      <p className="rounded-[2px] border border-[#303238] bg-[#151619] p-5 text-sm text-zinc-500">
        Chargement des produits…
      </p>
    );
  }

  if (data.error) {
    return (
      <p role="alert" className="rounded-[2px] border border-red-500/30 bg-red-500/5 p-5 text-sm text-red-400">
        {data.error}
      </p>
    );
  }

  if (mode === "new") {
    return <ProductForm onSubmit={data.create} />;
  }

  if (mode === "detail") {
    return selected ? (
      <div className="space-y-4 text-zinc-100">
        <header className="border-b border-[#303238] pb-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#3d92ff]">
            Catalogue vendeur
          </p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-white">{selected.title}</h1>
        </header>
        <ProductForm initial={selected} onSubmit={(input) => data.update(selected.id, input)} />
      </div>
    ) : (
      <p className="rounded-[2px] border border-dashed border-[#303238] bg-[#101114] p-8 text-center text-sm text-zinc-500">
        Produit introuvable.
      </p>
    );
  }

  return (
    <section className="space-y-4 text-zinc-100">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-[#303238] pb-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#3d92ff]">
            Catalogue vendeur
          </p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-white">Produits vendeur</h1>
        </div>
        <Link
          href="/dashboard/vendeur/products/new"
          className="inline-flex h-9 items-center rounded-[2px] border border-[#d8273f] bg-[#c82335] px-4 text-xs font-bold text-white transition-colors hover:bg-[#df2a43]"
        >
          Nouveau produit
        </Link>
      </header>

      {editing && (
        <ProductForm
          initial={editing}
          onSubmit={async (input) => {
            await data.update(editing.id, input);
            setEditing(null);
          }}
        />
      )}

      <div className="overflow-x-auto rounded-[2px] border border-[#303238] bg-[#151619]">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-[#101114] text-[10px] uppercase tracking-[0.1em] text-zinc-500">
            <tr>
              <th className="p-3">Produit</th>
              <th className="p-3">Type</th>
              <th className="p-3">Stock</th>
              <th className="p-3">Statut</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.products.map((product) => (
              <tr
                key={product.id}
                className="border-t border-[#303238] text-zinc-300 transition-colors hover:bg-white/[0.02]"
              >
                <td className="p-3">
                  <Link
                    href={"/dashboard/vendeur/products/" + product.id}
                    className="font-semibold text-white hover:text-[#3d92ff]"
                  >
                    {product.title}
                  </Link>
                </td>
                <td className="p-3">{typeLabels[product.type]}</td>
                <td className="p-3">{product.stock}</td>
                <td className="p-3">
                  <span className={"inline-flex rounded-[2px] border px-2 py-1 text-[10px] font-semibold " + statusStyles[product.status]}>
                    {statusLabels[product.status]}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setEditing(product)}
                      className="text-xs font-semibold text-[#3d92ff] hover:text-blue-300"
                    >
                      Modifier
                    </button>
                    <button
                      type="button"
                      onClick={() => void data.remove(product.id)}
                      className="text-xs font-semibold text-red-400 hover:text-red-300"
                    >
                      Supprimer
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!data.products.length && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-zinc-500">
                  Aucun produit.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
