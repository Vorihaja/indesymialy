'use client';

import {
  BadgeCheck,
  Ban,
  Clock3,
  RefreshCw,
  Shield,
  Stethoscope,
  TriangleAlert,
  UserCheck,
  Users,
} from 'lucide-react';
import type {
  FightOfficialAssignment,
  FightOfficialCandidate,
  FightOfficialRole,
  FightOfficialsFight,
  UnlinkedOfficialMention,
} from '../types';

const PROTECTED_FIGHT_STATUSES = new Set([
  'live',
  'paused',
  'recovery',
  'completed',
  'finished',
  'published',
  'cancelled',
  'canceled',
]);

const ROLE_LABELS: Record<FightOfficialRole, string> = {
  referee: 'Arbitre central',
  judge: 'Juge',
  timekeeper: 'Chronométreur',
  doctor: 'Médecin',
  supervisor: 'Superviseur',
};

function statusLabel(status: FightOfficialAssignment['status']) {
  switch (status) {
    case 'confirmed':
      return 'Confirmé';
    case 'declined':
      return 'Refusé';
    case 'cancelled':
      return 'Annulé';
    case 'completed':
      return 'Mission terminée';
    default:
      return 'Affecté';
  }
}

function availabilityLabel(
  value: FightOfficialAssignment['availabilityStatus'],
) {
  switch (value) {
    case 'available':
      return 'Disponible';
    case 'unavailable':
      return 'Indisponible';
    case 'tentative':
      return 'Tentatif';
    case 'pending':
      return 'À confirmer';
    default:
      return 'Demande non créée';
  }
}

function roleIcon(role: FightOfficialRole) {
  if (role === 'referee') return <Shield size={13} />;
  if (role === 'timekeeper') return <Clock3 size={13} />;
  if (role === 'doctor') return <Stethoscope size={13} />;
  if (role === 'supervisor') return <BadgeCheck size={13} />;
  return <UserCheck size={13} />;
}

function assignmentForSlot(
  fight: FightOfficialsFight,
  role: FightOfficialRole,
  position: number | null,
) {
  return (
    fight.assignments.find((assignment) => {
      if (assignment.role !== role) return false;
      if (role !== 'judge') return true;
      return assignment.position === position;
    }) ?? null
  );
}

function Slot({
  fight,
  role,
  position,
  assignment,
  mutating,
  onEdit,
  onConfirm,
  onCancel,
}: {
  fight: FightOfficialsFight;
  role: FightOfficialRole;
  position: number | null;
  assignment: FightOfficialAssignment | null;
  mutating: boolean;
  onEdit: (
    fight: FightOfficialsFight,
    role: FightOfficialRole,
    position: number | null,
    current: FightOfficialAssignment | null,
  ) => void;
  onConfirm: (assignmentId: string) => Promise<void>;
  onCancel: (assignmentId: string) => Promise<void>;
}) {
  const protectedFight = PROTECTED_FIGHT_STATUSES.has(fight.fightStatus);
  const title =
    role === 'judge' && position
      ? `${ROLE_LABELS[role]} ${position}`
      : ROLE_LABELS[role];

  return (
    <article className="border border-[#2d3036] bg-[#111214] p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.1em] text-zinc-500">
          <span className="text-[#3d92ff]">{roleIcon(role)}</span>
          {title}
        </div>

        {assignment?.status === 'confirmed' && (
          <span className="border border-emerald-500/30 bg-emerald-500/5 px-2 py-1 text-[8px] font-bold uppercase text-emerald-300">
            Confirmé
          </span>
        )}
      </div>

      {assignment ? (
        <>
          <h4 className="mt-3 truncate text-[11px] font-semibold text-white">
            {assignment.name}
          </h4>
          <p className="mt-1 text-[8px] text-zinc-600">
            {statusLabel(assignment.status)} · {availabilityLabel(assignment.availabilityStatus)}
          </p>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {assignment.status !== 'confirmed' && (
              <button
                type="button"
                disabled={mutating || protectedFight}
                onClick={() => { void onConfirm(assignment.id).catch(() => undefined); }}
                className="h-7 border border-emerald-500/30 bg-emerald-500/5 px-2.5 text-[8px] font-bold uppercase tracking-[0.08em] text-emerald-300 hover:bg-emerald-500/10 disabled:opacity-40"
              >
                Confirmer
              </button>
            )}

            <button
              type="button"
              disabled={mutating || protectedFight}
              onClick={() => onEdit(fight, role, position, assignment)}
              className="h-7 border border-[#345486] bg-[#10203a] px-2.5 text-[8px] font-bold uppercase tracking-[0.08em] text-[#57a0ff] hover:bg-[#142a4b] disabled:opacity-40"
            >
              Remplacer
            </button>

            <button
              type="button"
              disabled={mutating || protectedFight}
              onClick={() => { void onCancel(assignment.id).catch(() => undefined); }}
              className="h-7 border border-red-500/25 bg-red-500/5 px-2.5 text-[8px] font-bold uppercase tracking-[0.08em] text-red-300 hover:bg-red-500/10 disabled:opacity-40"
            >
              Retirer
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="mt-3 text-[10px] font-semibold text-zinc-600">
            Aucun officiel affecté
          </p>
          <button
            type="button"
            disabled={mutating || protectedFight}
            onClick={() => onEdit(fight, role, position, null)}
            className="mt-3 h-7 border border-[#343840] bg-[#0e0f11] px-2.5 text-[8px] font-bold uppercase tracking-[0.08em] text-zinc-400 hover:border-[#3f5f91] hover:text-white disabled:opacity-40"
          >
            Affecter
          </button>
        </>
      )}

      {protectedFight && (
        <p className="mt-2 text-[8px] text-amber-300/70">
          Affectations verrouillées pour le statut {fight.fightStatus}.
        </p>
      )}
    </article>
  );
}

export function FightOfficialsBoard({
  eventName,
  fights,
  candidates,
  unlinkedMentions,
  mutating,
  onRefresh,
  onEdit,
  onConfirm,
  onCancel,
}: {
  eventName: string;
  fights: FightOfficialsFight[];
  candidates: FightOfficialCandidate[];
  unlinkedMentions: UnlinkedOfficialMention[];
  mutating: boolean;
  onRefresh: () => Promise<void>;
  onEdit: (
    fight: FightOfficialsFight,
    role: FightOfficialRole,
    position: number | null,
    current: FightOfficialAssignment | null,
  ) => void;
  onConfirm: (assignmentId: string) => Promise<void>;
  onCancel: (assignmentId: string) => Promise<void>;
}) {
  const coreReady = fights.filter((fight) => {
    const referee = fight.assignments.some(
      (assignment) =>
        assignment.role === 'referee' && assignment.status === 'confirmed',
    );
    const judges = fight.assignments.filter(
      (assignment) =>
        assignment.role === 'judge' && assignment.status === 'confirmed',
    ).length;
    return referee && judges >= 3;
  }).length;

  return (
    <div className="grid gap-3">
      <section className="grid gap-px border border-[#303238] bg-[#303238] md:grid-cols-4">
        <div className="bg-[#151619] p-3">
          <span className="text-[8px] font-bold uppercase tracking-[0.12em] text-zinc-600">
            Événement
          </span>
          <p className="mt-1 truncate text-[11px] font-semibold text-white">
            {eventName}
          </p>
        </div>
        <div className="bg-[#151619] p-3">
          <span className="text-[8px] font-bold uppercase tracking-[0.12em] text-zinc-600">
            Combats
          </span>
          <p className="mt-1 text-[16px] font-semibold text-white">{fights.length}</p>
        </div>
        <div className="bg-[#151619] p-3">
          <span className="text-[8px] font-bold uppercase tracking-[0.12em] text-zinc-600">
            Cœur arbitral prêt
          </span>
          <p className="mt-1 text-[16px] font-semibold text-emerald-300">
            {coreReady}/{fights.length}
          </p>
        </div>
        <div className="flex items-center justify-between gap-3 bg-[#151619] p-3">
          <div>
            <span className="text-[8px] font-bold uppercase tracking-[0.12em] text-zinc-600">
              Profils assignables
            </span>
            <p className="mt-1 text-[16px] font-semibold text-[#57a0ff]">
              {candidates.length}
            </p>
          </div>
          <button
            type="button"
            disabled={mutating}
            onClick={() => void onRefresh()}
            className="grid h-8 w-8 place-items-center border border-[#343840] bg-[#0e0f11] text-zinc-500 hover:text-white disabled:opacity-40"
            aria-label="Actualiser"
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </section>

      {unlinkedMentions.length > 0 && (
        <section className="border border-amber-500/25 bg-amber-500/5 p-3">
          <div className="flex items-start gap-3">
            <TriangleAlert size={15} className="mt-0.5 text-amber-300" />
            <div className="min-w-0">
              <strong className="text-[10px] font-semibold text-amber-100">
                {unlinkedMentions.length} mention(s) d’officiel sans profil Indesy
              </strong>
              <p className="mt-1 text-[9px] leading-5 text-amber-100/60">
                Elles restent valides pour le planning événement, mais ne peuvent pas être affectées à un combat ni transmises à Fight Live.
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {unlinkedMentions.map((item) => (
                  <span
                    key={item.eventAssignmentId}
                    className="border border-amber-500/20 bg-black/10 px-2 py-1 text-[8px] text-amber-200/80"
                  >
                    {item.mention} · {item.rosterRole}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {!fights.length ? (
        <section className="grid min-h-[220px] place-items-center border border-[#303238] bg-[#151619] p-6 text-center">
          <div>
            <Users size={22} className="mx-auto text-zinc-700" />
            <p className="mt-3 text-[11px] font-semibold text-zinc-300">
              Aucun combat opérationnel pour cet événement.
            </p>
          </div>
        </section>
      ) : (
        fights.map((fight) => {
          const referee = assignmentForSlot(fight, 'referee', null);
          const judge1 = assignmentForSlot(fight, 'judge', 1);
          const judge2 = assignmentForSlot(fight, 'judge', 2);
          const judge3 = assignmentForSlot(fight, 'judge', 3);
          const timekeeper = assignmentForSlot(fight, 'timekeeper', null);
          const doctor = assignmentForSlot(fight, 'doctor', null);
          const supervisor = assignmentForSlot(fight, 'supervisor', null);

          const confirmedJudges = [judge1, judge2, judge3].filter(
            (assignment) => assignment?.status === 'confirmed',
          ).length;
          const refereeConfirmed = referee?.status === 'confirmed';

          return (
            <section
              key={fight.fightId}
              className="border border-[#303238] bg-[#151619]"
            >
              <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#2d3036] px-3 py-2.5">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[8px] font-bold uppercase tracking-[0.12em] text-[#3d92ff]">
                      Combat #{fight.fightOrder}
                    </span>
                    <span className="text-[8px] text-zinc-600">
                      {fight.disciplineName} · {fight.weightCategory}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-[11px] font-semibold text-white">
                    {fight.red.name} <span className="text-zinc-600">vs</span> {fight.blue.name}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`border px-2 py-1 text-[8px] font-bold uppercase tracking-[0.08em] ${
                      refereeConfirmed && confirmedJudges >= 3
                        ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-300'
                        : 'border-amber-500/25 bg-amber-500/5 text-amber-300'
                    }`}
                  >
                    Arbitre {refereeConfirmed ? '1/1' : '0/1'} · Juges {confirmedJudges}/3
                  </span>
                </div>
              </header>

              <div className="grid gap-px bg-[#282b30] lg:grid-cols-3">
                <Slot
                  fight={fight}
                  role="referee"
                  position={null}
                  assignment={referee}
                  mutating={mutating}
                  onEdit={onEdit}
                  onConfirm={onConfirm}
                  onCancel={onCancel}
                />
                <Slot
                  fight={fight}
                  role="judge"
                  position={1}
                  assignment={judge1}
                  mutating={mutating}
                  onEdit={onEdit}
                  onConfirm={onConfirm}
                  onCancel={onCancel}
                />
                <Slot
                  fight={fight}
                  role="judge"
                  position={2}
                  assignment={judge2}
                  mutating={mutating}
                  onEdit={onEdit}
                  onConfirm={onConfirm}
                  onCancel={onCancel}
                />
                <Slot
                  fight={fight}
                  role="judge"
                  position={3}
                  assignment={judge3}
                  mutating={mutating}
                  onEdit={onEdit}
                  onConfirm={onConfirm}
                  onCancel={onCancel}
                />
                <Slot
                  fight={fight}
                  role="timekeeper"
                  position={null}
                  assignment={timekeeper}
                  mutating={mutating}
                  onEdit={onEdit}
                  onConfirm={onConfirm}
                  onCancel={onCancel}
                />
                <Slot
                  fight={fight}
                  role="doctor"
                  position={null}
                  assignment={doctor}
                  mutating={mutating}
                  onEdit={onEdit}
                  onConfirm={onConfirm}
                  onCancel={onCancel}
                />
                <Slot
                  fight={fight}
                  role="supervisor"
                  position={null}
                  assignment={supervisor}
                  mutating={mutating}
                  onEdit={onEdit}
                  onConfirm={onConfirm}
                  onCancel={onCancel}
                />
              </div>

              {PROTECTED_FIGHT_STATUSES.has(fight.fightStatus) && (
                <div className="flex items-center gap-2 border-t border-[#2d3036] bg-[#171310] px-3 py-2 text-[8px] text-amber-300/70">
                  <Ban size={12} />
                  Combat {fight.fightStatus} : modifications des officiels verrouillées dans Fight Center.
                </div>
              )}
            </section>
          );
        })
      )}
    </div>
  );
}
