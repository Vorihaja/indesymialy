"use client";

import Link from "next/link";
import IndesyDualOrbitLoader from "@/components/loading/IndesyDualOrbitLoader";
import { useIndesyDialog } from "@/components/ui/indesy-dialog";
import { useAuth } from "@/modules/auth/hooks";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { CheckoutForm } from "../components/CheckoutForm";
import { useOrders } from "../hooks";

import type {
  MarketplaceOrder,
  OrderStatus,
  PaymentStatus,
} from "../types";


const orderStatusLabels:
  Record<
    OrderStatus,
    string
  > = {
  draft: "Brouillon",
  pending: "En attente",
  confirmed: "Confirmée",
  prepared: "Préparée",
  ready_for_pickup:
    "Prête au retrait",
  shipped: "Expédiée",
  delivered: "Livrée",
  cancelled: "Annulée",
  refunded: "Remboursée",
};


const paymentStatusLabels:
  Record<
    PaymentStatus,
    string
  > = {
  unpaid: "Non payé",
  pending: "Paiement en attente",
  paid: "Payé",
  failed: "Paiement échoué",
  refunded: "Remboursé",
};


const transitionLabels:
  Partial<
    Record<
      OrderStatus,
      string
    >
  > = {
  confirmed:
    "Confirmer la commande",

  prepared:
    "Marquer comme préparée",

  ready_for_pickup:
    "Prête au retrait",

  shipped:
    "Marquer comme expédiée",

  delivered:
    "Marquer comme livrée",

  cancelled:
    "Annuler la commande",
};


const sellerTransitions:
  Record<
    OrderStatus,
    OrderStatus[]
  > = {

  draft: [],

  pending: [
    "confirmed",
    "cancelled",
  ],

  confirmed: [
    "prepared",
    "shipped",
    "cancelled",
  ],

  prepared: [
    "ready_for_pickup",
    "shipped",
    "cancelled",
  ],

  ready_for_pickup: [
    "delivered",
    "cancelled",
  ],

  shipped: [
    "delivered",
  ],

  delivered: [],

  cancelled: [],

  refunded: [],
};


const payableOrderStatuses:
  OrderStatus[] = [

  "pending",

  "confirmed",

  "prepared",

  "ready_for_pickup",

  "shipped",

  "delivered",
];


function orderStatusClass(
  status: OrderStatus
) {

  if (
    status === "delivered"
  ) {

    return (
      "border-emerald-500/30 " +
      "bg-emerald-500/10 " +
      "text-emerald-300"
    );
  }


  if (
    status === "cancelled" ||
    status === "refunded"
  ) {

    return (
      "border-red-500/30 " +
      "bg-red-500/10 " +
      "text-red-300"
    );
  }


  if (
    status === "pending"
  ) {

    return (
      "border-amber-500/30 " +
      "bg-amber-500/10 " +
      "text-amber-300"
    );
  }


  return (
    "border-[#3d92ff]/30 " +
    "bg-[#3d92ff]/10 " +
    "text-[#72b2ff]"
  );
}


function paymentStatusClass(
  status: PaymentStatus
) {

  if (
    status === "paid"
  ) {

    return (
      "border-emerald-500/30 " +
      "bg-emerald-500/10 " +
      "text-emerald-300"
    );
  }


  if (
    status === "failed"
  ) {

    return (
      "border-red-500/30 " +
      "bg-red-500/10 " +
      "text-red-300"
    );
  }


  if (
    status === "refunded"
  ) {

    return (
      "border-violet-500/30 " +
      "bg-violet-500/10 " +
      "text-violet-300"
    );
  }


  return (
    "border-amber-500/30 " +
    "bg-amber-500/10 " +
    "text-amber-300"
  );
}


function StatusBadge({
  status,
}: {
  status: OrderStatus;
}) {

  return (
    <span
      className={
        "inline-flex h-6 items-center " +
        "border px-2 text-[8px] " +
        "font-semibold uppercase " +
        "tracking-[0.08em] " +
        orderStatusClass(status)
      }
    >
      {orderStatusLabels[status]}
    </span>
  );
}


function PaymentBadge({
  status,
}: {
  status: PaymentStatus;
}) {

  return (
    <span
      className={
        "inline-flex h-6 items-center " +
        "border px-2 text-[8px] " +
        "font-semibold uppercase " +
        "tracking-[0.08em] " +
        paymentStatusClass(status)
      }
    >
      {paymentStatusLabels[status]}
    </span>
  );
}


export function OrdersFeature({
  mode = "list",
  orderId,
  seller = false,
}: {
  mode?:
    | "list"
    | "detail"
    | "checkout";

  orderId?: string;

  seller?: boolean;
}) {

  const dialog =
    useIndesyDialog();

  const auth = useAuth();

  const data =
    useOrders(seller);


  const [
    order,
    setOrder,
  ] =
    useState<
      MarketplaceOrder | null
    >(null);

  const [detailLoading, setDetailLoading] = useState(Boolean(orderId));
  const loadOrder = data.detail;


  const [
    acting,
    setActing,
  ] =
    useState(false);


  const [
    actionError,
    setActionError,
  ] =
    useState<
      string | null
    >(null);


  const [
    providerReference,
    setProviderReference,
  ] =
    useState("");


  useEffect(
    () => {

      if (!orderId) {
        return;
      }


      void loadOrder(orderId)
        .then(setOrder)
        .catch(() => setOrder(null))
        .finally(() => setDetailLoading(false));

    },
    [
      orderId,
      loadOrder,
    ]
  );


  const nextStatuses =
    useMemo(
      () =>
        order
          ? sellerTransitions[
              order.status
            ]
          : [],
      [
        order,
      ]
    );


  const paymentCanBeConfirmed =
    Boolean(
      seller &&
      order?.paymentId &&
      (
        order.paymentStatus ===
          "pending" ||
        order.paymentStatus ===
          "unpaid"
      ) &&
      payableOrderStatuses.includes(
        order.status
      )
    );


  async function reloadOrder() {

    if (!orderId) {
      return;
    }


    const refreshed =
      await data.detail(
        orderId
      );


    setOrder(
      refreshed
    );
  }


  async function transition(
    nextStatus: OrderStatus
  ) {

    if (!order) {
      return;
    }


    if (
      nextStatus === "cancelled"
    ) {

      const confirmed =
        await dialog.confirm({
          title:
            "Annuler cette commande ?",
          description:
            "La réservation de stock encore active sera libérée.",
          confirmLabel:
            "Annuler la commande",
          cancelLabel:
            "Conserver",
          tone: "danger",
        });


      if (!confirmed) {
        return;
      }
    }


    try {

      setActing(true);

      setActionError(null);


      const reason =
        nextStatus === "cancelled"
          ? "Annulation depuis la gestion vendeur Indesy Bazar"
          : (
              "Transition vendeur vers " +
              orderStatusLabels[
                nextStatus
              ]
            );


      await data.updateStatus(
        order.id,
        nextStatus,
        reason
      );


      await reloadOrder();

    } catch (reason) {

      setActionError(
        reason instanceof Error
          ? reason.message
          : "Impossible de modifier la commande."
      );

    } finally {

      setActing(false);
    }
  }


  async function confirmPayment() {

    if (
      !order?.paymentId
    ) {

      setActionError(
        "Aucune tentative de paiement exploitable n’est liée à cette commande."
      );

      return;
    }


    try {

      setActing(true);

      setActionError(null);


      await data.confirmPaymentPaid(
        order.paymentId,
        providerReference.trim() ||
          undefined,
        "Paiement confirmé depuis la gestion vendeur Indesy Bazar"
      );


      setProviderReference("");


      await reloadOrder();

    } catch (reason) {

      setActionError(
        reason instanceof Error
          ? reason.message
          : "Impossible de confirmer le paiement."
      );

    } finally {

      setActing(false);
    }
  }

  if (auth.loading) {
    return <p className="p-5 text-sm text-zinc-500">Chargement de la session…</p>;
  }

  if (!seller && !auth.authenticated) {
    return (
      <main className="grid min-h-72 place-items-center p-5 text-center">
        <div>
          <h1 className="text-lg font-semibold">Connexion requise</h1>
          <p className="mt-2 text-sm text-zinc-500">Connectez-vous pour consulter uniquement vos commandes.</p>
          <Link href="/auth" className="mt-4 inline-flex bg-[#c82335] px-4 py-2 text-sm font-semibold text-white">Se connecter</Link>
        </div>
      </main>
    );
  }


  if (
    mode === "checkout"
  ) {

    return (
      <main
        className={
          "mx-auto max-w-4xl " +
          "bg-[#090a0c] " +
          "px-3 py-5 sm:px-5"
        }
      >
        <header
          className={
            "mb-4 border-b " +
            "border-[#303238] pb-3"
          }
        >
          <span
            className={
              "text-[7px] font-bold " +
              "uppercase tracking-[0.14em] " +
              "text-[#3d92ff]"
            }
          >
            Indesy Bazar
          </span>

          <h1
            className={
              "mt-1 text-xl " +
              "font-semibold text-zinc-100"
            }
          >
            Finaliser la commande
          </h1>
        </header>

        <CheckoutForm
          onSubmit={
            async (
              input
            ) => {

              await data.checkout(
                input
              );
            }
          }
        />
      </main>
    );
  }


  if (
    data.loading &&
    mode === "list"
  ) {
    return (
      <div className="min-h-52">
        <IndesyDualOrbitLoader
          variant="data"
          label="Chargement des commandes"
        />
      </div>
    );
  }


  if (
    mode === "detail"
  ) {

    if (detailLoading) {
      return <div className="min-h-52"><IndesyDualOrbitLoader variant="data" label="Chargement de la commande" /></div>;
    }

    if (!order) {

      return (
        <p role={data.error ? "alert" : undefined} className="p-5 text-sm text-zinc-500">
          {data.error ?? "Commande introuvable ou inaccessible."}
        </p>
      );
    }


    return (
      <main
        className={
          "mx-auto max-w-6xl " +
          "bg-[#090a0c] " +
          "px-3 py-5 text-zinc-100 " +
          "sm:px-5"
        }
      >
        <header
          className={
            "mb-4 flex flex-col gap-3 " +
            "border-b border-[#303238] " +
            "pb-4 md:flex-row " +
            "md:items-end " +
            "md:justify-between"
          }
        >
          <div>
            <span
              className={
                "text-[7px] font-bold " +
                "uppercase tracking-[0.14em] " +
                "text-[#3d92ff]"
              }
            >
              Commande
            </span>

            <h1
              className={
                "mt-1 break-all " +
                "text-lg font-semibold"
              }
            >
              {order.id}
            </h1>

            <p
              className={
                "mt-2 text-[9px] " +
                "text-zinc-500"
              }
            >
              {order.customerName}
              {" · "}
              {order.fulfillment ===
              "pickup"
                ? "Retrait"
                : "Livraison"}
              {" · "}
              {order.total.toLocaleString()}
              {" Ar"}
            </p>
          </div>

          <div
            className={
              "flex flex-wrap gap-2"
            }
          >
            <StatusBadge
              status={
                order.status
              }
            />

            <PaymentBadge
              status={
                order.paymentStatus
              }
            />
          </div>
        </header>


        {(actionError || data.error) && (
          <div
            className={
              "mb-4 border " +
              "border-red-500/30 " +
              "bg-red-500/10 " +
              "px-3 py-2 text-[9px] " +
              "text-red-300"
            }
          >
            {actionError ?? data.error}
          </div>
        )}


        <section
          className={
            "grid gap-4 lg:grid-cols-[1.4fr_0.6fr]"
          }
        >
          <div
            className={
              "border border-[#292c31] " +
              "bg-[#111216]"
            }
          >
            <div
              className={
                "border-b border-[#292c31] " +
                "px-4 py-3"
              }
            >
              <h2
                className={
                  "text-[10px] font-semibold"
                }
              >
                Articles
              </h2>
            </div>

            <div>
              {order.lines.map(
                (
                  line
                ) => (
                  <div
                    key={line.id}
                    className={
                      "flex items-center " +
                      "justify-between gap-4 " +
                      "border-b " +
                      "border-[#22252a] " +
                      "px-4 py-3 " +
                      "last:border-b-0"
                    }
                  >
                    <div>
                      <strong
                        className={
                          "block text-[9px] " +
                          "font-semibold"
                        }
                      >
                        {line.title}
                      </strong>

                      <span
                        className={
                          "mt-1 block " +
                          "text-[8px] " +
                          "text-zinc-500"
                        }
                      >
                        {line.quantity}
                        {" × "}
                        {line.unitPrice.toLocaleString()}
                        {" Ar"}
                      </span>
                    </div>

                    <strong
                      className={
                        "text-[9px] " +
                        "text-zinc-200"
                      }
                    >
                      {line.total.toLocaleString()}
                      {" Ar"}
                    </strong>
                  </div>
                )
              )}
            </div>
          </div>


          <aside
            className={
              "space-y-4"
            }
          >
            <section className="border border-[#292c31] bg-[#111216] p-4">
              <h2 className="mb-3 text-[10px] font-semibold">Remise</h2>
              <div className="space-y-2 text-[8px] text-zinc-400">
                <div className="flex justify-between gap-3"><span>Mode</span><strong className="text-zinc-200">{order.fulfillment === "pickup" ? "Retrait" : "Livraison"}</strong></div>
                {order.delivery && <div className="flex justify-between gap-3"><span>État réel</span><strong className="text-zinc-200">{order.delivery.status}</strong></div>}
                {order.address && <p className="border-t border-[#292c31] pt-2 text-zinc-500">{order.address}</p>}
                {!order.delivery && <p className="text-zinc-600">Aucun suivi de remise persisté.</p>}
              </div>
            </section>

            <section
              className={
                "border border-[#292c31] " +
                "bg-[#111216] p-4"
              }
            >
              <h2
                className={
                  "mb-3 text-[10px] " +
                  "font-semibold"
                }
              >
                Paiement
              </h2>

              <div
                className={
                  "space-y-2 text-[8px] " +
                  "text-zinc-400"
                }
              >
                <div
                  className={
                    "flex justify-between gap-3"
                  }
                >
                  <span>Méthode</span>

                  <strong
                    className={
                      "text-zinc-200"
                    }
                  >
                    {order.paymentMethod.label}
                  </strong>
                </div>

                <div
                  className={
                    "flex justify-between gap-3"
                  }
                >
                  <span>État</span>

                  <strong
                    className={
                      "text-zinc-200"
                    }
                  >
                    {
                      paymentStatusLabels[
                        order.paymentStatus
                      ]
                    }
                  </strong>
                </div>
              </div>


              {seller &&
                paymentCanBeConfirmed && (
                  <div
                    className={
                      "mt-4 border-t " +
                      "border-[#292c31] pt-4"
                    }
                  >
                    {order.paymentMethod.type !==
                      "cash" && (
                      <label
                        className={
                          "mb-3 block"
                        }
                      >
                        <span
                          className={
                            "mb-1 block " +
                            "text-[7px] " +
                            "uppercase " +
                            "tracking-[0.1em] " +
                            "text-zinc-500"
                          }
                        >
                          Référence fournisseur
                        </span>

                        <input
                          value={
                            providerReference
                          }
                          onChange={
                            (
                              event
                            ) =>
                              setProviderReference(
                                event.target.value
                              )
                          }
                          placeholder="Optionnelle"
                          className={
                            "h-9 w-full border " +
                            "border-[#34373d] " +
                            "bg-[#0b0c0f] px-3 " +
                            "text-[9px] " +
                            "text-zinc-200 " +
                            "outline-none " +
                            "focus:border-[#3d92ff]"
                          }
                        />
                      </label>
                    )}


                    <button
                      type="button"
                      disabled={acting}
                      onClick={
                        () =>
                          void confirmPayment()
                      }
                      className={
                        "inline-flex h-9 w-full " +
                        "items-center " +
                        "justify-center " +
                        "bg-emerald-500 px-3 " +
                        "text-[8px] font-bold " +
                        "uppercase " +
                        "tracking-[0.08em] " +
                        "text-black " +
                        "hover:bg-emerald-400 " +
                        "disabled:cursor-not-allowed " +
                        "disabled:opacity-50"
                      }
                    >
                      {acting
                        ? "Traitement…"
                        : "Confirmer le paiement"}
                    </button>
                  </div>
                )}


              {seller &&
                !order.paymentId &&
                order.paymentStatus !==
                  "paid" && (
                  <p
                    className={
                      "mt-3 text-[8px] " +
                      "text-zinc-600"
                    }
                  >
                    Aucune tentative de paiement
                    exploitable n’est disponible
                    pour cette commande.
                  </p>
                )}
            </section>


            {seller && (
              <section
                className={
                  "border border-[#292c31] " +
                  "bg-[#111216] p-4"
                }
              >
                <h2
                  className={
                    "mb-3 text-[10px] " +
                    "font-semibold"
                  }
                >
                  Actions commande
                </h2>


                {nextStatuses.length ? (
                  <div
                    className={
                      "grid gap-2"
                    }
                  >
                    {nextStatuses.map(
                      (
                        nextStatus
                      ) => {

                        const destructive =
                          nextStatus ===
                          "cancelled";


                        return (
                          <button
                            key={
                              nextStatus
                            }
                            type="button"
                            disabled={
                              acting
                            }
                            onClick={
                              () =>
                                void transition(
                                  nextStatus
                                )
                            }
                            className={
                              destructive
                                ? (
                                    "h-9 border " +
                                    "border-red-500/40 " +
                                    "bg-red-500/10 " +
                                    "px-3 text-[8px] " +
                                    "font-semibold " +
                                    "text-red-300 " +
                                    "hover:bg-red-500/20 " +
                                    "disabled:opacity-50"
                                  )
                                : (
                                    "h-9 border " +
                                    "border-[#34373d] " +
                                    "bg-[#17191d] " +
                                    "px-3 text-[8px] " +
                                    "font-semibold " +
                                    "text-zinc-200 " +
                                    "hover:border-[#3d92ff]/60 " +
                                    "hover:bg-[#3d92ff]/10 " +
                                    "disabled:opacity-50"
                                  )
                            }
                          >
                            {
                              transitionLabels[
                                nextStatus
                              ] ??
                              orderStatusLabels[
                                nextStatus
                              ]
                            }
                          </button>
                        );
                      }
                    )}
                  </div>
                ) : (
                  <p
                    className={
                      "text-[8px] " +
                      "text-zinc-600"
                    }
                  >
                    Aucune transition vendeur
                    disponible depuis cet état.
                  </p>
                )}
              </section>
            )}
          </aside>
        </section>


        <section
          className={
            "mt-4 border " +
            "border-[#292c31] " +
            "bg-[#111216]"
          }
        >
          <div
            className={
              "border-b border-[#292c31] " +
              "px-4 py-3"
            }
          >
            <h2
              className={
                "text-[10px] font-semibold"
              }
            >
              Historique
            </h2>
          </div>

          <div
            className={
              "divide-y divide-[#22252a]"
            }
          >
            {order.statusHistory.map(
              (
                entry,
                index
              ) => (
                <div
                  key={
                    `${entry.changedAt}-${index}`
                  }
                  className={
                    "flex flex-col gap-1 " +
                    "px-4 py-3 sm:flex-row " +
                    "sm:items-center " +
                    "sm:justify-between"
                  }
                >
                  <div>
                    <strong
                      className={
                        "text-[8px] " +
                        "font-semibold " +
                        "text-zinc-300"
                      }
                    >
                      {
                        orderStatusLabels[
                          entry.status
                        ]
                      }
                    </strong>

                    {entry.note && (
                      <p
                        className={
                          "mt-1 text-[8px] " +
                          "text-zinc-500"
                        }
                      >
                        {entry.note}
                      </p>
                    )}
                  </div>

                  <time
                    className={
                      "text-[7px] " +
                      "text-zinc-600"
                    }
                  >
                    {new Date(
                      entry.changedAt
                    ).toLocaleString(
                      "fr-FR"
                    )}
                  </time>
                </div>
              )
            )}


            {!order.statusHistory.length && (
              <p
                className={
                  "px-4 py-5 " +
                  "text-[8px] " +
                  "text-zinc-600"
                }
              >
                Aucun historique.
              </p>
            )}
          </div>
        </section>
      </main>
    );
  }


  return (
    <main
      className={
        "mx-auto max-w-7xl " +
        "bg-[#090a0c] " +
        "px-3 py-5 text-zinc-100 " +
        "sm:px-5"
      }
    >
      <header
        className={
          "mb-4 border-b " +
          "border-[#303238] pb-3"
        }
      >
        <span
          className={
            "text-[7px] font-bold " +
            "uppercase tracking-[0.14em] " +
            "text-[#3d92ff]"
          }
        >
          Indesy Bazar
        </span>

        <h1
          className={
            "mt-1 text-xl " +
            "font-semibold"
          }
        >
          Commandes
        </h1>
      </header>

      {data.error && (
        <p role="alert" className="mb-4 border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {data.error}
        </p>
      )}

      <div
        className={
          "overflow-x-auto border " +
          "border-[#292c31] " +
          "bg-[#111216]"
        }
      >
        <table
          className={
            "w-full min-w-[760px] " +
            "text-left"
          }
        >
          <thead
            className={
              "border-b border-[#292c31] " +
              "bg-[#15171b]"
            }
          >
            <tr
              className={
                "text-[7px] font-semibold " +
                "uppercase " +
                "tracking-[0.1em] " +
                "text-zinc-600"
              }
            >
              <th className="h-9 px-3">
                Commande
              </th>

              <th className="px-3">
                Client
              </th>

              <th className="px-3">
                Créée le
              </th>

              <th className="px-3">
                Total
              </th>

              <th className="px-3">
                Commande
              </th>

              <th className="px-3">
                Paiement
              </th>
            </tr>
          </thead>

          <tbody>
            {data.orders.map(
              (
                item
              ) => (
                <tr
                  key={item.id}
                  className={
                    "border-b " +
                    "border-[#292c31] " +
                    "text-[8px] " +
                    "text-zinc-400 " +
                    "last:border-b-0 " +
                    "hover:bg-white/[0.02]"
                  }
                >
                  <td
                    className={
                      "h-12 px-3"
                    }
                  >
                    <Link
                      href={
                        `${
                          seller
                            ? "/dashboard/vendeur/orders"
                            : "/marketplace/orders"
                        }/${item.id}`
                      }
                      className={
                        "font-semibold " +
                        "text-[#3d92ff] " +
                        "hover:text-[#72b2ff]"
                      }
                    >
                      {item.id}
                    </Link>
                  </td>

                  <td className="px-3">
                    {item.customerName}
                  </td>

                  <td className="px-3">
                    {new Date(item.createdAt).toLocaleDateString("fr-FR")}
                  </td>

                  <td
                    className={
                      "px-3 font-semibold " +
                      "text-zinc-200"
                    }
                  >
                    {item.total.toLocaleString()}
                    {" Ar"}
                  </td>

                  <td className="px-3">
                    <StatusBadge
                      status={
                        item.status
                      }
                    />
                  </td>

                  <td className="px-3">
                    <PaymentBadge
                      status={
                        item.paymentStatus
                      }
                    />
                  </td>
                </tr>
              )
            )}


            {!data.orders.length && (
              <tr>
                <td
                  colSpan={6}
                  className={
                    "p-8 text-center " +
                    "text-[9px] text-zinc-600"
                  }
                >
                  Aucune commande.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
