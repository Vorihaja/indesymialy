
"use client";

import {
  useMemo,
  useState,
} from "react";
import {
  CalendarDays,
  ChevronDown,
  CircleCheckBig,
  DatabaseZap,
  Loader2,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Swords,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import {
  useOrganizerDashboard,
} from "@/modules/organizer-operations/hooks/useOrganizerOperations";
import {
  OrganizerDialog,
  OrganizerToast,
  organizerButtonClass,
  organizerPrimaryButtonClass,
  type OrganizerToastState,
} from "../../components/OrganizerFeedback";
import {
  RealModuleDataView,
} from "../../components/RealModuleDataView";
import {
  FightCardBoard,
} from "../components/FightCardBoard";
import {
  FightCardEditor,
} from "../components/FightCardEditor";
import {
  FightConfigurationEditor,
} from "../components/FightConfigurationEditor";
import {
  FightReadinessBoard,
} from "../components/FightReadinessBoard";
import {
  FightWeighInWorkspace,
} from "../weigh-ins/components/FightWeighInWorkspace";
import {
  FightOfficialsWorkspace,
} from "../officials/components/FightOfficialsWorkspace";
import {
  useFightCenter,
} from "../hooks/useFightCenter";
import {
  useOperationalFights,
} from "../hooks/useOperationalFights";
import type {
  FightCardDraft,
  FightCardItem,
  FightCardMoveDirection,
  OperationalFightDraft,
  OperationalFightItem,
} from "../types";

const FIGHT_CARD_TAB = "fight-card";
const COMBATS_TAB = "fights";
const WEIGH_IN_TAB = "weigh-in";
const OFFICIALS_TAB = "officials";
const REAL_PROJECTION_TABS = new Set([
  "fighters",
  "replacements",
  "results",
]);

function fightCenterTabLabel(value: string) {
  switch (value) {
    case "fighters":
      return "Combattants";
    case "replacements":
      return "Remplacements";
    case "results":
      return "Résultats";
    default:
      return value;
  }
}

function formatEventDate(
  value: string | null,
) {
  if (!value) {
    return "Date à définir";
  }

  const parsed = new Date(value);

  if (
    Number.isNaN(
      parsed.getTime(),
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "fr-FR",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  ).format(parsed);
}

function readableStatus(
  value: string,
) {
  if (value === "live") {
    return "En direct";
  }

  if (value === "today") {
    return "Aujourd’hui";
  }

  if (value === "upcoming") {
    return "À venir";
  }

  return value || "Non défini";
}

type FightCenterEvent = {
  id: string;
  name: string;
  dateLabel: string | null;
  venue: string | null;
  status: string;
};

function FightCenterEventContext({
  activeEvent,
  activeEventId,
  events,
  switchingEvent,
  onChange,
}: {
  activeEvent: FightCenterEvent;
  activeEventId: string;
  events: FightCenterEvent[];
  switchingEvent: boolean;
  onChange: (
    eventId: string,
  ) => Promise<void>;
}) {
  return (
    <section className="grid gap-px border border-[#303238] bg-[#303238] xl:grid-cols-[minmax(0,1.55fr)_minmax(310px,.65fr)]">
      <div className="bg-[#151619] p-3 sm:p-4">
        <div className="min-w-0">
          <span className="text-[8px] font-bold uppercase tracking-[0.14em] text-[#3d92ff]">
            Centre des combats · événement actif
          </span>

          <h1 className="mt-1 truncate text-[16px] font-semibold text-white">
            {activeEvent.name}
          </h1>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[9px] text-zinc-500">
            <span className="flex items-center gap-1.5">
              <CalendarDays size={12} />
              {formatEventDate(
                activeEvent.dateLabel,
              )}
            </span>

            <span className="flex items-center gap-1.5">
              <MapPin size={12} />
              {activeEvent.venue ||
                "Lieu à définir"}
            </span>

            <span className="flex items-center gap-1.5">
              <ShieldCheck size={12} />
              {readableStatus(
                activeEvent.status,
              )}
            </span>
          </div>
        </div>
      </div>

      <label className="relative grid content-center bg-[#111214] p-3 sm:p-4">
        <span className="mb-1 block text-[8px] font-bold uppercase tracking-[0.12em] text-zinc-600">
          Changer d’événement
        </span>

        <div className="relative">
          <select
            value={activeEventId}
            onChange={(event) =>
              void onChange(
                event.target.value,
              )
            }
            disabled={
              switchingEvent
            }
            className="h-10 w-full appearance-none border border-[#3a3e46] bg-[#0d0e10] pl-3 pr-9 text-[10px] font-semibold text-zinc-200 outline-none focus:border-[#087cff] disabled:opacity-50"
          >
            {events.map(
              (event) => (
                <option
                  key={event.id}
                  value={event.id}
                >
                  {event.name}
                </option>
              ),
            )}
          </select>

          <ChevronDown
            size={14}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600"
          />
        </div>

        <span className="mt-1 text-[8px] text-zinc-700">
          Ce contexte est maintenant partagé par tous les onglets du Centre des combats.
        </span>
      </label>
    </section>
  );
}

function FightCardWorkspace({
  eventId,
}: {
  eventId: string;
}) {
  const fightCenter =
    useFightCenter(eventId);

  const [
    editingCard,
    setEditingCard,
  ] =
    useState<FightCardItem | null>(
      null,
    );

  const [
    editorOpen,
    setEditorOpen,
  ] = useState(false);

  const [
    deletingCard,
    setDeletingCard,
  ] =
    useState<FightCardItem | null>(
      null,
    );

  const [
    syncDialogOpen,
    setSyncDialogOpen,
  ] = useState(false);

  const [toast, setToast] =
    useState<OrganizerToastState>(
      null,
    );

  const metrics = useMemo(() => {
    const cards =
      fightCenter.data?.cards ?? [];

    const activeCards =
      cards.filter(
        (card) =>
          card.status !==
          "cancelled",
      );

    const confirmed =
      activeCards.filter(
        (card) =>
          card.status ===
          "confirmed",
      );

    const incomplete =
      activeCards.filter(
        (card) =>
          !card.disciplineId ||
          !card.fighterRedId ||
          !card.fighterBlueId ||
          card.status !==
            "confirmed",
      );

    const synced =
      confirmed.filter(
        (card) =>
          card.syncState ===
          "synced",
      );

    const pendingSync =
      confirmed.filter(
        (card) =>
          card.syncState ===
            "not_synced" ||
          card.syncState ===
            "out_of_sync",
      );

    const protectedCards =
      confirmed.filter(
        (card) =>
          card.syncState ===
          "protected",
      );

    const mainEvent =
      activeCards.find(
        (card) =>
          card.segment ===
          "main_event",
      );

    return {
      total: activeCards.length,
      confirmed:
        confirmed.length,
      incomplete:
        incomplete.length,
      synced: synced.length,
      pendingSync:
        pendingSync.length,
      protected:
        protectedCards.length,
      mainEvent: mainEvent
        ? `${
            mainEvent.fighterRedName ??
            mainEvent.fighterRedMention ??
            "À confirmer"
          } vs ${
            mainEvent.fighterBlueName ??
            mainEvent.fighterBlueMention ??
            "À confirmer"
          }`
        : "Non défini",
    };
  }, [fightCenter.data?.cards]);

  const openCreate = () => {
    setEditingCard(null);
    setEditorOpen(true);
  };

  const openEdit = (
    card: FightCardItem,
  ) => {
    setEditingCard(card);
    setEditorOpen(true);
  };

  const save = async (
    draft: FightCardDraft,
  ) => {
    if (editingCard) {
      await fightCenter.update(
        editingCard.id,
        draft,
      );

      setToast({
        message:
          "Combat mis à jour.",
        tone: "success",
      });
    } else {
      await fightCenter.create(
        draft,
      );

      setToast({
        message:
          "Combat ajouté à la carte des combats.",
        tone: "success",
      });
    }

    setEditorOpen(false);
    setEditingCard(null);
  };

  const move = async (
    card: FightCardItem,
    direction: FightCardMoveDirection,
  ) => {
    try {
      await fightCenter.move(
        card.id,
        direction,
      );
    } catch (reason) {
      setToast({
        message:
          reason instanceof Error
            ? reason.message
            : "Impossible de déplacer le combat.",
        tone: "error",
      });
    }
  };

  const remove = async () => {
    if (!deletingCard) {
      return;
    }

    try {
      await fightCenter.remove(
        deletingCard.id,
      );

      setToast({
        message:
          "Combat retiré de la carte des combats.",
        tone: "success",
      });

      setDeletingCard(null);
    } catch (reason) {
      setToast({
        message:
          reason instanceof Error
            ? reason.message
            : "Impossible de supprimer le combat.",
        tone: "error",
      });
    }
  };

  const syncConfirmed = async () => {
    try {
      const result =
        await fightCenter.syncConfirmed();

      const configurationMessage =
        result.needsConfiguration > 0
          ? ` ${result.needsConfiguration} combat${result.needsConfiguration > 1 ? "s" : ""} nécessite${result.needsConfiguration > 1 ? "nt" : ""} encore une configuration dans l’onglet Combats.`
          : "";

      setToast({
        message: `Synchronisation terminée : ${result.created} créé${result.created > 1 ? "s" : ""}, ${result.updated} mis à jour, ${result.unchanged} déjà synchronisé${result.unchanged > 1 ? "s" : ""}.${configurationMessage}`,
        tone: "success",
      });

      setSyncDialogOpen(false);
    } catch (reason) {
      setToast({
        message:
          reason instanceof Error
            ? reason.message
            : "Impossible de synchroniser la carte des combats vers les combats opérationnels.",
        tone: "error",
      });
    }
  };

  return (
    <>
      <OrganizerToast
        toast={toast}
        onClose={() =>
          setToast(null)
        }
      />

      {fightCenter.error && (
        <section className="flex items-start gap-3 border border-red-500/30 bg-red-500/5 p-3">
          <TriangleAlert
            size={15}
            className="mt-0.5 text-[#ff4058]"
          />

          <div className="min-w-0">
            <strong className="block text-[10px] font-semibold text-red-200">
              Une opération de la carte des combats a échoué
            </strong>

            <p className="mt-1 break-words text-[9px] leading-5 text-red-300/70">
              {fightCenter.error}
            </p>
          </div>
        </section>
      )}

      <section className="grid grid-cols-2 gap-px overflow-hidden border border-[#303238] bg-[#303238] xl:grid-cols-4">
        <div className="bg-[#151619] p-3">
          <span className="text-[8px] font-bold uppercase tracking-[0.11em] text-zinc-600">
            Combats actifs
          </span>

          <strong className="mt-1 block font-mono text-[20px] text-white">
            {metrics.total}
          </strong>

          <span className="text-[8px] text-zinc-600">
            hors combats annulés
          </span>
        </div>

        <div className="bg-[#151619] p-3">
          <span className="text-[8px] font-bold uppercase tracking-[0.11em] text-zinc-600">
            Confirmés
          </span>

          <strong className="mt-1 block font-mono text-[20px] text-emerald-400">
            {metrics.confirmed}
          </strong>

          <span className="text-[8px] text-zinc-600">
            matchmaking validé
          </span>
        </div>

        <div className="bg-[#151619] p-3">
          <span className="text-[8px] font-bold uppercase tracking-[0.11em] text-zinc-600">
            À finaliser
          </span>

          <strong className="mt-1 block font-mono text-[20px] text-amber-400">
            {metrics.incomplete}
          </strong>

          <span className="text-[8px] text-zinc-600">
            données ou confirmation manquantes
          </span>
        </div>

        <div className="min-w-0 bg-[#151619] p-3">
          <span className="text-[8px] font-bold uppercase tracking-[0.11em] text-zinc-600">
            Combat principal
          </span>

          <strong className="mt-1 block truncate text-[10px] font-semibold text-white">
            {metrics.mainEvent}
          </strong>

          <span className="mt-1 block text-[8px] text-zinc-600">
            tête d’affiche actuelle
          </span>
        </div>
      </section>

      <section className="grid gap-px border border-[#303238] bg-[#303238] lg:grid-cols-[minmax(0,1fr)_auto]">
        <div className="flex min-w-0 items-start gap-3 bg-[#111214] p-3 sm:p-4">
          <div className="grid h-8 w-8 flex-none place-items-center border border-[#2f4c7e] bg-[#10203a] text-[#57a0ff]">
            <DatabaseZap size={15} />
          </div>

          <div className="min-w-0">
            <span className="text-[8px] font-bold uppercase tracking-[0.12em] text-[#3d92ff]">
              Passage vers Combats
            </span>

            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
              <strong className="text-[11px] font-semibold text-white">
                {metrics.synced}/{metrics.confirmed} combat{metrics.confirmed > 1 ? "s" : ""} confirmé{metrics.confirmed > 1 ? "s" : ""} synchronisé{metrics.confirmed > 1 ? "s" : ""}
              </strong>

              {metrics.synced > 0 && (
                <span className="flex items-center gap-1 text-[8px] font-semibold uppercase tracking-[0.08em] text-emerald-400">
                  <CircleCheckBig size={11} />
                  opérationnel
                </span>
              )}
            </div>

            <p className="mt-1 max-w-3xl text-[9px] leading-5 text-zinc-600">
              La synchronisation crée ou met à jour les combats opérationnels à partir des combats confirmés. Les réglages opérationnels déjà saisis restent préservés.
            </p>

            {metrics.protected > 0 && (
              <p className="mt-1 text-[9px] text-[#ff4058]">
                {metrics.protected} combat{metrics.protected > 1 ? "s" : ""} protégé{metrics.protected > 1 ? "s" : ""} par un état en direct, terminé ou publié.
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 bg-[#151619] p-3 sm:p-4">
          <button
            type="button"
            onClick={() =>
              void fightCenter.refresh()
            }
            disabled={
              fightCenter.loading ||
              fightCenter.mutating
            }
            className={
              organizerButtonClass
            }
          >
            <RefreshCw
              size={13}
              className={
                fightCenter.loading
                  ? "animate-spin"
                  : undefined
              }
            />
            Actualiser
          </button>

          <button
            type="button"
            onClick={() =>
              setSyncDialogOpen(true)
            }
            disabled={
              fightCenter.mutating ||
              metrics.confirmed === 0 ||
              metrics.protected > 0
            }
            className={
              organizerPrimaryButtonClass
            }
          >
            <DatabaseZap size={13} />
            {metrics.pendingSync > 0
              ? "Synchroniser"
              : "Vérifier la synchronisation"}
          </button>
        </div>
      </section>

      {fightCenter.loading ||
      !fightCenter.data ? (
        <section className="grid min-h-[260px] place-items-center border border-[#303238] bg-[#151619]">
          <div className="flex items-center gap-2 text-[10px] text-zinc-500">
            <Loader2
              size={15}
              className="animate-spin text-[#3d92ff]"
            />
            Chargement de la carte des combats…
          </div>
        </section>
      ) : (
        <FightCardBoard
          cards={
            fightCenter.data.cards
          }
          mutating={
            fightCenter.mutating
          }
          onCreate={openCreate}
          onEdit={openEdit}
          onDelete={
            setDeletingCard
          }
          onMove={(
            card,
            direction,
          ) =>
            void move(
              card,
              direction,
            )
          }
        />
      )}

      {fightCenter.data && (
        <FightCardEditor
          open={editorOpen}
          card={editingCard}
          fighters={
            fightCenter.data
              .fighters
          }
          disciplines={
            fightCenter.data
              .disciplines
          }
          saving={
            fightCenter.mutating
          }
          onClose={() => {
            if (
              fightCenter.mutating
            ) {
              return;
            }

            setEditorOpen(false);
            setEditingCard(null);
          }}
          onSave={save}
        />
      )}

      <OrganizerDialog
        open={syncDialogOpen}
        eyebrow="Centre des combats · synchronisation"
        title={`Synchroniser ${metrics.confirmed} combat${metrics.confirmed > 1 ? "s" : ""} confirmé${metrics.confirmed > 1 ? "s" : ""} ?`}
        description="Cette opération transforme la planification sportive confirmée en combats opérationnels utilisables par Pesée, Officiels et Combat en direct."
        onClose={() => {
          if (!fightCenter.mutating) {
            setSyncDialogOpen(false);
          }
        }}
        footer={
          <>
            <button
              type="button"
              onClick={() =>
                setSyncDialogOpen(false)
              }
              disabled={fightCenter.mutating}
              className={organizerButtonClass}
            >
              Annuler
            </button>

            <button
              type="button"
              onClick={() =>
                void syncConfirmed()
              }
              disabled={fightCenter.mutating}
              className={organizerPrimaryButtonClass}
            >
              <DatabaseZap size={13} />
              {fightCenter.mutating
                ? "Synchronisation…"
                : "Synchroniser vers Combats"}
            </button>
          </>
        }
      >
        <div className="grid gap-3 text-[10px] leading-5 text-zinc-400">
          <p>
            Pour un nouveau combat, le Centre des combats crée le combat opérationnel avec l’ordre, la discipline et les deux combattants de la carte des combats.
          </p>

          <p>
            Les nouveaux combats démarrent avec <strong className="text-zinc-300">3 reprises</strong>, le type <strong className="text-zinc-300">professionnel</strong> et le statut <strong className="text-zinc-300">planifié</strong>. La catégorie de poids est reprise des fiches combattants lorsqu’elle est cohérente ; sinon elle reste « À définir ».
          </p>

          <p className="border-l-2 border-[#087cff] bg-[#101114] px-3 py-2 text-[9px] text-zinc-500">
            Lors d’une nouvelle synchronisation, les réglages métier déjà configurés dans Combats — catégorie, reprises, type, statut, résultat — ne sont pas écrasés. Seules les données appartenant à la carte des combats sont réalignées.
          </p>
        </div>
      </OrganizerDialog>

      <OrganizerDialog
        open={Boolean(
          deletingCard,
        )}
        eyebrow="Carte des combats · suppression"
        title={
          deletingCard
            ? `Retirer le combat #${deletingCard.position} ?`
            : "Retirer ce combat ?"
        }
        description="Cette action retire uniquement le combat de la planification. Elle ne supprime pas un combat opérationnel déjà créé."
        onClose={() => {
          if (
            !fightCenter.mutating
          ) {
            setDeletingCard(null);
          }
        }}
        footer={
          <>
            <button
              type="button"
              onClick={() =>
                setDeletingCard(
                  null,
                )
              }
              disabled={
                fightCenter.mutating
              }
              className={
                organizerButtonClass
              }
            >
              Conserver
            </button>

            <button
              type="button"
              onClick={() =>
                void remove()
              }
              disabled={
                fightCenter.mutating
              }
              className={
                organizerPrimaryButtonClass
              }
            >
              <Trash2 size={13} />
              {fightCenter.mutating
                ? "Suppression…"
                : "Supprimer"}
            </button>
          </>
        }
      >
        <p className="text-[10px] leading-5 text-zinc-400">
          Les positions restantes seront renumérotées automatiquement pour conserver une carte des combats continue.
        </p>
      </OrganizerDialog>
    </>
  );
}


function OperationalFightsWorkspace({
  eventId,
  onOpenWeighIn,
}: {
  eventId: string;
  onOpenWeighIn: () => void;
}) {
  const operational =
    useOperationalFights(eventId);

  const [
    editingFight,
    setEditingFight,
  ] =
    useState<OperationalFightItem | null>(
      null,
    );

  const [toast, setToast] =
    useState<OrganizerToastState>(
      null,
    );

  const save = async (
    draft: OperationalFightDraft,
  ) => {
    if (!editingFight) {
      return;
    }

    await operational.update(
      editingFight.id,
      draft,
    );

    setEditingFight(null);

    setToast({
      message:
        "Configuration du combat enregistrée. Le niveau de préparation a été recalculé.",
      tone: "success",
    });
  };

  const markReady = async (
    fight: OperationalFightItem,
  ) => {
    try {
      await operational.markReady(
        fight,
      );

      setToast({
        message: `Combat #${fight.fightOrder} validé prêt pour le Jour J.`,
        tone: "success",
      });
    } catch (reason) {
      setToast({
        message:
          reason instanceof Error
            ? reason.message
            : "Impossible de valider le combat.",
        tone: "error",
      });
    }
  };

  const returnToScheduled =
    async (
      fight: OperationalFightItem,
    ) => {
      try {
        await operational.returnToScheduled(
          fight,
        );

        setToast({
          message: `Combat #${fight.fightOrder} repassé en préparation.`,
          tone: "info",
        });
      } catch (reason) {
        setToast({
          message:
            reason instanceof Error
              ? reason.message
              : "Impossible de repasser le combat en préparation.",
          tone: "error",
        });
      }
    };

  return (
    <>
      <OrganizerToast
        toast={toast}
        onClose={() =>
          setToast(null)
        }
      />

      {operational.error && (
        <section className="flex items-start gap-3 border border-red-500/30 bg-red-500/5 p-3">
          <TriangleAlert
            size={15}
            className="mt-0.5 text-[#ff4058]"
          />

          <div className="min-w-0">
            <strong className="block text-[10px] font-semibold text-red-200">
              Le niveau de préparation des combats n’a pas pu être chargé
            </strong>

            <p className="mt-1 break-words text-[9px] leading-5 text-red-300/70">
              {operational.error}
            </p>
          </div>
        </section>
      )}

      {operational.loading &&
      !operational.data ? (
        <section className="grid min-h-[280px] place-items-center border border-[#303238] bg-[#151619]">
          <div className="flex items-center gap-2 text-[10px] text-zinc-500">
            <Loader2
              size={15}
              className="animate-spin text-[#3d92ff]"
            />
            Chargement des combats opérationnels…
          </div>
        </section>
      ) : (
        <FightReadinessBoard
          fights={
            operational.data
              ?.fights ?? []
          }
          loading={
            operational.loading
          }
          mutating={
            operational.mutating
          }
          onRefresh={() =>
            void operational.refresh()
          }
          onEdit={
            setEditingFight
          }
          onMarkReady={(
            fight,
          ) =>
            void markReady(
              fight,
            )
          }
          onReturnToScheduled={(
            fight,
          ) =>
            void returnToScheduled(
              fight,
            )
          }
          onOpenWeighIn={
            onOpenWeighIn
          }
        />
      )}

      <FightConfigurationEditor
        open={
          Boolean(
            editingFight,
          )
        }
        fight={
          editingFight
        }
        saving={
          operational.mutating
        }
        onClose={() => {
          if (
            operational.mutating
          ) {
            return;
          }

          setEditingFight(null);
        }}
        onSave={save}
      />
    </>
  );
}

export function FightCenterFeature({
  tab = FIGHT_CARD_TAB,
  onTabChange,
}: {
  tab?: string;
  onTabChange?: (tab: string) => void;
}) {
  const dashboard =
    useOrganizerDashboard();

  const activeEventId =
    dashboard.data?.context
      ?.activeEventId ?? null;

  const activeEvent = useMemo(() => {
    if (!dashboard.data) {
      return null;
    }

    return (
      dashboard.data.events.find(
        (event) =>
          event.id ===
          activeEventId,
      ) ??
      dashboard.data.events[0] ??
      null
    );
  }, [
    activeEventId,
    dashboard.data,
  ]);

  if (dashboard.loading) {
    return (
      <div className="grid min-h-[320px] place-items-center border border-[#303238] bg-[#151619]">
        <div className="flex items-center gap-2 text-[10px] text-zinc-500">
          <Loader2
            size={15}
            className="animate-spin text-[#3d92ff]"
          />
          Chargement du contexte du Centre des combats…
        </div>
      </div>
    );
  }

  if (
    dashboard.error ||
    !dashboard.data
  ) {
    return (
      <section className="border border-red-500/30 bg-[#151214] p-5">
        <div className="flex items-start gap-3">
          <TriangleAlert
            size={18}
            className="mt-0.5 text-[#ff4058]"
          />

          <div>
            <strong className="text-[11px] font-semibold text-white">
              Centre des combats indisponible
            </strong>

            <p className="mt-1 text-[9px] leading-5 text-zinc-500">
              {dashboard.error ??
                "Impossible de résoudre l’organisation active."}
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (
    !dashboard.data.events
      .length ||
    !activeEvent
  ) {
    return (
      <section className="grid min-h-[320px] place-items-center border border-[#303238] bg-[#151619] p-8 text-center">
        <div>
          <Swords
            size={24}
            className="mx-auto text-zinc-600"
          />

          <h2 className="mt-3 text-[13px] font-semibold text-white">
            Aucun événement disponible
          </h2>

          <p className="mt-1 text-[10px] text-zinc-500">
            Créez d’abord un événement dans le module Événements avant d’utiliser le Centre des combats.
          </p>
        </div>
      </section>
    );
  }

  const resolvedEventId =
    activeEventId ??
    activeEvent.id;

  return (
    <div className="grid gap-3">
      <FightCenterEventContext
        activeEvent={
          activeEvent
        }
        activeEventId={
          resolvedEventId
        }
        events={
          dashboard.data.events
        }
        switchingEvent={
          dashboard.switchingEvent
        }
        onChange={
          dashboard.switchActiveEvent
        }
      />

      {dashboard.actionError && (
        <section className="flex items-start gap-3 border border-red-500/30 bg-red-500/5 p-3">
          <TriangleAlert
            size={15}
            className="mt-0.5 text-[#ff4058]"
          />

          <div className="min-w-0">
            <strong className="block text-[10px] font-semibold text-red-200">
              Le changement d’événement a échoué
            </strong>

            <p className="mt-1 break-words text-[9px] leading-5 text-red-300/70">
              {dashboard.actionError}
            </p>
          </div>
        </section>
      )}

      {tab ===
      FIGHT_CARD_TAB ? (
        <FightCardWorkspace
          key={resolvedEventId}
          eventId={
            resolvedEventId
          }
        />
      ) : tab ===
        COMBATS_TAB ? (
        <OperationalFightsWorkspace
          key={resolvedEventId}
          eventId={
            resolvedEventId
          }
          onOpenWeighIn={() =>
            onTabChange?.(
              WEIGH_IN_TAB,
            )
          }
        />
      ) : tab ===
        WEIGH_IN_TAB ? (
        <FightWeighInWorkspace
          key={resolvedEventId}
          eventId={resolvedEventId}
        />
      ) : tab ===
        OFFICIALS_TAB ? (
        <FightOfficialsWorkspace
          key={resolvedEventId}
          eventId={resolvedEventId}
        />
      ) : REAL_PROJECTION_TABS.has(
          tab,
        ) ? (
        <section className="grid gap-2">
          <div className="flex flex-wrap items-center justify-between gap-2 border border-[#2d3036] bg-[#111214] px-3 py-2">
            <div className="min-w-0">
              <span className="text-[8px] font-bold uppercase tracking-[0.12em] text-zinc-600">
                Périmètre actif
              </span>

              <p className="mt-0.5 truncate text-[10px] font-semibold text-zinc-300">
                {fightCenterTabLabel(tab)} · {activeEvent.name}
              </p>
            </div>

            <span className="border border-[#2f4c7e] bg-[#10203a] px-2 py-1 text-[8px] font-bold uppercase tracking-[0.1em] text-[#57a0ff]">
              Événement synchronisé
            </span>
          </div>

          <RealModuleDataView
            key={`${resolvedEventId}:${tab}`}
            role="organizer"
            moduleId="fight-center"
            moduleLabel="Centre des combats"
            tab={tab}
          />
        </section>
      ) : (
        <FightCardWorkspace
          key={resolvedEventId}
          eventId={
            resolvedEventId
          }
        />
      )}
    </div>
  );
}
