'use client';

import {
  useState,
} from 'react';
import {
  Loader2,
  ShieldCheck,
  TriangleAlert,
} from 'lucide-react';
import {
  OrganizerDialog,
  OrganizerToast,
  organizerButtonClass,
  organizerPrimaryButtonClass,
  type OrganizerToastState,
} from '../../../components/OrganizerFeedback';
import { useFightWeighIns } from '../hooks/useFightWeighIns';
import type {
  FightWeighInAttemptDraft,
  FightWeighInFighter,
  FightWeighInItem,
} from '../types';
import { FightWeighInBoard } from './FightWeighInBoard';
import { FightWeighInEditor } from './FightWeighInEditor';

type Selection = {
  fight: FightWeighInItem;
  fighter: FightWeighInFighter;
};

export function FightWeighInWorkspace({
  eventId,
}: {
  eventId: string;
}) {
  const weighIns = useFightWeighIns(eventId);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [waiverSelection, setWaiverSelection] = useState<Selection | null>(null);
  const [waiverReason, setWaiverReason] = useState('');
  const [toast, setToast] = useState<OrganizerToastState>(null);

  const saveAttempt = async (
    draft: FightWeighInAttemptDraft,
  ) => {
    try {
      await weighIns.createAttempt(draft);
      setSelection(null);
      setToast({
        message: 'Pesée enregistrée. Le readiness du combat sera recalculé avec ce nouveau statut.',
        tone: 'success',
      });
    } catch (reason) {
      setToast({
        message:
          reason instanceof Error
            ? reason.message
            : 'Impossible d’enregistrer la pesée.',
        tone: 'error',
      });
    }
  };

  const waive = async () => {
    const weighInId = waiverSelection?.fighter.latestAttempt?.id;

    if (!weighInId) return;

    try {
      await weighIns.waive({
        weighInId,
        reason: waiverReason,
      });
      setWaiverSelection(null);
      setWaiverReason('');
      setToast({
        message: 'Dérogation enregistrée. La pesée est désormais acceptée sous dérogation.',
        tone: 'warning',
      });
    } catch (reason) {
      setToast({
        message:
          reason instanceof Error
            ? reason.message
            : 'Impossible d’enregistrer la dérogation.',
        tone: 'error',
      });
    }
  };

  return (
    <>
      <OrganizerToast
        toast={toast}
        onClose={() => setToast(null)}
      />

      {weighIns.error && (
        <section className="flex items-start gap-3 border border-red-500/30 bg-red-500/5 p-3">
          <TriangleAlert size={15} className="mt-0.5 text-[#ff4058]" />
          <div className="min-w-0">
            <strong className="block text-[10px] font-semibold text-red-200">
              Le poste de pesée n’a pas pu être chargé
            </strong>
            <p className="mt-1 break-words text-[9px] leading-5 text-red-300/70">
              {weighIns.error}
            </p>
          </div>
        </section>
      )}

      {weighIns.loading && !weighIns.data ? (
        <section className="grid min-h-[300px] place-items-center border border-[#303238] bg-[#151619]">
          <div className="flex items-center gap-2 text-[10px] text-zinc-500">
            <Loader2 size={15} className="animate-spin text-[#3d92ff]" />
            Chargement du poste de pesée…
          </div>
        </section>
      ) : weighIns.data ? (
        <FightWeighInBoard
          snapshot={weighIns.data}
          loading={weighIns.loading}
          mutating={weighIns.mutating}
          onRefresh={() => void weighIns.refresh()}
          onMeasure={(fight, fighter) => setSelection({ fight, fighter })}
          onWaive={(fight, fighter) => {
            setWaiverReason('');
            setWaiverSelection({ fight, fighter });
          }}
        />
      ) : null}

      <FightWeighInEditor
        open={Boolean(selection)}
        fight={selection?.fight ?? null}
        fighter={selection?.fighter ?? null}
        saving={weighIns.mutating}
        onClose={() => {
          if (!weighIns.mutating) setSelection(null);
        }}
        onSave={saveAttempt}
      />

      <OrganizerDialog
        open={Boolean(waiverSelection)}
        eyebrow="Pesée · dérogation"
        title={
          waiverSelection
            ? `Accepter ${waiverSelection.fighter.fullName} sous dérogation ?`
            : 'Enregistrer une dérogation ?'
        }
        description={
          waiverSelection
            ? `Combat #${waiverSelection.fight.fightOrder} · ${waiverSelection.fight.disciplineName} · ${waiverSelection.fight.weightCategory || 'Catégorie N/C'}`
            : undefined
        }
        onClose={() => {
          if (!weighIns.mutating) {
            setWaiverSelection(null);
            setWaiverReason('');
          }
        }}
        footer={
          <>
            <button
              type="button"
              onClick={() => {
                setWaiverSelection(null);
                setWaiverReason('');
              }}
              disabled={weighIns.mutating}
              className={organizerButtonClass}
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={() => void waive()}
              disabled={!waiverReason.trim() || weighIns.mutating}
              className={organizerPrimaryButtonClass}
            >
              <ShieldCheck size={13} />
              {weighIns.mutating ? 'Validation…' : 'Valider la dérogation'}
            </button>
          </>
        }
      >
        <div className="grid gap-3">
          <p className="border-l-2 border-amber-500 bg-amber-500/5 px-3 py-2 text-[9px] leading-5 text-amber-200/70">
            Une dérogation rend la pesée acceptable pour le readiness sans modifier le poids réellement mesuré. Le motif est conservé dans l’historique de pesée.
          </p>
          <label className="grid gap-1">
            <span className="text-[8px] font-bold uppercase tracking-[0.11em] text-zinc-600">
              Motif de la dérogation *
            </span>
            <textarea
              value={waiverReason}
              onChange={(event) => setWaiverReason(event.target.value)}
              className="min-h-24 resize-y border border-[#343840] bg-[#0d0e10] p-3 text-[10px] text-white outline-none focus:border-[#087cff]"
              placeholder="Tolérance décidée par l’organisation, accord des deux camps, décision réglementaire…"
            />
          </label>
        </div>
      </OrganizerDialog>
    </>
  );
}
