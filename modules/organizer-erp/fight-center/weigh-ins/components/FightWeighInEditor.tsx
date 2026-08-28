'use client';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  Scale,
  ShieldCheck,
  TriangleAlert,
} from 'lucide-react';
import {
  OrganizerDialog,
  organizerButtonClass,
  organizerPrimaryButtonClass,
} from '../../../components/OrganizerFeedback';
import type {
  FightWeighInAttemptDraft,
  FightWeighInFighter,
  FightWeighInItem,
} from '../types';

const inputClass =
  'h-10 w-full border border-[#343840] bg-[#0d0e10] px-3 text-[10px] text-white outline-none focus:border-[#087cff] disabled:cursor-not-allowed disabled:opacity-50';

function numberValue(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

function compliancePreview(
  measured: number | null,
  minimum: number | null,
  maximum: number | null,
  minInclusive: boolean,
  maxInclusive: boolean,
) {
  if (measured === null) {
    return {
      label: 'Poids à saisir',
      tone: 'neutral' as const,
    };
  }

  if (minimum === null && maximum === null) {
    return {
      label: 'Limites non définies · validation manuelle impossible',
      tone: 'warning' as const,
    };
  }

  const minOk =
    minimum === null ||
    (minInclusive ? measured >= minimum : measured > minimum);
  const maxOk =
    maximum === null ||
    (maxInclusive ? measured <= maximum : measured < maximum);

  return minOk && maxOk
    ? {
        label: 'Conforme aux limites',
        tone: 'success' as const,
      }
    : {
        label: 'Hors limite',
        tone: 'danger' as const,
      };
}

function limitLabel(
  fight: FightWeighInItem,
) {
  const min = fight.minimumWeightKg;
  const max = fight.maximumWeightKg;

  if (min === null && max === null) {
    return fight.boundsSource === 'event_defined'
      ? 'À définir pour cette catégorie événement'
      : 'Aucune limite réglementaire';
  }

  if (min !== null && max !== null) {
    return `${fight.minInclusive ? '≥' : '>'}${min} kg · ${fight.maxInclusive ? '≤' : '<'}${max} kg`;
  }

  if (max !== null) {
    return `${fight.maxInclusive ? '≤' : '<'}${max} kg`;
  }

  return `${fight.minInclusive ? '≥' : '>'}${min} kg`;
}

export function FightWeighInEditor({
  open,
  fight,
  fighter,
  saving,
  onClose,
  onSave,
}: {
  open: boolean;
  fight: FightWeighInItem | null;
  fighter: FightWeighInFighter | null;
  saving: boolean;
  onClose: () => void;
  onSave: (draft: FightWeighInAttemptDraft) => Promise<void>;
}) {
  const [measured, setMeasured] = useState('');
  const [minimum, setMinimum] = useState('');
  const [maximum, setMaximum] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!open || !fight) return;

    setMeasured('');
    setMinimum(
      fight.minimumWeightKg === null ? '' : String(fight.minimumWeightKg),
    );
    setMaximum(
      fight.maximumWeightKg === null ? '' : String(fight.maximumWeightKg),
    );
    setNotes('');
  }, [fight, open]);

  const measuredValue = numberValue(measured);
  const minimumValue = numberValue(minimum);
  const maximumValue = numberValue(maximum);
  const regulatoryBounds = fight?.boundsSource === 'ruleset';

  const preview = useMemo(
    () =>
      compliancePreview(
        measuredValue,
        minimumValue,
        maximumValue,
        fight?.minInclusive ?? false,
        fight?.maxInclusive ?? true,
      ),
    [
      fight?.maxInclusive,
      fight?.minInclusive,
      maximumValue,
      measuredValue,
      minimumValue,
    ],
  );

  if (!fight || !fighter) return null;

  const canSubmit =
    Boolean(fighter.fighterId) &&
    measuredValue !== null &&
    measuredValue > 0 &&
    !saving;

  return (
    <OrganizerDialog
      open={open}
      eyebrow={`Pesée · combat #${fight.fightOrder} · ${fighter.corner === 'red' ? 'coin rouge' : 'coin bleu'}`}
      title={fighter.fullName}
      description={`${fight.disciplineName} · ${fight.weightCategory || 'Catégorie non définie'}`}
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className={organizerButtonClass}
          >
            Annuler
          </button>

          <button
            type="button"
            disabled={!canSubmit}
            onClick={() => {
              if (!fighter.fighterId || measuredValue === null) return;

              void onSave({
                fightId: fight.fightId,
                fighterId: fighter.fighterId,
                corner: fighter.corner,
                measuredWeightKg: measuredValue,
                minimumWeightKg: minimumValue,
                maximumWeightKg: maximumValue,
                notes,
              });
            }}
            className={organizerPrimaryButtonClass}
          >
            <Scale size={13} />
            {saving ? 'Enregistrement…' : 'Enregistrer la pesée'}
          </button>
        </>
      }
    >
      <div className="grid gap-4">
        <section className="grid gap-px border border-[#303238] bg-[#303238] sm:grid-cols-3">
          <div className="bg-[#111214] p-3">
            <span className="text-[8px] font-bold uppercase tracking-[0.12em] text-zinc-600">
              Catégorie
            </span>
            <strong className="mt-1 block text-[10px] text-white">
              {fight.weightCategory || 'Non définie'}
            </strong>
          </div>
          <div className="bg-[#111214] p-3">
            <span className="text-[8px] font-bold uppercase tracking-[0.12em] text-zinc-600">
              Limites
            </span>
            <strong className="mt-1 block font-mono text-[10px] text-zinc-200">
              {limitLabel(fight)}
            </strong>
          </div>
          <div className="bg-[#111214] p-3">
            <span className="text-[8px] font-bold uppercase tracking-[0.12em] text-zinc-600">
              Tentative suivante
            </span>
            <strong className="mt-1 block font-mono text-[10px] text-[#3d92ff]">
              #{(fighter.latestAttempt?.attemptNumber ?? 0) + 1}
            </strong>
          </div>
        </section>

        <label className="grid gap-1">
          <span className="text-[8px] font-bold uppercase tracking-[0.11em] text-zinc-600">
            Poids mesuré (kg) *
          </span>
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={measured}
            onChange={(event) => setMeasured(event.target.value)}
            className={`${inputClass} font-mono text-[13px]`}
            placeholder="70.10"
            autoFocus
          />
        </label>

        {!regulatoryBounds && (
          <section className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1">
              <span className="text-[8px] font-bold uppercase tracking-[0.11em] text-zinc-600">
                Limite minimale (kg)
              </span>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={minimum}
                onChange={(event) => setMinimum(event.target.value)}
                className={inputClass}
                placeholder="Optionnelle"
              />
            </label>

            <label className="grid gap-1">
              <span className="text-[8px] font-bold uppercase tracking-[0.11em] text-zinc-600">
                Limite maximale (kg)
              </span>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={maximum}
                onChange={(event) => setMaximum(event.target.value)}
                className={inputClass}
                placeholder="Optionnelle"
              />
            </label>
          </section>
        )}

        <section
          className={
            preview.tone === 'success'
              ? 'flex items-center gap-2 border border-emerald-500/30 bg-emerald-500/5 p-3 text-emerald-300'
              : preview.tone === 'danger'
                ? 'flex items-center gap-2 border border-red-500/30 bg-red-500/5 p-3 text-red-300'
                : preview.tone === 'warning'
                  ? 'flex items-center gap-2 border border-amber-500/30 bg-amber-500/5 p-3 text-amber-300'
                  : 'flex items-center gap-2 border border-[#303238] bg-[#111214] p-3 text-zinc-500'
          }
        >
          {preview.tone === 'success' ? (
            <ShieldCheck size={14} />
          ) : (
            <TriangleAlert size={14} />
          )}
          <span className="text-[9px] font-semibold">{preview.label}</span>
        </section>

        <label className="grid gap-1">
          <span className="text-[8px] font-bold uppercase tracking-[0.11em] text-zinc-600">
            Notes de pesée
          </span>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            className="min-h-20 resize-y border border-[#343840] bg-[#0d0e10] p-3 text-[10px] text-white outline-none focus:border-[#087cff]"
            placeholder="Observations, équipement, tolérance, contexte…"
          />
        </label>

        {fight.boundsSource === 'event_defined' &&
          minimumValue === null &&
          maximumValue === null && (
            <p className="border-l-2 border-amber-500 bg-amber-500/5 px-3 py-2 text-[9px] leading-5 text-amber-200/70">
              La catégorie est définie par l’événement mais aucune limite numérique n’est encore renseignée. La mesure sera enregistrée « En attente » tant qu’une limite n’est pas fournie.
            </p>
          )}
      </div>
    </OrganizerDialog>
  );
}
