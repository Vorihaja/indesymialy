'use client';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  BadgeCheck,
  CircleAlert,
  Save,
  Scale,
} from 'lucide-react';
import {
  OrganizerDialog,
  organizerButtonClass,
  organizerPrimaryButtonClass,
} from '../../components/OrganizerFeedback';
import {
  FIGHT_TYPE_OPTIONS,
  type FightWeightCategory,
  type FightWeightRuleset,
  type OperationalFightDraft,
  type OperationalFightItem,
} from '../types';

const inputClass =
  'h-10 w-full border border-[#343840] bg-[#0d0e10] px-3 text-[10px] text-zinc-200 outline-none focus:border-[#087cff] disabled:cursor-not-allowed disabled:opacity-50';

const labelClass =
  'text-[8px] font-bold uppercase tracking-[0.12em] text-zinc-600';

function activeVerifiedRulesets(
  fight: OperationalFightItem | null,
): FightWeightRuleset[] {
  return (
    fight?.weightRulesets ?? []
  ).filter(
    (ruleset) =>
      ruleset.isActive &&
      ruleset.verificationStatus === 'verified' &&
      ruleset.categories.some(
        (category) => category.isActive,
      ),
  );
}

function selectedCategoryForFight(
  fight: OperationalFightItem | null,
): FightWeightCategory | null {
  if (!fight?.weightCategoryId) {
    return null;
  }

  for (const ruleset of fight.weightRulesets) {
    const category = ruleset.categories.find(
      (item) => item.id === fight.weightCategoryId,
    );

    if (category) {
      return category;
    }
  }

  return null;
}

function defaultRulesetId(
  fight: OperationalFightItem | null,
) {
  if (!fight) return '';

  const selectedCategory =
    selectedCategoryForFight(fight);

  if (selectedCategory) {
    return selectedCategory.rulesetId;
  }

  const rulesets = activeVerifiedRulesets(fight);

  return (
    rulesets.find(
      (ruleset) => ruleset.isDefault,
    )?.id ??
    rulesets[0]?.id ??
    ''
  );
}

function initialDraft(
  fight: OperationalFightItem | null,
): OperationalFightDraft {
  return {
    weightCategoryId:
      fight?.weightCategoryId ?? null,
    weightCategory:
      fight?.weightCategory ?? '',
    scheduledRounds:
      fight?.scheduledRounds || 3,
    fightType:
      fight?.fightType || 'professional',
  };
}

function initialCustomMode(
  fight: OperationalFightItem | null,
) {
  if (!fight) return false;

  const policy = fight.weightPolicy;

  if (policy.mode === 'event_defined') {
    return true;
  }

  const verified = activeVerifiedRulesets(fight);

  if (
    policy.allowCustomCategory &&
    verified.length === 0
  ) {
    return true;
  }

  return (
    policy.allowCustomCategory &&
    !fight.weightCategoryId &&
    Boolean(fight.weightCategory.trim())
  );
}

function categoryGenderLabel(value: string) {
  if (value === 'male') return 'H';
  if (value === 'female') return 'F';
  if (value === 'mixed') return 'Mixte';
  return 'Tous';
}

export function FightConfigurationEditor({
  open,
  fight,
  saving,
  onClose,
  onSave,
}: {
  open: boolean;
  fight: OperationalFightItem | null;
  saving: boolean;
  onClose: () => void;
  onSave: (
    draft: OperationalFightDraft,
  ) => Promise<void>;
}) {
  const [draft, setDraft] =
    useState<OperationalFightDraft>(
      initialDraft(fight),
    );
  const [selectedRulesetId, setSelectedRulesetId] =
    useState(defaultRulesetId(fight));
  const [customMode, setCustomMode] =
    useState(initialCustomMode(fight));
  const [formError, setFormError] =
    useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    setDraft(initialDraft(fight));
    setSelectedRulesetId(
      defaultRulesetId(fight),
    );
    setCustomMode(
      initialCustomMode(fight),
    );
    setFormError(null);
  }, [fight, open]);

  const knownFightType = useMemo(
    () =>
      FIGHT_TYPE_OPTIONS.some(
        (option) =>
          option.value === draft.fightType,
      ),
    [draft.fightType],
  );

  const selectableRulesets = useMemo(
    () => activeVerifiedRulesets(fight),
    [fight],
  );

  const selectedRuleset = useMemo(
    () =>
      selectableRulesets.find(
        (ruleset) =>
          ruleset.id === selectedRulesetId,
      ) ??
      selectableRulesets[0] ??
      null,
    [selectableRulesets, selectedRulesetId],
  );

  const selectableCategories = useMemo(
    () =>
      (selectedRuleset?.categories ?? [])
        .filter((category) => category.isActive)
        .sort(
          (a, b) =>
            a.sortOrder - b.sortOrder ||
            a.displayLabel.localeCompare(
              b.displayLabel,
              'fr',
            ),
        ),
    [selectedRuleset],
  );

  if (!fight) {
    return null;
  }

  const policy = fight.weightPolicy;
  const policyNeedsWeight =
    policy.mode === 'ruleset' ||
    policy.mode === 'standard' ||
    policy.mode === 'event_defined';

  const forcedCustomMode =
    policy.mode === 'event_defined' ||
    (policy.allowCustomCategory &&
      selectableRulesets.length === 0 &&
      policyNeedsWeight);

  const canToggleCustom =
    policy.allowCustomCategory &&
    selectableRulesets.length > 0 &&
    (policy.mode === 'ruleset' ||
      policy.mode === 'standard');

  const effectiveCustomMode =
    forcedCustomMode || customMode;

  const policyLabel = (() => {
    switch (policy.mode) {
      case 'none':
        return 'Poids non applicable';
      case 'open_weight':
        return 'Open weight';
      case 'event_defined':
        return 'Catégorie définie par l’événement';
      case 'ruleset':
      case 'standard':
        return 'Référentiel réglementaire';
      default:
        return 'Politique non configurée';
    }
  })();

  const submit = async () => {
    try {
      setFormError(null);

      const payload: OperationalFightDraft = {
        ...draft,
        weightCategoryId:
          policy.mode === 'none' ||
          policy.mode === 'open_weight' ||
          policy.mode === 'unconfigured' ||
          effectiveCustomMode
            ? null
            : draft.weightCategoryId,
        weightCategory:
          effectiveCustomMode
            ? draft.weightCategory.trim()
            : '',
      };

      await onSave(payload);
    } catch (reason) {
      setFormError(
        reason instanceof Error
          ? reason.message
          : 'Impossible d’enregistrer la configuration.',
      );
    }
  };

  return (
    <OrganizerDialog
      open={open}
      eyebrow="Fight Center · Combats"
      title={`Configurer le combat #${fight.fightOrder}`}
      description="Les participants, la discipline et l’ordre restent pilotés par la Fight Card. La catégorie est maintenant contrôlée par le référentiel de la discipline."
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
            onClick={() => void submit()}
            disabled={saving}
            className={organizerPrimaryButtonClass}
          >
            <Save size={13} />
            {saving
              ? 'Enregistrement…'
              : 'Enregistrer'}
          </button>
        </>
      }
    >
      <div className="grid gap-4">
        <section className="grid gap-px border border-[#303238] bg-[#303238] sm:grid-cols-3">
          <div className="bg-[#101114] p-3">
            <span className={labelClass}>
              Coin rouge
            </span>
            <strong className="mt-1 block text-[10px] text-zinc-200">
              {fight.fighterRed.fullName}
            </strong>
          </div>

          <div className="bg-[#101114] p-3">
            <span className={labelClass}>
              Discipline
            </span>
            <strong className="mt-1 block text-[10px] text-zinc-200">
              {fight.disciplineName}
            </strong>
          </div>

          <div className="bg-[#101114] p-3">
            <span className={labelClass}>
              Coin bleu
            </span>
            <strong className="mt-1 block text-[10px] text-zinc-200">
              {fight.fighterBlue.fullName}
            </strong>
          </div>
        </section>

        <section className="border border-[#303238] bg-[#101114] p-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-2">
              <div className="grid h-8 w-8 place-items-center border border-[#2f4c7e] bg-[#10203a] text-[#57a0ff]">
                <Scale size={14} />
              </div>
              <div>
                <span className={labelClass}>
                  Politique de poids
                </span>
                <strong className="mt-1 block text-[10px] text-zinc-200">
                  {policyLabel}
                </strong>
                {policy.notes && (
                  <p className="mt-1 max-w-2xl text-[8px] leading-4 text-zinc-600">
                    {policy.notes}
                  </p>
                )}
              </div>
            </div>

            <span
              className={
                policy.configured
                  ? 'inline-flex items-center gap-1 border border-emerald-500/30 bg-emerald-500/5 px-2 py-1 text-[8px] font-bold uppercase tracking-[0.08em] text-emerald-400'
                  : 'inline-flex items-center gap-1 border border-amber-500/30 bg-amber-500/5 px-2 py-1 text-[8px] font-bold uppercase tracking-[0.08em] text-amber-400'
              }
            >
              {policy.configured ? (
                <BadgeCheck size={11} />
              ) : (
                <CircleAlert size={11} />
              )}
              {policy.configured
                ? 'Configurée'
                : 'À configurer'}
            </span>
          </div>
        </section>

        {(policy.mode === 'ruleset' ||
          policy.mode === 'standard') &&
          selectableRulesets.length > 0 && (
            <section className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1">
                <span className={labelClass}>
                  Ruleset
                </span>
                <select
                  value={
                    selectedRuleset?.id ?? ''
                  }
                  onChange={(event) => {
                    const nextRulesetId =
                      event.target.value;
                    setSelectedRulesetId(
                      nextRulesetId,
                    );
                    setDraft((current) => ({
                      ...current,
                      weightCategoryId: null,
                    }));
                  }}
                  className={inputClass}
                  disabled={
                    saving || effectiveCustomMode
                  }
                >
                  {selectableRulesets.map(
                    (ruleset) => (
                      <option
                        key={ruleset.id}
                        value={ruleset.id}
                      >
                        {ruleset.name}
                        {ruleset.governingBody
                          ? ` · ${ruleset.governingBody}`
                          : ''}
                      </option>
                    ),
                  )}
                </select>
              </label>

              {!effectiveCustomMode && (
                <label className="grid gap-1">
                  <span className={labelClass}>
                    Catégorie de poids
                  </span>
                  <select
                    value={
                      draft.weightCategoryId ?? ''
                    }
                    onChange={(event) => {
                      const id =
                        event.target.value || null;
                      setDraft((current) => ({
                        ...current,
                        weightCategoryId: id,
                      }));
                    }}
                    className={inputClass}
                    disabled={saving}
                  >
                    <option value="">
                      À sélectionner
                    </option>
                    {selectableCategories.map(
                      (category) => (
                        <option
                          key={category.id}
                          value={category.id}
                        >
                          {categoryGenderLabel(
                            category.gender,
                          )}{' '}
                          · {category.displayLabel}
                        </option>
                      ),
                    )}
                  </select>
                </label>
              )}
            </section>
          )}

        {canToggleCustom && (
          <label className="flex items-center gap-2 border border-[#303238] bg-[#0f1012] px-3 py-2 text-[9px] text-zinc-500">
            <input
              type="checkbox"
              checked={customMode}
              onChange={(event) => {
                setCustomMode(
                  event.target.checked,
                );
                setDraft((current) => ({
                  ...current,
                  weightCategoryId: null,
                  weightCategory: '',
                }));
              }}
              disabled={saving}
            />
            Utiliser exceptionnellement une catégorie personnalisée
          </label>
        )}

        {effectiveCustomMode && policyNeedsWeight && (
          <label className="grid gap-1">
            <span className={labelClass}>
              Catégorie personnalisée *
            </span>
            <input
              value={draft.weightCategory}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  weightCategory:
                    event.target.value,
                  weightCategoryId: null,
                }))
              }
              className={inputClass}
              placeholder="Ex. -70 kg / Open / catégorie événement"
              disabled={saving}
            />
            <span className="text-[8px] leading-4 text-amber-400/80">
              Cette valeur n’est pas liée à une catégorie réglementaire. Le Fight Center la signalera comme personnalisée.
            </span>
          </label>
        )}

        {policy.mode === 'none' && (
          <div className="border border-emerald-500/25 bg-emerald-500/5 px-3 py-2 text-[9px] leading-5 text-emerald-300/80">
            Cette discipline ne requiert pas de catégorie de poids selon sa politique Indesy. Aucun poids ne bloque le readiness.
          </div>
        )}

        {policy.mode === 'open_weight' && (
          <div className="border border-emerald-500/25 bg-emerald-500/5 px-3 py-2 text-[9px] leading-5 text-emerald-300/80">
            Cette discipline est configurée en Open Weight. Aucune catégorie réglementaire n’est requise.
          </div>
        )}

        {policy.mode === 'unconfigured' && (
          <div className="border border-amber-500/25 bg-amber-500/5 px-3 py-2 text-[9px] leading-5 text-amber-300/80">
            Aucune politique de poids Indesy n’est encore définie pour cette discipline. Le poids est affiché comme avertissement non bloquant jusqu’à configuration du référentiel.
          </div>
        )}

        {(policy.mode === 'ruleset' ||
          policy.mode === 'standard') &&
          selectableRulesets.length === 0 &&
          !policy.allowCustomCategory && (
            <div className="border border-red-500/25 bg-red-500/5 px-3 py-2 text-[9px] leading-5 text-red-300/80">
              Aucun ruleset vérifié et actif avec catégories n’est disponible pour cette discipline. La catégorie restera bloquante jusqu’à publication d’un référentiel.
            </div>
          )}

        <section className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1">
            <span className={labelClass}>
              Nombre de rounds *
            </span>
            <input
              type="number"
              min={1}
              max={12}
              step={1}
              value={draft.scheduledRounds}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  scheduledRounds:
                    Number(event.target.value),
                }))
              }
              className={inputClass}
              disabled={saving}
            />
          </label>

          <label className="grid gap-1">
            <span className={labelClass}>
              Type de combat *
            </span>
            <select
              value={draft.fightType}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  fightType: event.target.value,
                }))
              }
              className={inputClass}
              disabled={saving}
            >
              {!knownFightType &&
                draft.fightType && (
                  <option value={draft.fightType}>
                    {draft.fightType}
                  </option>
                )}

              {FIGHT_TYPE_OPTIONS.map(
                (option) => (
                  <option
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                ),
              )}
            </select>
          </label>
        </section>

        <div className="border-l-2 border-[#087cff] bg-[#101114] px-3 py-2 text-[9px] leading-5 text-zinc-500">
          Modifier cette configuration repasse automatiquement un combat déjà marqué « prêt » au statut « planifié ». Il devra être revalidé après recalcul du readiness.
        </div>

        {formError && (
          <div className="border border-red-500/30 bg-red-500/5 px-3 py-2 text-[9px] leading-5 text-red-300">
            {formError}
          </div>
        )}
      </div>
    </OrganizerDialog>
  );
}
