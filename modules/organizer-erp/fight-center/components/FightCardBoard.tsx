'use client';

import {
  ArrowDown,
  ArrowUp,
  Edit3,
  Plus,
  Trash2,
} from 'lucide-react';
import { organizerPrimaryButtonClass } from '../../components/OrganizerFeedback';
import type {
  FightCardItem,
  FightCardMoveDirection,
  FightCardSegment,
  FightCardSyncState,
} from '../types';
import { FIGHT_CARD_SEGMENTS } from '../types';

const segmentOrder: FightCardSegment[] = [
  'main_event',
  'co_main_event',
  'main_card',
  'prelims',
];

const statusMeta = {
  confirmed: {
    label: 'Confirmé',
    className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
  },
  proposed: {
    label: 'Proposé',
    className: 'border-[#087cff]/40 bg-[#087cff]/10 text-[#3d92ff]',
  },
  cancelled: {
    label: 'Annulé',
    className: 'border-red-500/30 bg-red-500/10 text-[#ff4058]',
  },
  draft: {
    label: 'Brouillon',
    className: 'border-[#3a3e46] bg-white/[0.02] text-zinc-500',
  },
} as const;

const syncMeta: Record<
  FightCardSyncState,
  { label: string; className: string }
> = {
  planning: {
    label: 'Planification',
    className: 'border-[#343840] bg-white/[0.02] text-zinc-600',
  },
  not_synced: {
    label: 'À synchroniser',
    className: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
  },
  out_of_sync: {
    label: 'Mise à jour requise',
    className: 'border-[#087cff]/40 bg-[#087cff]/10 text-[#3d92ff]',
  },
  synced: {
    label: 'Opérationnel',
    className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
  },
  protected: {
    label: 'Combat protégé',
    className: 'border-red-500/30 bg-red-500/10 text-[#ff4058]',
  },
};

function participantName(
  name: string | null,
  mention: string | null,
) {
  return name || mention || 'À confirmer';
}

function segmentLabel(segment: FightCardSegment) {
  return (
    FIGHT_CARD_SEGMENTS.find((item) => item.value === segment)?.label ?? segment
  );
}

export function FightCardBoard({
  cards,
  mutating,
  onCreate,
  onEdit,
  onDelete,
  onMove,
}: {
  cards: FightCardItem[];
  mutating: boolean;
  onCreate: () => void;
  onEdit: (card: FightCardItem) => void;
  onDelete: (card: FightCardItem) => void;
  onMove: (card: FightCardItem, direction: FightCardMoveDirection) => void;
}) {
  if (!cards.length) {
    return (
      <section className="grid min-h-[280px] place-items-center border border-[#303238] bg-[#151619] p-8 text-center">
        <div>
          <span className="text-[8px] font-bold uppercase tracking-[0.14em] text-[#3d92ff]">
            Fight Card vide
          </span>
          <h3 className="mt-2 text-[15px] font-semibold text-white">
            Aucun combat n’est encore programmé
          </h3>
          <p className="mx-auto mt-2 max-w-xl text-[10px] leading-5 text-zinc-500">
            Ajoutez le premier matchup. Vous pourrez ensuite organiser la carte entre préliminaires, carte principale, co-main event et main event.
          </p>
          <button
            type="button"
            onClick={onCreate}
            className={`${organizerPrimaryButtonClass} mx-auto mt-5`}
          >
            <Plus size={13} />
            Ajouter le premier combat
          </button>
        </div>
      </section>
    );
  }

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="text-[8px] font-bold uppercase tracking-[0.14em] text-[#3d92ff]">
            Carte sportive
          </span>
          <h2 className="mt-0.5 text-[13px] font-semibold text-white">
            Ordre officiel de préparation
          </h2>
        </div>

        <button
          type="button"
          onClick={onCreate}
          disabled={mutating}
          className={organizerPrimaryButtonClass}
        >
          <Plus size={13} />
          Ajouter un combat
        </button>
      </div>

      {segmentOrder.map((segment) => {
        const segmentCards = cards.filter((card) => card.segment === segment);

        if (!segmentCards.length) return null;

        return (
          <section
            key={segment}
            className="overflow-hidden border border-[#303238] bg-[#111214]"
          >
            <header className="flex min-h-9 items-center justify-between border-b border-[#303238] bg-[#151619] px-3">
              <strong className="text-[9px] font-bold uppercase tracking-[0.1em] text-zinc-300">
                {segmentLabel(segment)}
              </strong>
              <span className="font-mono text-[9px] text-zinc-600">
                {segmentCards.length} combat{segmentCards.length > 1 ? 's' : ''}
              </span>
            </header>

            <div className="divide-y divide-[#292c31]">
              {segmentCards.map((card) => {
                const globalIndex = cards.findIndex((item) => item.id === card.id);
                const status = statusMeta[card.status];
                const sync = syncMeta[card.syncState];
                const complete = Boolean(
                  card.disciplineId && card.fighterRedId && card.fighterBlueId,
                );

                return (
                  <article
                    key={card.id}
                    className="grid gap-3 bg-[#121315] p-3 transition-colors hover:bg-[#15171a] lg:grid-cols-[56px_minmax(0,1fr)_112px_minmax(0,1fr)_190px] lg:items-center lg:gap-4"
                  >
                    <div className="flex items-center gap-2 lg:block">
                      <span className="text-[8px] uppercase tracking-[0.12em] text-zinc-600">
                        Combat
                      </span>
                      <strong className="block font-mono text-[18px] text-white">
                        #{card.position}
                      </strong>
                    </div>

                    <div className="min-w-0 border-l-2 border-[#ff1638] pl-3 lg:border-l-0 lg:border-r-2 lg:pl-0 lg:pr-3 lg:text-right">
                      <span className="block text-[9px] font-bold uppercase tracking-[0.12em] text-[#ff4058]">
                        Coin rouge
                      </span>
                      <strong className="mt-0.5 block truncate text-[12px] font-semibold text-zinc-100">
                        {participantName(card.fighterRedName, card.fighterRedMention)}
                      </strong>
                    </div>

                    <div className="text-left lg:text-center">
                      <span className="block text-[8px] font-bold uppercase tracking-[0.1em] text-zinc-600">
                        Discipline
                      </span>
                      <strong className="mt-0.5 inline text-[11px] font-semibold text-zinc-200">
                        {card.disciplineName ?? 'À confirmer'}
                      </strong>
                      <span className="ml-1 inline font-mono text-[9px] font-bold text-zinc-500">
                        · VS
                      </span>
                    </div>

                    <div className="min-w-0 border-l-2 border-[#087cff] pl-3">
                      <span className="block text-[9px] font-bold uppercase tracking-[0.12em] text-[#3d92ff]">
                        Coin bleu
                      </span>
                      <strong className="mt-0.5 block truncate text-[12px] font-semibold text-zinc-100">
                        {participantName(card.fighterBlueName, card.fighterBlueMention)}
                      </strong>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 lg:justify-end">
                      <span
                        className={`border px-2 py-1 text-[8px] font-bold uppercase tracking-[0.08em] ${status.className}`}
                      >
                        {status.label}
                      </span>

                      <span
                        className={`border px-2 py-1 text-[8px] font-bold uppercase tracking-[0.08em] ${sync.className}`}
                        title={
                          card.operationalFightId
                            ? `Combat opérationnel ${card.operationalFightStatus ?? 'sans statut'} · ordre ${card.operationalFightOrder ?? 'N/C'}`
                            : 'Aucun combat opérationnel lié'
                        }
                      >
                        {sync.label}
                      </span>

                      {!complete && card.status !== 'cancelled' && (
                        <span className="border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[8px] font-bold uppercase tracking-[0.08em] text-amber-400">
                          Incomplet
                        </span>
                      )}

                      <div className="ml-1 flex items-center border border-[#343840] bg-[#0d0e10]">
                        <button
                          type="button"
                          onClick={() => onMove(card, 'up')}
                          disabled={mutating || globalIndex <= 0}
                          className="grid h-7 w-7 place-items-center text-zinc-600 hover:bg-white/[0.04] hover:text-white disabled:cursor-not-allowed disabled:opacity-25"
                          aria-label={`Monter le combat ${card.position}`}
                          title="Monter"
                        >
                          <ArrowUp size={12} />
                        </button>

                        <button
                          type="button"
                          onClick={() => onMove(card, 'down')}
                          disabled={mutating || globalIndex >= cards.length - 1}
                          className="grid h-7 w-7 place-items-center border-l border-[#343840] text-zinc-600 hover:bg-white/[0.04] hover:text-white disabled:cursor-not-allowed disabled:opacity-25"
                          aria-label={`Descendre le combat ${card.position}`}
                          title="Descendre"
                        >
                          <ArrowDown size={12} />
                        </button>

                        <button
                          type="button"
                          onClick={() => onEdit(card)}
                          disabled={mutating}
                          className="grid h-7 w-7 place-items-center border-l border-[#343840] text-zinc-500 hover:bg-white/[0.04] hover:text-[#3d92ff] disabled:opacity-30"
                          aria-label={`Modifier le combat ${card.position}`}
                          title="Modifier"
                        >
                          <Edit3 size={12} />
                        </button>

                        <button
                          type="button"
                          onClick={() => onDelete(card)}
                          disabled={mutating}
                          className="grid h-7 w-7 place-items-center border-l border-[#343840] text-zinc-600 hover:bg-red-500/10 hover:text-[#ff4058] disabled:opacity-30"
                          aria-label={`Supprimer le combat ${card.position}`}
                          title="Supprimer"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
