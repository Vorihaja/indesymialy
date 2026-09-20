"use client";

import {
  useMemo,
  useState,
  type FormEvent,
} from "react";

import {
  Archive,
  Edit3,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Search,
  X,
} from "lucide-react";

import IndesyDualOrbitLoader from "@/components/loading/IndesyDualOrbitLoader";
import {
  useIndesyDialog,
} from "@/components/ui/indesy-dialog";

import {
  usePromotions,
} from "../hooks/usePromotions";

import type {
  PromotionCampaign,
  PromotionCampaignInput,
  PromotionCode,
  PromotionCodeInput,
  PromotionStatus,
} from "../types";

export type SellerPromotionsView =
  | "campaigns"
  | "codes";

type CampaignForm = {
  id?: string;
  name: string;
  description: string;
  discountType:
    | "percent"
    | "fixed";
  discountValue: string;
  currency: string;
  status:
    PromotionStatus;
  startsAt: string;
  endsAt: string;
  minOrderAmount: string;
  maxDiscountAmount: string;
  usageLimit: string;
  productIds: string[];
};

type CodeForm = {
  id?: string;
  promotionId: string;
  code: string;
  status:
    "active" |
    "inactive";
  usageLimit: string;
};

const fieldClass =
  "h-9 w-full border border-[#303238] bg-[#0d0f12] px-3 text-[9px] text-zinc-300 outline-none focus:border-[#3d92ff]";

const emptyCampaign:
  CampaignForm = {
    name: "",
    description: "",
    discountType:
      "percent",
    discountValue:
      "10",
    currency:
      "MGA",
    status:
      "draft",
    startsAt:
      "",
    endsAt:
      "",
    minOrderAmount:
      "0",
    maxDiscountAmount:
      "",
    usageLimit:
      "",
    productIds:
      [],
  };

const emptyCode:
  CodeForm = {
    promotionId:
      "",
    code:
      "",
    status:
      "active",
    usageLimit:
      "",
  };

function toLocalDateTime(
  value: string | null,
) {
  if (!value) {
    return "";
  }

  const date =
    new Date(value);

  const shifted =
    new Date(
      date.getTime() -
      date.getTimezoneOffset() *
      60_000,
    );

  return shifted
    .toISOString()
    .slice(
      0,
      16,
    );
}

function toIso(
  value: string,
) {
  return value
    ? new Date(
        value,
      ).toISOString()
    : null;
}

function campaignState(
  campaign:
    PromotionCampaign,
) {
  const now =
    Date.now();

  if (
    campaign.status ===
      "active" &&
    campaign.endsAt &&
    new Date(
      campaign.endsAt,
    ).getTime() <
      now
  ) {
    return {
      label:
        "Expirée",
      className:
        "border-zinc-700 bg-zinc-900 text-zinc-500",
    };
  }

  switch (
    campaign.status
  ) {
    case "active":
      return {
        label:
          "Active",
        className:
          "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
      };

    case "paused":
      return {
        label:
          "En pause",
        className:
          "border-amber-500/30 bg-amber-500/10 text-amber-400",
      };

    case "archived":
      return {
        label:
          "Archivée",
        className:
          "border-zinc-700 bg-zinc-900 text-zinc-500",
      };

    default:
      return {
        label:
          "Brouillon",
        className:
          "border-[#3d92ff]/30 bg-[#3d92ff]/10 text-[#72b2ff]",
      };
  }
}

function discountLabel(
  campaign:
    PromotionCampaign,
) {
  return campaign.discountType ===
    "percent"
    ? `${campaign.discountValue} %`
    : `${campaign.discountValue.toLocaleString("fr-FR")} ${campaign.currency}`;
}

export function SellerPromotionsFeature({
  view,
}: {
  view:
    SellerPromotionsView;
}) {
  const dialog = useIndesyDialog();
  const promotions =
    usePromotions();

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    campaignForm,
    setCampaignForm,
  ] =
    useState<CampaignForm | null>(
      null,
    );

  const [
    codeForm,
    setCodeForm,
  ] =
    useState<CodeForm | null>(
      null,
    );

  const [
    formError,
    setFormError,
  ] =
    useState<string | null>(
      null,
    );

  const campaignMap =
    useMemo(
      () =>
        new Map(
          (
            promotions.data
              ?.campaigns ??
            []
          ).map(
            (campaign) => [
              campaign.id,
              campaign,
            ],
          ),
        ),
      [
        promotions.data
          ?.campaigns,
      ],
    );

  const filteredCampaigns =
    useMemo(
      () => {
        const campaigns =
          promotions.data
            ?.campaigns ??
          [];

        const needle =
          search
            .trim()
            .toLocaleLowerCase(
              "fr",
            );

        if (!needle) {
          return campaigns;
        }

        return campaigns.filter(
          (campaign) =>
            [
              campaign.name,
              campaign.description ??
                "",
              campaign.status,
            ]
              .join(" ")
              .toLocaleLowerCase(
                "fr",
              )
              .includes(
                needle,
              ),
        );
      },
      [
        promotions.data
          ?.campaigns,
        search,
      ],
    );

  const filteredCodes =
    useMemo(
      () => {
        const codes =
          promotions.data
            ?.codes ??
          [];

        const needle =
          search
            .trim()
            .toLocaleLowerCase(
              "fr",
            );

        if (!needle) {
          return codes;
        }

        return codes.filter(
          (code) => {
            const campaign =
              campaignMap.get(
                code.promotionId,
              );

            return [
              code.code,
              code.status,
              campaign?.name ??
                "",
            ]
              .join(" ")
              .toLocaleLowerCase(
                "fr",
              )
              .includes(
                needle,
              );
          },
        );
      },
      [
        campaignMap,
        promotions.data
          ?.codes,
        search,
      ],
    );

  if (
    promotions.loading
  ) {
    return (
      <div className="min-h-[420px]">
        <IndesyDualOrbitLoader
          variant="data"
          label="Chargement des promotions"
        />
      </div>
    );
  }

  if (
    promotions.data === null
  ) {
    return (
      <div className="grid min-h-[320px] place-items-center border border-red-500/20 bg-red-500/5 p-6 text-center">
        <div>
          <p className="text-[11px] font-semibold text-red-400">
            Impossible de charger les promotions
          </p>

          <p className="mt-2 max-w-xl text-[9px] leading-5 text-zinc-500">
            {promotions.error ??
              "Les données Promotions sont indisponibles."}
          </p>

          <button
            type="button"
            onClick={
              () =>
                void promotions
                  .refresh()
                  .catch(
                    () => undefined,
                  )
            }
            className="mt-4 h-8 border border-[#303238] bg-[#151619] px-4 text-[8px] font-semibold text-zinc-300 hover:border-[#3d92ff]/50 hover:text-white"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  const active =
    promotions.data.campaigns.filter(
      (campaign) =>
        campaign.status ===
        "active",
    ).length;

  const drafts =
    promotions.data.campaigns.filter(
      (campaign) =>
        campaign.status ===
        "draft",
    ).length;

  const paused =
    promotions.data.campaigns.filter(
      (campaign) =>
        campaign.status ===
        "paused",
    ).length;

  function createCampaign() {
    setFormError(
      null,
    );

    setCampaignForm({
      ...emptyCampaign,
      productIds:
        [],
    });
  }

  function editCampaign(
    campaign:
      PromotionCampaign,
  ) {
    setFormError(
      null,
    );

    setCampaignForm({
      id:
        campaign.id,

      name:
        campaign.name,

      description:
        campaign.description ??
        "",

      discountType:
        campaign.discountType,

      discountValue:
        String(
          campaign.discountValue,
        ),

      currency:
        campaign.currency,

      status:
        campaign.status,

      startsAt:
        toLocalDateTime(
          campaign.startsAt,
        ),

      endsAt:
        toLocalDateTime(
          campaign.endsAt,
        ),

      minOrderAmount:
        String(
          campaign.minOrderAmount,
        ),

      maxDiscountAmount:
        campaign.maxDiscountAmount ===
        null
          ? ""
          : String(
              campaign.maxDiscountAmount,
            ),

      usageLimit:
        campaign.usageLimit ===
        null
          ? ""
          : String(
              campaign.usageLimit,
            ),

      productIds:
        [...campaign.productIds],
    });
  }

  function createCode() {
    const firstCampaign =
      promotions.data?.campaigns.find(
        (campaign) =>
          campaign.status !==
          "archived",
      );

    setFormError(
      null,
    );

    setCodeForm({
      ...emptyCode,
      promotionId:
        firstCampaign?.id ??
        "",
    });
  }

  function editCode(
    code:
      PromotionCode,
  ) {
    setFormError(
      null,
    );

    setCodeForm({
      id:
        code.id,

      promotionId:
        code.promotionId,

      code:
        code.code,

      status:
        code.status,

      usageLimit:
        code.usageLimit ===
        null
          ? ""
          : String(
              code.usageLimit,
            ),
    });
  }

  async function saveCampaign(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!campaignForm) {
      return;
    }

    setFormError(
      null,
    );

    try {
      const input:
        PromotionCampaignInput = {
          id:
            campaignForm.id,

          name:
            campaignForm.name,

          description:
            campaignForm.description,

          discountType:
            campaignForm.discountType,

          discountValue:
            Number(
              campaignForm.discountValue,
            ),

          currency:
            campaignForm.currency,

          status:
            campaignForm.status,

          startsAt:
            toIso(
              campaignForm.startsAt,
            ),

          endsAt:
            toIso(
              campaignForm.endsAt,
            ),

          minOrderAmount:
            Number(
              campaignForm.minOrderAmount ||
              0,
            ),

          maxDiscountAmount:
            campaignForm.maxDiscountAmount
              ? Number(
                  campaignForm.maxDiscountAmount,
                )
              : null,

          usageLimit:
            campaignForm.usageLimit
              ? Number(
                  campaignForm.usageLimit,
                )
              : null,

          productIds:
            campaignForm.productIds,
        };

      await promotions.saveCampaign(
        input,
      );

      setCampaignForm(
        null,
      );
    }
    catch (reason) {
      setFormError(
        reason instanceof Error
          ? reason.message
          : "Impossible d’enregistrer la campagne.",
      );
    }
  }

  async function saveCode(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!codeForm) {
      return;
    }

    setFormError(
      null,
    );

    try {
      const input:
        PromotionCodeInput = {
          id:
            codeForm.id,

          promotionId:
            codeForm.promotionId,

          code:
            codeForm.code,

          status:
            codeForm.status,

          usageLimit:
            codeForm.usageLimit
              ? Number(
                  codeForm.usageLimit,
                )
              : null,
        };

      await promotions.saveCode(
        input,
      );

      setCodeForm(
        null,
      );
    }
    catch (reason) {
      setFormError(
        reason instanceof Error
          ? reason.message
          : "Impossible d’enregistrer le code promo.",
      );
    }
  }

  async function archiveCampaign(
    campaignId: string,
  ) {
    const confirmed =
      await dialog.confirm({
        title:
          "Archiver cette campagne ?",
        description:
          "La campagne sera archivée définitivement.",
        confirmLabel: "Archiver",
        cancelLabel: "Annuler",
        tone: "danger",
      });

    if (!confirmed) return;

    await promotions
      .setCampaignStatus(
        campaignId,
        "archived",
      )
      .catch(() => undefined);
  }

  return (
    <div className="grid gap-4 text-zinc-100">
      <header className="flex flex-col gap-3 border-b border-[#303238] pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[8px] font-bold uppercase tracking-[0.15em] text-[#ed1b2f]">
            Marketplace vendeur
          </p>

          <h1 className="mt-1 text-[22px] font-semibold tracking-[-0.035em] text-white">
            {view ===
            "codes"
              ? "Codes promo"
              : "Campagnes"}
          </h1>

          <p className="mt-1 max-w-3xl text-[9px] leading-5 text-zinc-600">
            Configurez les offres commerciales sans modifier directement les prix catalogue.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={
              () =>
                void promotions
                  .refresh()
                  .catch(
                    () => undefined,
                  )
            }
            className="inline-flex h-8 items-center gap-1.5 border border-[#303238] bg-[#151619] px-3 text-[8px] font-semibold text-zinc-400 hover:text-white"
          >
            <RefreshCw
              size={11}
            />

            Actualiser
          </button>

          <button
            type="button"
            onClick={
              view === "codes"
                ? createCode
                : createCampaign
            }
            disabled={
              view ===
                "codes" &&
              !promotions.data
                .campaigns
                .some(
                  (campaign) =>
                    campaign.status !==
                    "archived",
                )
            }
            className="inline-flex h-8 items-center gap-1.5 border border-[#ed1b2f] bg-[#ed1b2f] px-3 text-[8px] font-semibold text-white hover:bg-[#ff3045] disabled:opacity-40"
          >
            <Plus
              size={11}
            />

            {view ===
            "codes"
              ? "Nouveau code"
              : "Nouvelle campagne"}
          </button>
        </div>
      </header>

      <div className="border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-[8px] leading-5 text-zinc-500">
        Les campagnes et codes sont maintenant persistants et administrables. Leur application au panier et au checkout reste volontairement désactivée dans cette V1 afin de préserver l’autorité actuelle des prix et des totaux de commande.
      </div>

      {promotions.error ? (
        <div
          role="alert"
          className="border border-blue-500/30 bg-blue-500/5 px-3 py-2 text-[9px] text-blue-400"
        >
          {promotions.error}
        </div>
      ) : null}

      {view ===
      "campaigns" ? (
        <>
          <section className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <article className="border border-[#303238] bg-[#111214] p-4">
              <p className="text-[7px] font-bold uppercase tracking-[0.1em] text-zinc-600">
                Campagnes
              </p>

              <strong className="mt-2 block text-2xl text-white">
                {promotions.data.campaigns.length}
              </strong>
            </article>

            <article className="border border-[#303238] bg-[#111214] p-4">
              <p className="text-[7px] font-bold uppercase tracking-[0.1em] text-zinc-600">
                Actives
              </p>

              <strong className="mt-2 block text-2xl text-emerald-400">
                {active}
              </strong>
            </article>

            <article className="border border-[#303238] bg-[#111214] p-4">
              <p className="text-[7px] font-bold uppercase tracking-[0.1em] text-zinc-600">
                Brouillons
              </p>

              <strong className="mt-2 block text-2xl text-[#72b2ff]">
                {drafts}
              </strong>
            </article>

            <article className="border border-[#303238] bg-[#111214] p-4">
              <p className="text-[7px] font-bold uppercase tracking-[0.1em] text-zinc-600">
                En pause
              </p>

              <strong className="mt-2 block text-2xl text-amber-400">
                {paused}
              </strong>
            </article>
          </section>

          <section className="border border-[#303238] bg-[#111214]">
            <div className="border-b border-[#303238] p-3">
              <label className="relative block max-w-xl">
                <Search
                  size={12}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600"
                />

                <input
                  value={search}
                  onChange={
                    (event) =>
                      setSearch(
                        event.target.value,
                      )
                  }
                  placeholder="Rechercher une campagne..."
                  className={`${fieldClass} pl-8`}
                />
              </label>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px]">
                <thead>
                  <tr className="border-b border-[#303238] bg-[#151619] text-left text-[7px] font-bold uppercase tracking-[0.1em] text-zinc-600">
                    <th className="px-4 py-3">
                      Campagne
                    </th>

                    <th className="px-3 py-3">
                      Remise
                    </th>

                    <th className="px-3 py-3">
                      Produits
                    </th>

                    <th className="px-3 py-3">
                      Utilisation
                    </th>

                    <th className="px-3 py-3">
                      Période
                    </th>

                    <th className="px-3 py-3">
                      Statut
                    </th>

                    <th className="px-4 py-3 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#292c31]">
                  {filteredCampaigns.map(
                    (campaign) => {
                      const state =
                        campaignState(
                          campaign,
                        );

                      return (
                        <tr
                          key={
                            campaign.id
                          }
                          className="hover:bg-[#151619]"
                        >
                          <td className="px-4 py-3">
                            <strong className="text-[9px] text-zinc-200">
                              {campaign.name}
                            </strong>

                            {campaign.description ? (
                              <p className="mt-1 max-w-[280px] truncate text-[7px] text-zinc-600">
                                {campaign.description}
                              </p>
                            ) : null}
                          </td>

                          <td className="px-3 py-3 text-[10px] font-semibold text-[#72b2ff]">
                            {discountLabel(
                              campaign,
                            )}
                          </td>

                          <td className="px-3 py-3 text-[8px] text-zinc-500">
                            {campaign.productIds.length
                              ? `${campaign.productIds.length} produit(s)`
                              : "Tout le catalogue"}
                          </td>

                          <td className="px-3 py-3 text-[8px] text-zinc-500">
                            {campaign.usageCount}
                            {" / "}
                            {campaign.usageLimit ??
                              "∞"}
                          </td>

                          <td className="px-3 py-3 text-[8px] text-zinc-600">
                            {campaign.startsAt
                              ? new Date(
                                  campaign.startsAt,
                                ).toLocaleDateString(
                                  "fr-FR",
                                )
                              : "Maintenant"}
                            {" → "}
                            {campaign.endsAt
                              ? new Date(
                                  campaign.endsAt,
                                ).toLocaleDateString(
                                  "fr-FR",
                                )
                              : "Sans fin"}
                          </td>

                          <td className="px-3 py-3">
                            <span
                              className={
                                "border px-2 py-1 text-[8px] font-semibold " +
                                state.className
                              }
                            >
                              {state.label}
                            </span>
                          </td>

                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-1">
                              <button
                                type="button"
                                onClick={
                                  () =>
                                    editCampaign(
                                      campaign,
                                    )
                                }
                                disabled={
                                  campaign.status ===
                                  "archived"
                                }
                                title="Modifier"
                                className="grid size-7 place-items-center border border-[#303238] text-zinc-500 hover:text-white disabled:opacity-30"
                              >
                                <Edit3
                                  size={11}
                                />
                              </button>

                              {campaign.status !==
                              "archived" ? (
                                <button
                                  type="button"
                                  disabled={
                                    promotions.mutating
                                  }
                                  onClick={
                                    () =>
                                      void promotions
                                        .setCampaignStatus(
                                          campaign.id,
                                          campaign.status ===
                                            "active"
                                            ? "paused"
                                            : "active",
                                        )
                                        .catch(
                                          () => undefined,
                                        )
                                  }
                                  className="grid size-7 place-items-center border border-[#303238] text-zinc-500 hover:text-white disabled:opacity-30"
                                  title={
                                    campaign.status ===
                                    "active"
                                      ? "Mettre en pause"
                                      : "Activer"
                                  }
                                >
                                  {campaign.status ===
                                  "active" ? (
                                    <Pause
                                      size={11}
                                    />
                                  ) : (
                                    <Play
                                      size={11}
                                    />
                                  )}
                                </button>
                              ) : null}

                              {campaign.status !==
                              "archived" ? (
                                <button
                                  type="button"
                                  disabled={
                                    promotions.mutating
                                  }
                                  onClick={() =>
                                    void archiveCampaign(
                                      campaign.id,
                                    )
                                  }
                                  title="Archiver"
                                  className="grid size-7 place-items-center border border-red-500/20 text-red-400 hover:bg-red-500/5 disabled:opacity-30"
                                >
                                  <Archive
                                    size={11}
                                  />
                                </button>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      );
                    },
                  )}

                  {!filteredCampaigns.length ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-12 text-center text-[9px] text-zinc-600"
                      >
                        Aucune campagne correspondante.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : (
        <section className="border border-[#303238] bg-[#111214]">
          <div className="border-b border-[#303238] p-3">
            <label className="relative block max-w-xl">
              <Search
                size={12}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600"
              />

              <input
                value={search}
                onChange={
                  (event) =>
                    setSearch(
                      event.target.value,
                    )
                }
                placeholder="Code ou campagne..."
                className={`${fieldClass} pl-8`}
              />
            </label>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px]">
              <thead>
                <tr className="border-b border-[#303238] bg-[#151619] text-left text-[7px] font-bold uppercase tracking-[0.1em] text-zinc-600">
                  <th className="px-4 py-3">
                    Code
                  </th>

                  <th className="px-3 py-3">
                    Campagne
                  </th>

                  <th className="px-3 py-3">
                    Utilisation
                  </th>

                  <th className="px-3 py-3">
                    Statut
                  </th>

                  <th className="px-4 py-3 text-right">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#292c31]">
                {filteredCodes.map(
                  (code) => {
                    const campaign =
                      campaignMap.get(
                        code.promotionId,
                      );

                    return (
                      <tr
                        key={
                          code.id
                        }
                        className="hover:bg-[#151619]"
                      >
                        <td className="px-4 py-3">
                          <code className="text-[10px] font-bold tracking-[0.08em] text-[#72b2ff]">
                            {code.code}
                          </code>
                        </td>

                        <td className="px-3 py-3 text-[9px] text-zinc-300">
                          {campaign?.name ??
                            "Campagne"}
                        </td>

                        <td className="px-3 py-3 text-[8px] text-zinc-500">
                          {code.usageCount}
                          {" / "}
                          {code.usageLimit ??
                            "∞"}
                        </td>

                        <td className="px-3 py-3">
                          <span
                            className={
                              code.status ===
                              "active"
                                ? "border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[8px] font-semibold text-emerald-400"
                                : "border border-zinc-700 bg-zinc-900 px-2 py-1 text-[8px] font-semibold text-zinc-500"
                            }
                          >
                            {code.status ===
                            "active"
                              ? "Actif"
                              : "Inactif"}
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            <button
                              type="button"
                              onClick={
                                () =>
                                  editCode(
                                    code,
                                  )
                              }
                              title="Modifier"
                              className="grid size-7 place-items-center border border-[#303238] text-zinc-500 hover:text-white"
                            >
                              <Edit3
                                size={11}
                              />
                            </button>

                            <button
                              type="button"
                              disabled={
                                promotions.mutating
                              }
                              onClick={
                                () =>
                                  void promotions
                                    .setCodeStatus(
                                      code.id,
                                      code.status ===
                                        "active"
                                        ? "inactive"
                                        : "active",
                                    )
                                    .catch(
                                      () => undefined,
                                    )
                              }
                              className="h-7 border border-[#303238] px-2 text-[8px] font-semibold text-zinc-400 hover:text-white disabled:opacity-30"
                            >
                              {code.status ===
                              "active"
                                ? "Désactiver"
                                : "Activer"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  },
                )}

                {!filteredCodes.length ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-12 text-center text-[9px] text-zinc-600"
                    >
                      Aucun code promo correspondant.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {campaignForm ? (
        <div
          className="fixed inset-0 z-[10000] grid place-items-center overflow-y-auto bg-black/80 p-4 backdrop-blur-sm"
          onMouseDown={
            (event) => {
              if (
                event.target ===
                event.currentTarget &&
                !promotions.mutating
              ) {
                setCampaignForm(
                  null,
                );
              }
            }
          }
        >
          <form
            onSubmit={
              saveCampaign
            }
            className="my-8 w-full max-w-3xl border border-[#303238] bg-[#101114] shadow-2xl"
          >
            <header className="flex items-start justify-between border-b border-[#303238] p-4">
              <div>
                <p className="text-[7px] font-bold uppercase tracking-[0.12em] text-[#ed1b2f]">
                  Campagne commerciale
                </p>

                <h2 className="mt-1 text-[12px] font-semibold text-white">
                  {campaignForm.id
                    ? "Modifier la campagne"
                    : "Nouvelle campagne"}
                </h2>
              </div>

              <button
                type="button"
                disabled={
                  promotions.mutating
                }
                onClick={
                  () =>
                    setCampaignForm(
                      null,
                    )
                }
                className="grid size-8 place-items-center text-zinc-600 hover:text-white"
              >
                <X
                  size={14}
                />
              </button>
            </header>

            <div className="grid gap-4 p-4 sm:grid-cols-2">
              <label className="grid gap-1.5 sm:col-span-2">
                <span className="text-[7px] font-bold uppercase text-zinc-600">
                  Nom *
                </span>

                <input
                  required
                  value={
                    campaignForm.name
                  }
                  onChange={
                    (event) =>
                      setCampaignForm(
                        {
                          ...campaignForm,
                          name:
                            event.target.value,
                        },
                      )
                  }
                  className={fieldClass}
                />
              </label>

              <label className="grid gap-1.5 sm:col-span-2">
                <span className="text-[7px] font-bold uppercase text-zinc-600">
                  Description
                </span>

                <textarea
                  rows={3}
                  value={
                    campaignForm.description
                  }
                  onChange={
                    (event) =>
                      setCampaignForm(
                        {
                          ...campaignForm,
                          description:
                            event.target.value,
                        },
                      )
                  }
                  className="border border-[#303238] bg-[#0d0f12] p-3 text-[9px] text-zinc-300 outline-none focus:border-[#3d92ff]"
                />
              </label>

              <label className="grid gap-1.5">
                <span className="text-[7px] font-bold uppercase text-zinc-600">
                  Type de remise *
                </span>

                <select
                  value={
                    campaignForm.discountType
                  }
                  onChange={
                    (event) =>
                      setCampaignForm(
                        {
                          ...campaignForm,
                          discountType:
                            event.target.value as
                              "percent" |
                              "fixed",
                        },
                      )
                  }
                  className={fieldClass}
                >
                  <option value="percent">
                    Pourcentage
                  </option>

                  <option value="fixed">
                    Montant fixe
                  </option>
                </select>
              </label>

              <label className="grid gap-1.5">
                <span className="text-[7px] font-bold uppercase text-zinc-600">
                  Valeur *
                </span>

                <input
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={
                    campaignForm.discountValue
                  }
                  onChange={
                    (event) =>
                      setCampaignForm(
                        {
                          ...campaignForm,
                          discountValue:
                            event.target.value,
                        },
                      )
                  }
                  className={fieldClass}
                />
              </label>

              <label className="grid gap-1.5">
                <span className="text-[7px] font-bold uppercase text-zinc-600">
                  Devise
                </span>

                <input
                  value={
                    campaignForm.currency
                  }
                  maxLength={3}
                  onChange={
                    (event) =>
                      setCampaignForm(
                        {
                          ...campaignForm,
                          currency:
                            event.target.value
                              .toUpperCase(),
                        },
                      )
                  }
                  className={fieldClass}
                />
              </label>

              <label className="grid gap-1.5">
                <span className="text-[7px] font-bold uppercase text-zinc-600">
                  Statut
                </span>

                <select
                  value={
                    campaignForm.status
                  }
                  onChange={
                    (event) =>
                      setCampaignForm(
                        {
                          ...campaignForm,
                          status:
                            event.target.value as
                              PromotionStatus,
                        },
                      )
                  }
                  className={fieldClass}
                >
                  <option value="draft">
                    Brouillon
                  </option>

                  <option value="active">
                    Active
                  </option>

                  <option value="paused">
                    En pause
                  </option>
                </select>
              </label>

              <label className="grid gap-1.5">
                <span className="text-[7px] font-bold uppercase text-zinc-600">
                  Début
                </span>

                <input
                  type="datetime-local"
                  value={
                    campaignForm.startsAt
                  }
                  onChange={
                    (event) =>
                      setCampaignForm(
                        {
                          ...campaignForm,
                          startsAt:
                            event.target.value,
                        },
                      )
                  }
                  className={fieldClass}
                />
              </label>

              <label className="grid gap-1.5">
                <span className="text-[7px] font-bold uppercase text-zinc-600">
                  Fin
                </span>

                <input
                  type="datetime-local"
                  value={
                    campaignForm.endsAt
                  }
                  onChange={
                    (event) =>
                      setCampaignForm(
                        {
                          ...campaignForm,
                          endsAt:
                            event.target.value,
                        },
                      )
                  }
                  className={fieldClass}
                />
              </label>

              <label className="grid gap-1.5">
                <span className="text-[7px] font-bold uppercase text-zinc-600">
                  Minimum commande
                </span>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    campaignForm.minOrderAmount
                  }
                  onChange={
                    (event) =>
                      setCampaignForm(
                        {
                          ...campaignForm,
                          minOrderAmount:
                            event.target.value,
                        },
                      )
                  }
                  className={fieldClass}
                />
              </label>

              <label className="grid gap-1.5">
                <span className="text-[7px] font-bold uppercase text-zinc-600">
                  Plafond remise
                </span>

                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={
                    campaignForm.maxDiscountAmount
                  }
                  onChange={
                    (event) =>
                      setCampaignForm(
                        {
                          ...campaignForm,
                          maxDiscountAmount:
                            event.target.value,
                        },
                      )
                  }
                  className={fieldClass}
                />
              </label>

              <label className="grid gap-1.5 sm:col-span-2">
                <span className="text-[7px] font-bold uppercase text-zinc-600">
                  Limite totale d’utilisation
                </span>

                <input
                  type="number"
                  min="1"
                  step="1"
                  value={
                    campaignForm.usageLimit
                  }
                  onChange={
                    (event) =>
                      setCampaignForm(
                        {
                          ...campaignForm,
                          usageLimit:
                            event.target.value,
                        },
                      )
                  }
                  className={fieldClass}
                />
              </label>

              <div className="grid gap-2 sm:col-span-2">
                <div>
                  <span className="text-[7px] font-bold uppercase text-zinc-600">
                    Produits concernés
                  </span>

                  <p className="mt-1 text-[8px] text-zinc-700">
                    Aucun produit sélectionné = tout le catalogue.
                  </p>
                </div>

                <div className="max-h-52 overflow-y-auto border border-[#303238] bg-[#0d0f12]">
                  {promotions.data.products.map(
                    (product) => {
                      const selected =
                        campaignForm.productIds.includes(
                          product.id,
                        );

                      return (
                        <label
                          key={
                            product.id
                          }
                          className="flex cursor-pointer items-center gap-3 border-b border-[#25272c] px-3 py-2 last:border-b-0"
                        >
                          <input
                            type="checkbox"
                            checked={
                              selected
                            }
                            onChange={
                              () =>
                                setCampaignForm(
                                  {
                                    ...campaignForm,

                                    productIds:
                                      selected
                                        ? campaignForm.productIds.filter(
                                            (id) =>
                                              id !==
                                              product.id,
                                          )
                                        : [
                                            ...campaignForm.productIds,
                                            product.id,
                                          ],
                                  },
                                )
                            }
                          />

                          <span className="text-[9px] text-zinc-300">
                            {product.name}
                          </span>
                        </label>
                      );
                    },
                  )}

                  {!promotions.data.products.length ? (
                    <p className="p-4 text-[8px] text-zinc-600">
                      Aucun produit dans le catalogue.
                    </p>
                  ) : null}
                </div>
              </div>

              {formError ? (
                <div
                  role="alert"
                  className="border border-blue-500/30 bg-blue-500/5 px-3 py-2 text-[9px] text-blue-400 sm:col-span-2"
                >
                  {formError}
                </div>
              ) : null}
            </div>

            <footer className="flex justify-end gap-2 border-t border-[#303238] p-3">
              <button
                type="button"
                disabled={
                  promotions.mutating
                }
                onClick={
                  () =>
                    setCampaignForm(
                      null,
                    )
                }
                className="h-8 border border-[#303238] px-3 text-[8px] font-semibold text-zinc-500 hover:text-white"
              >
                Annuler
              </button>

              <button
                type="submit"
                disabled={
                  promotions.mutating
                }
                className="h-8 border border-[#ed1b2f] bg-[#ed1b2f] px-4 text-[8px] font-semibold text-white hover:bg-[#ff3045] disabled:opacity-40"
              >
                {promotions.mutating
                  ? "Enregistrement…"
                  : "Enregistrer"}
              </button>
            </footer>
          </form>
        </div>
      ) : null}

      {codeForm ? (
        <div
          className="fixed inset-0 z-[10000] grid place-items-center bg-black/80 p-4 backdrop-blur-sm"
          onMouseDown={
            (event) => {
              if (
                event.target ===
                event.currentTarget &&
                !promotions.mutating
              ) {
                setCodeForm(
                  null,
                );
              }
            }
          }
        >
          <form
            onSubmit={
              saveCode
            }
            className="w-full max-w-lg border border-[#303238] bg-[#101114] shadow-2xl"
          >
            <header className="flex items-start justify-between border-b border-[#303238] p-4">
              <div>
                <p className="text-[7px] font-bold uppercase tracking-[0.12em] text-[#ed1b2f]">
                  Code promotionnel
                </p>

                <h2 className="mt-1 text-[12px] font-semibold text-white">
                  {codeForm.id
                    ? "Modifier le code"
                    : "Nouveau code"}
                </h2>
              </div>

              <button
                type="button"
                disabled={
                  promotions.mutating
                }
                onClick={
                  () =>
                    setCodeForm(
                      null,
                    )
                }
                className="grid size-8 place-items-center text-zinc-600 hover:text-white"
              >
                <X
                  size={14}
                />
              </button>
            </header>

            <div className="grid gap-4 p-4">
              <label className="grid gap-1.5">
                <span className="text-[7px] font-bold uppercase text-zinc-600">
                  Campagne *
                </span>

                <select
                  required
                  value={
                    codeForm.promotionId
                  }
                  onChange={
                    (event) =>
                      setCodeForm(
                        {
                          ...codeForm,
                          promotionId:
                            event.target.value,
                        },
                      )
                  }
                  className={fieldClass}
                >
                  <option value="">
                    Sélectionner...
                  </option>

                  {promotions.data.campaigns
                    .filter(
                      (campaign) =>
                        campaign.status !==
                        "archived",
                    )
                    .map(
                      (campaign) => (
                        <option
                          key={
                            campaign.id
                          }
                          value={
                            campaign.id
                          }
                        >
                          {campaign.name}
                        </option>
                      ),
                    )}
                </select>
              </label>

              <label className="grid gap-1.5">
                <span className="text-[7px] font-bold uppercase text-zinc-600">
                  Code *
                </span>

                <input
                  required
                  value={
                    codeForm.code
                  }
                  onChange={
                    (event) =>
                      setCodeForm(
                        {
                          ...codeForm,
                          code:
                            event.target.value
                              .toUpperCase(),
                        },
                      )
                  }
                  className={fieldClass}
                />
              </label>

              <label className="grid gap-1.5">
                <span className="text-[7px] font-bold uppercase text-zinc-600">
                  Limite d’utilisation
                </span>

                <input
                  type="number"
                  min="1"
                  step="1"
                  value={
                    codeForm.usageLimit
                  }
                  onChange={
                    (event) =>
                      setCodeForm(
                        {
                          ...codeForm,
                          usageLimit:
                            event.target.value,
                        },
                      )
                  }
                  className={fieldClass}
                />
              </label>

              <label className="grid gap-1.5">
                <span className="text-[7px] font-bold uppercase text-zinc-600">
                  Statut
                </span>

                <select
                  value={
                    codeForm.status
                  }
                  onChange={
                    (event) =>
                      setCodeForm(
                        {
                          ...codeForm,

                          status:
                            event.target.value as
                              "active" |
                              "inactive",
                        },
                      )
                  }
                  className={fieldClass}
                >
                  <option value="active">
                    Actif
                  </option>

                  <option value="inactive">
                    Inactif
                  </option>
                </select>
              </label>

              {formError ? (
                <div
                  role="alert"
                  className="border border-blue-500/30 bg-blue-500/5 px-3 py-2 text-[9px] text-blue-400"
                >
                  {formError}
                </div>
              ) : null}
            </div>

            <footer className="flex justify-end gap-2 border-t border-[#303238] p-3">
              <button
                type="button"
                disabled={
                  promotions.mutating
                }
                onClick={
                  () =>
                    setCodeForm(
                      null,
                    )
                }
                className="h-8 border border-[#303238] px-3 text-[8px] font-semibold text-zinc-500 hover:text-white"
              >
                Annuler
              </button>

              <button
                type="submit"
                disabled={
                  promotions.mutating
                }
                className="h-8 border border-[#ed1b2f] bg-[#ed1b2f] px-4 text-[8px] font-semibold text-white hover:bg-[#ff3045] disabled:opacity-40"
              >
                {promotions.mutating
                  ? "Enregistrement…"
                  : "Enregistrer"}
              </button>
            </footer>
          </form>
        </div>
      ) : null}
    </div>
  );
}
