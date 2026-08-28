
'use client';

import Link from 'next/link';
import {
  Activity,
  CircleCheckBig,
  CircleDashed,
  ClipboardCheck,
  ExternalLink,
  Gauge,
  Pencil,
  RefreshCw,
  Scale,
  ShieldCheck,
  TriangleAlert,
  UsersRound,
} from 'lucide-react';
import {
  organizerButtonClass,
  organizerPrimaryButtonClass,
} from '../../components/OrganizerFeedback';
import type {
  FightReadinessCheck,
  OperationalFightItem,
} from '../types';

function statePresentation(
  fight: OperationalFightItem,
) {
  switch (fight.readinessState) {
    case 'ready':
      return {
        label: 'Prêt Jour J',
        className:
          'border-emerald-500/35 bg-emerald-500/10 text-emerald-400',
      };
    case 'eligible':
      return {
        label: 'Prêt à valider',
        className:
          'border-[#087cff]/50 bg-[#10203a] text-[#57a0ff]',
      };
    case 'live':
      return {
        label: 'En direct',
        className:
          'border-red-500/40 bg-red-500/10 text-[#ff4058]',
      };
    case 'completed':
      return {
        label: 'Terminé',
        className:
          'border-zinc-500/40 bg-zinc-500/10 text-zinc-300',
      };
    case 'cancelled':
      return {
        label: 'Annulé',
        className:
          'border-zinc-700 bg-zinc-900 text-zinc-600',
      };
    default:
      return {
        label: 'Incomplet',
        className:
          'border-amber-500/35 bg-amber-500/10 text-amber-400',
      };
  }
}

function CheckIcon({
  check,
}: {
  check: FightReadinessCheck;
}) {
  if (check.state === 'ready') {
    return (
      <CircleCheckBig
        size={13}
        className="text-emerald-400"
      />
    );
  }

  if (check.state === 'warning') {
    return (
      <TriangleAlert
        size={13}
        className="text-amber-400"
      />
    );
  }

  return (
    <CircleDashed
      size={13}
      className="text-[#ff4058]"
    />
  );
}

function fighterLabel(
  fullName: string,
  nickname: string | null,
) {
  if (!nickname) return fullName;
  return `${fullName} · “${nickname}”`;
}

const WEIGHT_CATEGORY_LABELS: ReadonlyArray<readonly [string, string]> = [
  ["Super Heavyweight", "Poids super-lourds"],
  ["Light Heavyweight", "Poids mi-lourds"],
  ["Super Middleweight", "Poids super-moyens"],
  ["Super Welterweight", "Poids super-mi-moyens"],
  ["Super Lightweight", "Poids super-légers"],
  ["Cruiserweight", "Poids lourds-légers"],
  ["Middleweight", "Poids moyens"],
  ["Welterweight", "Poids mi-moyens"],
  ["Lightweight", "Poids légers"],
  ["Featherweight", "Poids plumes"],
  ["Bantamweight", "Poids coqs"],
  ["Flyweight", "Poids mouches"],
  ["Strawweight", "Poids pailles"],
  ["Atomweight", "Poids atomes"],
  ["Heavyweight", "Poids lourds"],
  ["Catchweight", "Poids convenu"],
  ["Open Weight", "Toutes catégories"],
];

function weightCategoryLabel(value: string) {
  const normalized = value.trim();

  for (const [english, french] of WEIGHT_CATEGORY_LABELS) {
    if (normalized === english) {
      return french;
    }

    if (normalized.startsWith(`${english} `)) {
      return `${french}${normalized.slice(english.length)}`;
    }
  }

  return normalized;
}

function fightStatusLabel(value: string) {
  switch (value) {
    case "scheduled":
      return "Planifié";
    case "ready":
      return "Prêt";
    case "live":
      return "En direct";
    case "completed":
      return "Terminé";
    case "cancelled":
      return "Annulé";
    default:
      return "À vérifier";
  }
}

function roundsLabel(value: number | null) {
  if (!value) {
    return "—";
  }

  return `${value} reprise${value > 1 ? "s" : ""}`;
}

function weightDisplayLabel(
  fight: OperationalFightItem,
) {
  if (fight.weightCategory) {
    return weightCategoryLabel(fight.weightCategory);
  }

  switch (fight.weightPolicy.mode) {
    case 'none':
      return 'Non applicable';
    case 'open_weight':
      return 'Toutes catégories';
    case 'unconfigured':
      return 'Politique non configurée';
    default:
      return 'À définir';
  }
}

export function FightReadinessBoard({
  fights,
  loading,
  mutating,
  onRefresh,
  onEdit,
  onMarkReady,
  onReturnToScheduled,
  onOpenWeighIn,
}: {
  fights: OperationalFightItem[];
  loading: boolean;
  mutating: boolean;
  onRefresh: () => void;
  onEdit: (fight: OperationalFightItem) => void;
  onMarkReady: (fight: OperationalFightItem) => void;
  onReturnToScheduled: (fight: OperationalFightItem) => void;
  onOpenWeighIn: () => void;
}) {
  const ready = fights.filter(
    (fight) =>
      fight.readinessState === 'ready',
  ).length;
  const eligible = fights.filter(
    (fight) =>
      fight.readinessState === 'eligible',
  ).length;
  const incomplete = fights.filter(
    (fight) =>
      fight.readinessState === 'incomplete',
  ).length;
  const average = fights.length
    ? Math.round(
        fights.reduce(
          (sum, fight) =>
            sum + fight.readinessPercent,
          0,
        ) / fights.length,
      )
    : 0;

  return (
    <div className="grid gap-3">
      <section className="grid grid-cols-2 gap-px border border-[#303238] bg-[#303238] xl:grid-cols-4">
        <div className="bg-[#151619] p-3">
          <span className="text-[8px] font-bold uppercase tracking-[0.11em] text-zinc-600">
            Combats opérationnels
          </span>
          <strong className="mt-1 block font-mono text-[20px] text-white">
            {fights.length}
          </strong>
          <span className="text-[8px] text-zinc-600">
            synchronisés depuis la carte des combats
          </span>
        </div>

        <div className="bg-[#151619] p-3">
          <span className="text-[8px] font-bold uppercase tracking-[0.11em] text-zinc-600">
            Prêts Jour J
          </span>
          <strong className="mt-1 block font-mono text-[20px] text-emerald-400">
            {ready}
          </strong>
          <span className="text-[8px] text-zinc-600">
            statut prêt
          </span>
        </div>

        <div className="bg-[#151619] p-3">
          <span className="text-[8px] font-bold uppercase tracking-[0.11em] text-zinc-600">
            À traiter
          </span>
          <strong className="mt-1 block font-mono text-[20px] text-amber-400">
            {incomplete}
          </strong>
          <span className="text-[8px] text-zinc-600">
            {eligible} prêt{eligible > 1 ? 's' : ''} à valider
          </span>
        </div>

        <div className="bg-[#151619] p-3">
          <span className="text-[8px] font-bold uppercase tracking-[0.11em] text-zinc-600">
            Niveau de préparation moyen
          </span>
          <strong className="mt-1 block font-mono text-[20px] text-[#57a0ff]">
            {average}%
          </strong>
          <div className="mt-2 h-1 bg-[#272a2f]">
            <div
              className="h-full bg-[#087cff]"
              style={{ width: `${average}%` }}
            />
          </div>
        </div>
      </section>

      <section className="flex flex-wrap items-center justify-between gap-3 border border-[#303238] bg-[#111214] p-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="grid h-8 w-8 flex-none place-items-center border border-[#2f4c7e] bg-[#10203a] text-[#57a0ff]">
            <Gauge size={15} />
          </div>
          <div className="min-w-0">
            <span className="text-[8px] font-bold uppercase tracking-[0.12em] text-[#3d92ff]">
              Préparation opérationnelle
            </span>
            <p className="mt-1 max-w-3xl text-[9px] leading-5 text-zinc-600">
              Le calcul lit la politique de poids de la discipline, le règlement applicable ou la catégorie de l’événement, les deux pesées, les validations médicales, les licences et les affectations d’officiels. Un combat complet devient « prêt à valider » avant de passer au statut <span className="font-mono text-zinc-500">prêt</span>.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={loading || mutating}
          className={organizerButtonClass}
        >
          <RefreshCw
            size={13}
            className={loading ? 'animate-spin' : undefined}
          />
          Actualiser
        </button>
      </section>

      {!fights.length ? (
        <section className="grid min-h-[260px] place-items-center border border-[#303238] bg-[#151619] p-8 text-center">
          <div>
            <Activity
              size={24}
              className="mx-auto text-zinc-600"
            />
            <h2 className="mt-3 text-[12px] font-semibold text-white">
              Aucun combat opérationnel
            </h2>
            <p className="mt-1 max-w-md text-[9px] leading-5 text-zinc-500">
              Confirmez d’abord les matchs dans la carte des combats puis utilisez « Synchroniser vers Combats ».
            </p>
          </div>
        </section>
      ) : (
        <section className="grid gap-2">
          {fights.map((fight) => {
            const state = statePresentation(fight);
            const visibleBlockers = fight.blockers.slice(0, 4);

            return (
              <article
                key={fight.id}
                className="border border-[#303238] bg-[#151619]"
              >
                <header className="grid gap-3 border-b border-[#303238] p-3 lg:grid-cols-[72px_minmax(0,1fr)_150px] lg:items-center">
                  <div>
                    <span className="block text-[8px] uppercase tracking-[0.12em] text-zinc-600">
                      Combat
                    </span>
                    <strong className="font-mono text-[18px] text-white">
                      #{fight.fightOrder}
                    </strong>
                  </div>

                  <div className="grid min-w-0 gap-2 sm:grid-cols-[minmax(0,1fr)_90px_minmax(0,1fr)] sm:items-center">
                    <div className="min-w-0 border-l-2 border-[#ff1638] pl-3">
                      <span className="text-[8px] font-bold uppercase tracking-[0.1em] text-[#ff4058]">
                        Coin rouge
                      </span>
                      <strong className="mt-0.5 block truncate text-[11px] text-zinc-100">
                        {fighterLabel(
                          fight.fighterRed.fullName,
                          fight.fighterRed.nickname,
                        )}
                      </strong>
                    </div>

                    <div className="text-left sm:text-center">
                      <span className="block text-[8px] font-bold uppercase tracking-[0.1em] text-zinc-600">
                        {fight.disciplineName}
                      </span>
                      <strong className="mt-0.5 block text-[9px] text-zinc-400">
                        {weightDisplayLabel(fight)}
                      </strong>
                      <span className="font-mono text-[8px] text-zinc-700">
                        {roundsLabel(fight.scheduledRounds)}
                      </span>
                    </div>

                    <div className="min-w-0 border-l-2 border-[#087cff] pl-3">
                      <span className="text-[8px] font-bold uppercase tracking-[0.1em] text-[#3d92ff]">
                        Coin bleu
                      </span>
                      <strong className="mt-0.5 block truncate text-[11px] text-zinc-100">
                        {fighterLabel(
                          fight.fighterBlue.fullName,
                          fight.fighterBlue.nickname,
                        )}
                      </strong>
                    </div>
                  </div>

                  <div className="lg:text-right">
                    <span
                      className={`inline-flex border px-2 py-1 text-[8px] font-bold uppercase tracking-[0.09em] ${state.className}`}
                    >
                      {state.label}
                    </span>
                    <span className="mt-1 block font-mono text-[9px] text-zinc-600">
                      Statut : {fightStatusLabel(fight.status)}
                    </span>
                  </div>
                </header>

                <div className="grid gap-px bg-[#303238] xl:grid-cols-[210px_minmax(0,1fr)_270px]">
                  <section className="bg-[#111214] p-3">
                    <div className="flex items-end justify-between gap-3">
                      <div>
                        <span className="text-[8px] font-bold uppercase tracking-[0.1em] text-zinc-600">
                          Préparation
                        </span>
                        <strong className="mt-1 block font-mono text-[22px] text-white">
                          {fight.readinessPercent}%
                        </strong>
                      </div>
                      <ClipboardCheck
                        size={18}
                        className={
                          fight.readinessPercent === 100
                            ? 'text-emerald-400'
                            : 'text-amber-400'
                        }
                      />
                    </div>
                    <div className="mt-3 h-1 bg-[#272a2f]">
                      <div
                        className={
                          fight.readinessPercent === 100
                            ? 'h-full bg-emerald-500'
                            : 'h-full bg-amber-500'
                        }
                        style={{ width: `${fight.readinessPercent}%` }}
                      />
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-[8px] text-zinc-600">
                      <span className="flex items-center gap-1">
                        <ShieldCheck size={11} />
                        Arbitre {fight.refereeConfirmed}/1
                      </span>
                      <span className="flex items-center gap-1">
                        <UsersRound size={11} />
                        Juges {fight.judgesConfirmed}/3
                      </span>
                    </div>
                  </section>

                  <section className="bg-[#151619] p-3">
                    <span className="text-[8px] font-bold uppercase tracking-[0.1em] text-zinc-600">
                      Points à résoudre
                    </span>

                    {fight.blockers.length === 0 ? (
                      <div className="mt-2 flex items-center gap-2 text-[9px] text-emerald-400">
                        <CircleCheckBig size={13} />
                        Tous les contrôles obligatoires sont satisfaits.
                      </div>
                    ) : (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {visibleBlockers.map((blocker) => (
                          <span
                            key={blocker}
                            className="border border-amber-500/25 bg-amber-500/5 px-2 py-1 text-[8px] font-semibold text-amber-400"
                          >
                            {blocker}
                          </span>
                        ))}
                        {fight.blockers.length > visibleBlockers.length && (
                          <span className="border border-[#343840] bg-[#101114] px-2 py-1 text-[8px] text-zinc-600">
                            +{fight.blockers.length - visibleBlockers.length}
                          </span>
                        )}
                      </div>
                    )}

                    <details className="mt-3 border-t border-[#2a2d32] pt-2">
                      <summary className="cursor-pointer text-[8px] font-bold uppercase tracking-[0.1em] text-zinc-500 hover:text-zinc-300">
                        Voir les {fight.checks.length} contrôles
                      </summary>

                      <div className="mt-2 grid gap-px border border-[#2d3036] bg-[#2d3036] sm:grid-cols-2">
                        {fight.checks.map((check) => (
                          <div
                            key={check.key}
                            className="flex items-start gap-2 bg-[#101114] p-2.5"
                          >
                            <CheckIcon check={check} />
                            <div className="min-w-0">
                              <strong className="block text-[8px] font-semibold text-zinc-300">
                                {check.label}
                              </strong>
                              <span className="mt-0.5 block text-[8px] leading-4 text-zinc-600">
                                {check.detail}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </details>
                  </section>

                  <section className="grid content-center gap-2 bg-[#111214] p-3">
                    <button
                      type="button"
                      onClick={() => onEdit(fight)}
                      disabled={!fight.canEdit || mutating}
                      className={organizerButtonClass}
                    >
                      <Pencil size={12} />
                      Configurer
                    </button>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={onOpenWeighIn}
                        className={organizerButtonClass}
                      >
                        <Scale size={12} />
                        Pesée
                      </button>

                      <Link
                        href={`/dashboard/organisateur/fight-live/${fight.id}/officials`}
                        className={organizerButtonClass}
                      >
                        <UsersRound size={12} />
                        Officiels
                      </Link>
                    </div>

                    {fight.canMarkReady && (
                      <button
                        type="button"
                        onClick={() => onMarkReady(fight)}
                        disabled={mutating}
                        className={organizerPrimaryButtonClass}
                      >
                        <CircleCheckBig size={12} />
                        Valider prêt Jour J
                      </button>
                    )}

                    {fight.canReturnToScheduled && (
                      <button
                        type="button"
                        onClick={() => onReturnToScheduled(fight)}
                        disabled={mutating}
                        className={organizerButtonClass}
                      >
                        <RefreshCw size={12} />
                        Repasser en préparation
                      </button>
                    )}

                    {fight.canOpenFightLive ? (
                      <Link
                        href={`/dashboard/organisateur/fight-live/${fight.id}`}
                        className={`${organizerPrimaryButtonClass} justify-center`}
                      >
                        <Activity size={12} />
                        Ouvrir le combat en direct
                        <ExternalLink size={10} />
                      </Link>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className={`${organizerPrimaryButtonClass} justify-center`}
                        title="Le combat doit être complet puis validé prêt Jour J."
                      >
                        <Activity size={12} />
                        Combat en direct indisponible
                      </button>
                    )}
                  </section>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}
