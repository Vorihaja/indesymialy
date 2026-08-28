'use client';
import { DisciplineSelect } from "@/modules/disciplines";

import { useEffect, useMemo, useState } from 'react';
import { Save } from 'lucide-react';
import {
  OrganizerDialog,
  organizerButtonClass,
  organizerPrimaryButtonClass,
} from '../../components/OrganizerFeedback';
import type {
  FightCardDraft,
  FightCardItem,
  FightCenterDiscipline,
  FightCenterFighter,
} from '../types';
import {
  FIGHT_CARD_SEGMENTS,
  FIGHT_CARD_STATUSES,
} from '../types';

const inputClass =
  'h-9 w-full border border-[#343840] bg-[#101114] px-2.5 text-[11px] text-white outline-none transition-colors focus:border-[#087cff] disabled:cursor-not-allowed disabled:opacity-50';

const labelClass =
  'mb-1 block text-[8px] font-bold uppercase tracking-[0.12em] text-zinc-500';

function draftFromCard(card: FightCardItem | null): FightCardDraft {
  return {
    segment: card?.segment ?? 'prelims',
    disciplineId: card?.disciplineId ?? '',
    fighterRedId: card?.fighterRedId ?? '',
    fighterRedMention: card?.fighterRedMention ?? '',
    fighterBlueId: card?.fighterBlueId ?? '',
    fighterBlueMention: card?.fighterBlueMention ?? '',
    status: card?.status ?? 'draft',
  };
}

function fighterLabel(fighter: FightCenterFighter) {
  const nickname = fighter.nickname ? ` “${fighter.nickname}”` : '';
  const record = `${fighter.wins}-${fighter.losses}-${fighter.draws}`;
  return `${fighter.fullName}${nickname} · ${record}`;
}

export function FightCardEditor({
  open,
  card,
  fighters,
  disciplines,
  saving,
  onClose,
  onSave,
}: {
  open: boolean;
  card: FightCardItem | null;
  fighters: FightCenterFighter[];
  disciplines: FightCenterDiscipline[];
  saving: boolean;
  onClose: () => void;
  onSave: (draft: FightCardDraft) => Promise<void>;
}) {
  const initialDraft = useMemo(() => draftFromCard(card), [card]);
  const [draft, setDraft] = useState<FightCardDraft>(initialDraft);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setDraft(initialDraft);
    setFormError(null);
  }, [initialDraft, open]);

  const save = async () => {
    setFormError(null);

    try {
      await onSave(draft);
    } catch (reason) {
      setFormError(
        reason instanceof Error
          ? reason.message
          : 'Impossible d’enregistrer le combat.',
      );
    }
  };

  return (
    <OrganizerDialog
      open={open}
      wide
      eyebrow={card ? 'Fight Card · modification' : 'Fight Card · nouveau combat'}
      title={card ? `Modifier le combat #${card.position}` : 'Ajouter un combat'}
      description="Préparez le matchup sportif. Un combat confirmé doit avoir une discipline et deux combattants liés à leur fiche."
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
            onClick={() => void save()}
            disabled={saving}
            className={organizerPrimaryButtonClass}
          >
            <Save size={13} />
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </>
      }
    >
      <div className="grid gap-4">
        <div className="grid gap-3 md:grid-cols-3">
          <label>
            <span className={labelClass}>Segment</span>
            <select
              value={draft.segment}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  segment: event.target.value as FightCardDraft['segment'],
                }))
              }
              className={inputClass}
            >
              {FIGHT_CARD_SEGMENTS.map((segment) => (
                <option key={segment.value} value={segment.value}>
                  {segment.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className={labelClass}>Discipline</span>

            <DisciplineSelect
              mode="single"
              valueMode="id"
              value={draft.disciplineId}
              options={disciplines}
              emptyLabel="À confirmer"
              onValueChange={(disciplineId) =>
                setDraft((current) => ({
                  ...current,
                  disciplineId,
                }))
              }
              className={inputClass}
              aria-label="Choisir la discipline du combat"
            />
          </label>

          <label>
            <span className={labelClass}>Statut</span>
            <select
              value={draft.status}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  status: event.target.value as FightCardDraft['status'],
                }))
              }
              className={inputClass}
            >
              {FIGHT_CARD_STATUSES.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-px bg-[#303238] lg:grid-cols-2">
          <section className="bg-[#151619] p-4">
            <div className="mb-3 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#ff1638]" />
              <strong className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white">
                Coin rouge
              </strong>
            </div>

            <label>
              <span className={labelClass}>Combattant lié</span>
              <select
                value={draft.fighterRedId}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    fighterRedId: event.target.value,
                  }))
                }
                className={inputClass}
              >
                <option value="">À confirmer / mention manuelle</option>
                {fighters.map((fighter) => (
                  <option key={fighter.id} value={fighter.id}>
                    {fighterLabel(fighter)}
                  </option>
                ))}
              </select>
            </label>

            {!draft.fighterRedId && (
              <label className="mt-3 block">
                <span className={labelClass}>Mention provisoire</span>
                <input
                  value={draft.fighterRedMention}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      fighterRedMention: event.target.value,
                    }))
                  }
                  placeholder="Nom ou @mention"
                  className={inputClass}
                />
              </label>
            )}
          </section>

          <section className="bg-[#151619] p-4">
            <div className="mb-3 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#087cff]" />
              <strong className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white">
                Coin bleu
              </strong>
            </div>

            <label>
              <span className={labelClass}>Combattant lié</span>
              <select
                value={draft.fighterBlueId}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    fighterBlueId: event.target.value,
                  }))
                }
                className={inputClass}
              >
                <option value="">À confirmer / mention manuelle</option>
                {fighters.map((fighter) => (
                  <option key={fighter.id} value={fighter.id}>
                    {fighterLabel(fighter)}
                  </option>
                ))}
              </select>
            </label>

            {!draft.fighterBlueId && (
              <label className="mt-3 block">
                <span className={labelClass}>Mention provisoire</span>
                <input
                  value={draft.fighterBlueMention}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      fighterBlueMention: event.target.value,
                    }))
                  }
                  placeholder="Nom ou @mention"
                  className={inputClass}
                />
              </label>
            )}
          </section>
        </div>

        <p className="border-l-2 border-[#087cff] bg-[#101114] px-3 py-2 text-[9px] leading-5 text-zinc-500">
          Une mention provisoire permet de préparer une affiche avant la création ou la liaison de la fiche combattant. Le statut « Confirmé » exige toutefois deux combattants liés.
        </p>

        {formError && (
          <p className="border border-red-500/30 bg-red-500/10 p-2.5 text-[10px] text-red-300">
            {formError}
          </p>
        )}
      </div>
    </OrganizerDialog>
  );
}
