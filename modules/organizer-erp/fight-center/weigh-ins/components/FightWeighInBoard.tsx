'use client';

import {
  CheckCircle2,
  Clock3,
  History,
  RefreshCw,
  Scale,
  ShieldCheck,
  TriangleAlert,
  XCircle,
} from 'lucide-react';
import {
  organizerButtonClass,
  organizerPrimaryButtonClass,
} from '../../../components/OrganizerFeedback';
import type {
  FightWeighInAttempt,
  FightWeighInFighter,
  FightWeighInItem,
  FightWeighInSnapshot,
} from '../types';

function statusLabel(status: string) {
  switch (status) {
    case 'compliant':
      return 'Conforme';
    case 'underweight':
      return 'Sous la limite';
    case 'overweight':
      return 'Au-dessus de la limite';
    case 'waiver':
      return 'Dérogation';
    case 'disqualified':
      return 'Disqualifié';
    default:
      return 'En attente';
  }
}

function statusClass(status: string) {
  switch (status) {
    case 'compliant':
      return 'border-emerald-500/30 bg-emerald-500/5 text-emerald-300';
    case 'underweight':
    case 'overweight':
    case 'disqualified':
      return 'border-red-500/30 bg-red-500/5 text-red-300';
    case 'waiver':
      return 'border-amber-500/30 bg-amber-500/5 text-amber-300';
    default:
      return 'border-[#343840] bg-[#111214] text-zinc-500';
  }
}

function dateTime(value: string | null) {
  if (!value) return '—';

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsed);
}

function boundsLabel(fight: FightWeighInItem) {
  const min = fight.minimumWeightKg;
  const max = fight.maximumWeightKg;

  if (min === null && max === null) {
    if (fight.boundsSource === 'open_weight') return 'Open Weight';
    if (fight.boundsSource === 'none') return 'Non applicable';
    if (fight.boundsSource === 'event_defined') return 'Limites événement';
    return 'Limites N/C';
  }

  if (min !== null && max !== null) {
    return `${fight.minInclusive ? '≥' : '>'}${min} / ${fight.maxInclusive ? '≤' : '<'}${max} kg`;
  }

  if (max !== null) {
    return `${fight.maxInclusive ? '≤' : '<'}${max} kg`;
  }

  return `${fight.minInclusive ? '≥' : '>'}${min} kg`;
}

function AttemptHistory({
  attempts,
}: {
  attempts: FightWeighInAttempt[];
}) {
  if (!attempts.length) {
    return (
      <p className="border-t border-[#272a30] pt-2 text-[8px] text-zinc-700">
        Aucune tentative enregistrée.
      </p>
    );
  }

  return (
    <details className="border-t border-[#272a30] pt-2">
      <summary className="flex cursor-pointer list-none items-center gap-1.5 text-[8px] font-bold uppercase tracking-[0.1em] text-zinc-600 hover:text-zinc-400">
        <History size={11} />
        Historique · {attempts.length} tentative{attempts.length > 1 ? 's' : ''}
      </summary>

      <div className="mt-2 grid gap-px bg-[#272a30]">
        {attempts.map((attempt) => (
          <div
            key={attempt.id}
            className="grid grid-cols-[46px_70px_minmax(0,1fr)] items-center gap-2 bg-[#0d0e10] px-2 py-2 text-[8px]"
          >
            <span className="font-mono text-zinc-600">#{attempt.attemptNumber}</span>
            <strong className="font-mono text-zinc-300">
              {attempt.measuredWeightKg === null ? '—' : `${attempt.measuredWeightKg} kg`}
            </strong>
            <span className="truncate text-zinc-600">
              {statusLabel(attempt.complianceStatus)} · {dateTime(attempt.measuredAt)}
            </span>
          </div>
        ))}
      </div>
    </details>
  );
}

function FighterWeighInPanel({
  fight,
  fighter,
  mutating,
  onMeasure,
  onWaive,
}: {
  fight: FightWeighInItem;
  fighter: FightWeighInFighter;
  mutating: boolean;
  onMeasure: (fight: FightWeighInItem, fighter: FightWeighInFighter) => void;
  onWaive: (fight: FightWeighInItem, fighter: FightWeighInFighter) => void;
}) {
  const latest = fighter.latestAttempt;
  const status = latest?.complianceStatus ?? 'pending';
  const isOutOfBounds =
    latest?.complianceStatus === 'underweight' ||
    latest?.complianceStatus === 'overweight';
  const canWaive = isOutOfBounds && fight.canMeasure;
  const attemptsExhausted = fighter.attempts.length >= 2;

  return (
    <article className="grid min-w-0 gap-3 bg-[#111214] p-3 sm:p-4">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <span
            className={
              fighter.corner === 'red'
                ? 'text-[8px] font-bold uppercase tracking-[0.12em] text-[#ff4058]'
                : 'text-[8px] font-bold uppercase tracking-[0.12em] text-[#3d92ff]'
            }
          >
            Coin {fighter.corner === 'red' ? 'rouge' : 'bleu'}
          </span>
          <strong className="mt-1 block truncate text-[11px] font-semibold text-white">
            {fighter.fullName}
          </strong>
          {fighter.nickname && (
            <span className="mt-0.5 block truncate text-[8px] text-zinc-600">
              « {fighter.nickname} »
            </span>
          )}
        </div>

        <span className={`flex flex-none items-center gap-1 border px-2 py-1 text-[8px] font-bold uppercase tracking-[0.08em] ${statusClass(status)}`}>
          {status === 'compliant' ? (
            <CheckCircle2 size={10} />
          ) : status === 'underweight' ||
            status === 'overweight' ||
            status === 'disqualified' ? (
            <XCircle size={10} />
          ) : status === 'waiver' ? (
            <ShieldCheck size={10} />
          ) : (
            <Clock3 size={10} />
          )}
          {statusLabel(status)}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-px bg-[#272a30]">
        <div className="bg-[#0d0e10] p-2">
          <span className="block text-[7px] font-bold uppercase tracking-[0.09em] text-zinc-700">
            Mesuré
          </span>
          <strong className="mt-1 block font-mono text-[11px] text-white">
            {latest?.measuredWeightKg === null || latest?.measuredWeightKg === undefined
              ? '—'
              : `${latest.measuredWeightKg} kg`}
          </strong>
        </div>
        <div className="bg-[#0d0e10] p-2">
          <span className="block text-[7px] font-bold uppercase tracking-[0.09em] text-zinc-700">
            Tentative
          </span>
          <strong className="mt-1 block font-mono text-[11px] text-zinc-300">
            {latest ? `#${latest.attemptNumber}` : '—'}
          </strong>
        </div>
        <div className="bg-[#0d0e10] p-2">
          <span className="block text-[7px] font-bold uppercase tracking-[0.09em] text-zinc-700">
            Fiche actuelle
          </span>
          <strong className="mt-1 block font-mono text-[11px] text-zinc-300">
            {fighter.currentWeightKg === null ? '—' : `${fighter.currentWeightKg} kg`}
          </strong>
        </div>
      </div>

      {latest?.notes && (
        <p className="border-l-2 border-[#343840] pl-2 text-[8px] leading-4 text-zinc-600">
          {latest.notes}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={
            !fighter.fighterId ||
            !fight.canMeasure ||
            mutating ||
            attemptsExhausted
          }
          onClick={() => onMeasure(fight, fighter)}
          className={organizerPrimaryButtonClass}
        >
          <Scale size={12} />
          {attemptsExhausted
            ? '2 tentatives atteintes'
            : latest
              ? 'Nouvelle tentative'
              : 'Enregistrer une pesée'}
        </button>

        {canWaive && (
          <button
            type="button"
            disabled={mutating}
            onClick={() => onWaive(fight, fighter)}
            className={organizerButtonClass}
          >
            <ShieldCheck size={12} />
            Dérogation
          </button>
        )}
      </div>

      <AttemptHistory attempts={fighter.attempts} />
    </article>
  );
}

export function FightWeighInBoard({
  snapshot,
  loading,
  mutating,
  onRefresh,
  onMeasure,
  onWaive,
}: {
  snapshot: FightWeighInSnapshot;
  loading: boolean;
  mutating: boolean;
  onRefresh: () => void;
  onMeasure: (fight: FightWeighInItem, fighter: FightWeighInFighter) => void;
  onWaive: (fight: FightWeighInItem, fighter: FightWeighInFighter) => void;
}) {
  return (
    <div className="grid gap-3">
      <section className="grid grid-cols-2 gap-px border border-[#303238] bg-[#303238] xl:grid-cols-5">
        <div className="bg-[#151619] p-3">
          <span className="text-[8px] font-bold uppercase tracking-[0.1em] text-zinc-600">
            Combattants
          </span>
          <strong className="mt-1 block font-mono text-[20px] text-white">
            {snapshot.totalFighters}
          </strong>
        </div>
        <div className="bg-[#151619] p-3">
          <span className="text-[8px] font-bold uppercase tracking-[0.1em] text-zinc-600">
            Conformes
          </span>
          <strong className="mt-1 block font-mono text-[20px] text-emerald-400">
            {snapshot.compliant}
          </strong>
        </div>
        <div className="bg-[#151619] p-3">
          <span className="text-[8px] font-bold uppercase tracking-[0.1em] text-zinc-600">
            Hors limite
          </span>
          <strong className="mt-1 block font-mono text-[20px] text-red-400">
            {snapshot.nonCompliant}
          </strong>
        </div>
        <div className="bg-[#151619] p-3">
          <span className="text-[8px] font-bold uppercase tracking-[0.1em] text-zinc-600">
            Dérogations
          </span>
          <strong className="mt-1 block font-mono text-[20px] text-amber-400">
            {snapshot.waived}
          </strong>
        </div>
        <div className="col-span-2 flex items-center justify-between gap-3 bg-[#151619] p-3 xl:col-span-1">
          <div>
            <span className="text-[8px] font-bold uppercase tracking-[0.1em] text-zinc-600">
              En attente
            </span>
            <strong className="mt-1 block font-mono text-[20px] text-zinc-300">
              {snapshot.pending}
            </strong>
          </div>
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading || mutating}
            className={organizerButtonClass}
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : undefined} />
            Actualiser
          </button>
        </div>
      </section>

      {!snapshot.fights.length ? (
        <section className="grid min-h-[260px] place-items-center border border-[#303238] bg-[#151619] p-8 text-center">
          <div>
            <Scale size={22} className="mx-auto text-zinc-700" />
            <h2 className="mt-3 text-[12px] font-semibold text-white">
              Aucun combat opérationnel
            </h2>
            <p className="mt-1 text-[9px] text-zinc-600">
              Synchronisez d’abord les combats confirmés depuis Fight Card.
            </p>
          </div>
        </section>
      ) : (
        snapshot.fights.map((fight) => (
          <section
            key={fight.fightId}
            className="overflow-hidden border border-[#303238] bg-[#303238]"
          >
            <header className="flex flex-wrap items-center justify-between gap-3 bg-[#151619] px-3 py-3 sm:px-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <strong className="font-mono text-[11px] text-white">
                    COMBAT #{fight.fightOrder}
                  </strong>
                  <span className="border border-[#343840] bg-[#0d0e10] px-2 py-1 text-[8px] font-bold uppercase tracking-[0.08em] text-zinc-500">
                    {fight.disciplineName}
                  </span>
                  {!fight.weighInRequired && (
                    <span className="border border-[#2f4c7e] bg-[#10203a] px-2 py-1 text-[8px] font-bold uppercase tracking-[0.08em] text-[#57a0ff]">
                      Pesée non bloquante
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[9px] text-zinc-600">
                  {fight.weightCategory || 'Catégorie non définie'} · {boundsLabel(fight)}
                </p>
              </div>

              {!fight.canMeasure && (
                <span className="flex items-center gap-1.5 text-[8px] font-semibold uppercase tracking-[0.08em] text-amber-400">
                  <TriangleAlert size={11} />
                  Pesée verrouillée · statut {fight.status}
                </span>
              )}
            </header>

            <div className="grid gap-px bg-[#303238] lg:grid-cols-2">
              <FighterWeighInPanel
                fight={fight}
                fighter={fight.fighterRed}
                mutating={mutating}
                onMeasure={onMeasure}
                onWaive={onWaive}
              />
              <FighterWeighInPanel
                fight={fight}
                fighter={fight.fighterBlue}
                mutating={mutating}
                onMeasure={onMeasure}
                onWaive={onWaive}
              />
            </div>
          </section>
        ))
      )}
    </div>
  );
}
