'use client';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  ShieldCheck,
  TriangleAlert,
  X,
} from 'lucide-react';
import type {
  FightOfficialAssignment,
  FightOfficialCandidate,
  FightOfficialRole,
  FightOfficialsFight,
} from '../types';

const ROLE_LABELS: Record<FightOfficialRole, string> = {
  referee: 'Arbitre central',
  judge: 'Juge',
  timekeeper: 'Chronométreur',
  doctor: 'Médecin',
  supervisor: 'Superviseur',
};

function availabilityLabel(
  value: FightOfficialCandidate['availabilityStatus'],
) {
  switch (value) {
    case 'available':
      return 'Disponible';
    case 'unavailable':
      return 'Indisponible';
    case 'tentative':
      return 'Disponibilité tentative';
    case 'pending':
      return 'Disponibilité en attente';
    default:
      return 'Disponibilité non renseignée';
  }
}

export function FightOfficialEditor({
  open,
  fight,
  role,
  position,
  current,
  candidates,
  saving,
  onClose,
  onSave,
}: {
  open: boolean;
  fight: FightOfficialsFight | null;
  role: FightOfficialRole;
  position: number | null;
  current: FightOfficialAssignment | null;
  candidates: FightOfficialCandidate[];
  saving: boolean;
  onClose: () => void;
  onSave: (userId: string) => Promise<void>;
}) {
  const [selectedUserId, setSelectedUserId] = useState('');

  useEffect(() => {
    if (!open) return;
    setSelectedUserId(current?.userId ?? '');
  }, [current?.userId, open]);

  const eligibleCandidates = useMemo(() => {
    if (!fight) return [];

    const usersInOtherActiveRoles = new Set(
      fight.assignments
        .filter((assignment) => {
          if (assignment.userId === current?.userId) return false;
          if (assignment.role !== role) return true;
          if (role !== 'judge') return false;
          return assignment.position !== position;
        })
        .map((assignment) => assignment.userId),
    );

    return candidates.filter(
      (candidate) =>
        candidate.canonicalRole === role &&
        candidate.availabilityStatus !== 'unavailable' &&
        !usersInOtherActiveRoles.has(candidate.profileId),
    );
  }, [candidates, current?.userId, fight, position, role]);

  if (!open || !fight) return null;

  const slotLabel =
    role === 'judge' && position
      ? `${ROLE_LABELS[role]} ${position}`
      : ROLE_LABELS[role];

  return (
    <div className="fixed inset-0 z-[120] grid place-items-center bg-black/75 p-4">
      <section className="w-full max-w-xl border border-[#343840] bg-[#131518] shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-[#2c3036] p-4">
          <div className="min-w-0">
            <span className="text-[8px] font-bold uppercase tracking-[0.14em] text-[#3d92ff]">
              Fight Center · Officiels
            </span>
            <h2 className="mt-1 text-[15px] font-semibold text-white">
              {current ? 'Remplacer' : 'Affecter'} · {slotLabel}
            </h2>
            <p className="mt-1 truncate text-[9px] text-zinc-500">
              Combat #{fight.fightOrder} · {fight.red.name} vs {fight.blue.name}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="grid h-8 w-8 place-items-center border border-[#343840] bg-[#0e0f11] text-zinc-500 hover:text-white disabled:opacity-40"
            aria-label="Fermer"
          >
            <X size={14} />
          </button>
        </header>

        <div className="grid gap-4 p-4">
          {current && (
            <div className="border border-[#32456a] bg-[#111a2b] p-3">
              <span className="text-[8px] font-bold uppercase tracking-[0.12em] text-[#7fa9ff]">
                Affectation actuelle
              </span>
              <p className="mt-1 text-[11px] font-semibold text-white">
                {current.name}
              </p>
              <p className="mt-1 text-[9px] text-zinc-500">
                {current.status === 'confirmed' ? 'Confirmé' : 'Affecté'}
              </p>
            </div>
          )}

          {eligibleCandidates.length ? (
            <label className="grid gap-1.5">
              <span className="text-[8px] font-bold uppercase tracking-[0.12em] text-zinc-500">
                Officiel lié à un profil Indesy
              </span>
              <select
                value={selectedUserId}
                onChange={(event: { target: { value: string } }) => setSelectedUserId(event.target.value)}
                disabled={saving}
                className="h-11 border border-[#3a3e46] bg-[#0d0e10] px-3 text-[10px] font-semibold text-zinc-200 outline-none focus:border-[#087cff] disabled:opacity-50"
              >
                <option value="">Sélectionner…</option>
                {eligibleCandidates.map((candidate) => (
                  <option
                    key={`${candidate.eventAssignmentId}:${candidate.profileId}`}
                    value={candidate.profileId}
                  >
                    {candidate.name} · {availabilityLabel(candidate.availabilityStatus)}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <div className="flex gap-3 border border-amber-500/30 bg-amber-500/5 p-3">
              <TriangleAlert size={15} className="mt-0.5 text-amber-300" />
              <div>
                <strong className="text-[10px] font-semibold text-amber-100">
                  Aucun profil assignable pour ce poste
                </strong>
                <p className="mt-1 text-[9px] leading-5 text-amber-100/60">
                  L’officiel doit d’abord exister dans le vivier de l’événement avec un profil Indesy lié et une fonction compatible.
                </p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-2 border border-[#293647] bg-[#0e131a] p-3 text-[9px] leading-5 text-zinc-500">
            <ShieldCheck size={14} className="mt-0.5 shrink-0 text-[#3d92ff]" />
            L’affectation est contrôlée côté Supabase : événement, rôle, disponibilité, doublons et position de juge.
          </div>
        </div>

        <footer className="flex justify-end gap-2 border-t border-[#2c3036] p-4">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="h-9 border border-[#343840] bg-[#111214] px-4 text-[9px] font-bold uppercase tracking-[0.1em] text-zinc-400 hover:text-white disabled:opacity-40"
          >
            Annuler
          </button>

          <button
            type="button"
            disabled={saving || !selectedUserId || selectedUserId === current?.userId}
            onClick={() => { void onSave(selectedUserId).catch(() => undefined); }}
            className="h-9 border border-[#31589a] bg-[#1d4e9e] px-4 text-[9px] font-bold uppercase tracking-[0.1em] text-white hover:bg-[#087cff] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? 'Enregistrement…' : current ? 'Remplacer' : 'Affecter'}
          </button>
        </footer>
      </section>
    </div>
  );
}
