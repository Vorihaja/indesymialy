'use client';

import {
  Archive,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CircleDollarSign,
  FileText,
  PencilLine,
  Plus,
  RefreshCcw,
  Search,
  Tags,
  Undo2,
  WalletCards,
  X,
} from 'lucide-react';
import {
  FormEvent,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  useIndesyDialog,
} from '@/components/ui/indesy-dialog';
import {
  useFinance,
  type SaveFinanceOperationInput,
} from '../hooks/useFinance';
import type {
  FinanceCategory,
  FinanceLedgerEntry,
  FinanceManualOperationDetails,
  FinanceOperationType,
  FinanceTab,
} from '../types';
import { ownerContextKey } from '../owner-context';

import { getFinanceRoleCapabilities } from '../role-capabilities';

import { SellerFinanceAdapter } from './SellerFinanceAdapter';

import { FinanceDomainAdapter } from './FinanceDomainAdapter';

function money(
  value: number,
  currencyCode = 'MGA',
) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currencyCode,
    maximumFractionDigits: 0,
  }).format(value);
}

function dateLabel(value: string) {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(
    'fr-FR',
    {
      dateStyle: 'medium',
    },
  ).format(date);
}

function FinanceLoader() {
  return (
    <div className="grid min-h-[320px] place-items-center">
      <div className="relative h-16 w-16">
        <span className="absolute inset-0 animate-spin border border-blue-500 border-r-transparent" />
        <span className="absolute inset-3 animate-[spin_1.25s_linear_infinite_reverse] border border-red-500 border-l-transparent" />
        <span className="absolute inset-[27px] bg-white" />
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  detail,
  icon,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  detail: string;
  icon: React.ReactNode;
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info';
}) {
  return (
    <div className="finance-kpi border p-4" data-tone={tone}>
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">
          {label}
        </span>
        <span className="finance-kpi-icon">
          {icon}
        </span>
      </div>

      <strong className="finance-kpi-value mt-3 block text-[22px] font-semibold" data-kpi-value>
        {value}
      </strong>

      <span className="mt-1 block text-[9px] text-slate-400">
        {detail}
      </span>
    </div>
  );
}

function typeLabel(
  entry: FinanceLedgerEntry,
) {
  return entry.entryType === 'income'
    ? 'Revenu'
    : 'Dépense';
}

function typeTone(
  entry: FinanceLedgerEntry,
) {
  return entry.entryType === 'income'
    ? 'erp-text-success'
    : 'erp-text-danger';
}

function categoryLabel(
  entry: FinanceLedgerEntry,
) {
  if (entry.categoryName) {
    return entry.categoryName;
  }

  if (entry.sourceType) {
    return entry.sourceType
      .replaceAll('_', ' ')
      .replaceAll('-', ' ');
  }

  return 'Autre';
}

function isCorrectableManualEntry(
  entry: FinanceLedgerEntry,
) {
  return (
    entry.isManual &&
    Boolean(entry.manualOperationId) &&
    !entry.reversedAt &&
    entry.paymentKind !== 'refund' &&
    entry.sourceType ===
      'manual_finance_operation'
  );
}

function datetimeLocalValue(
  value?: string,
) {
  if (!value) return '';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value.slice(0, 16);
  }

  const localDate = new Date(
    date.getTime() -
      date.getTimezoneOffset() * 60_000,
  );

  return localDate.toISOString().slice(0, 16);
}

function activeCategoryId(
  categoryId: string | null | undefined,
  operationType: FinanceOperationType,
  categories: FinanceCategory[],
) {
  if (!categoryId) return undefined;

  return categories.some(
    (category) =>
      category.id === categoryId &&
      category.operationType === operationType &&
      !category.archivedAt,
  )
    ? categoryId
    : undefined;
}

function correctionDraftFromEntry(
  entry: FinanceLedgerEntry,
  categories: FinanceCategory[],
): SaveFinanceOperationInput {
  const operationType =
    entry.manualOperationType ??
    entry.entryType;

  return {
    operationType,
    amount: Math.abs(entry.amount),
    currencyCode: entry.currencyCode,
    categoryId: activeCategoryId(
      entry.categoryId,
      operationType,
      categories,
    ),
    categoryName:
      entry.categoryName ??
      categoryLabel(entry),
    description: entry.description,
    occurredAt: entry.occurredAt,
    reference: entry.reference ?? undefined,
    paymentMethod:
      entry.paymentMethod ?? undefined,
    counterpartyName:
      entry.counterpartyName ?? undefined,
    receiptPath:
      entry.receiptPath ?? undefined,
  };
}

function correctionDraftFromDetails(
  operation: FinanceManualOperationDetails,
  categories: FinanceCategory[],
): SaveFinanceOperationInput {
  return {
    operationType: operation.operationType,
    amount: operation.amount,
    currencyCode: operation.currencyCode,
    categoryId: activeCategoryId(
      operation.categoryId,
      operation.operationType,
      categories,
    ),
    categoryName: operation.categoryName,
    description: operation.description,
    occurredAt: operation.occurredAt,
    reference: operation.reference ?? undefined,
    paymentMethod:
      operation.paymentMethod ?? undefined,
    counterpartyName:
      operation.counterpartyName ?? undefined,
    notes: operation.notes ?? undefined,
    receiptPath:
      operation.receiptPath ?? undefined,
  };
}

type OperationDialogMode =
  | 'create'
  | 'correction';

type OperationDialogState = {
  mode: OperationDialogMode;
  defaultType: FinanceOperationType;
  initialValues?: SaveFinanceOperationInput;
  sourceOperationId?: string;
};

function TransactionsTable({
  entries,
  onReverse,
  onCorrect,
  canCorrect,
  correctingOperationId,
  saving,
}: {
  entries: FinanceLedgerEntry[];
  onReverse: (
    entry: FinanceLedgerEntry,
  ) => void;
  onCorrect: (
    entry: FinanceLedgerEntry,
  ) => void;
  canCorrect: boolean;
  correctingOperationId: string | null;
  saving: boolean;
}) {
  return (
    <section className="min-w-0 border border-[#2d333d] bg-[#11151a]">
      <header className="flex items-center justify-between border-b border-[#2d333d] px-4 py-3">
        <div>
          <span className="block text-[8px] font-bold uppercase tracking-[0.12em] text-slate-500">
            Registre financier
          </span>
          <h3 className="mt-0.5 text-[12px] font-semibold text-slate-100">
            Mouvements comptabilisés
          </h3>
        </div>

        <span className="text-[9px] text-slate-500">
          {entries.length} opération(s)
        </span>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-left">
          <thead className="bg-[#171c23] text-[8px] uppercase tracking-[0.1em] text-slate-500">
            <tr>
              {[
                'Date',
                'Type',
                'Libellé',
                'Catégorie',
                'Référence',
                'Montant',
                'Source',
                'Action',
              ].map((head) => (
                <th
                  key={head}
                  className="border-b border-[#2d333d] px-3 py-2 font-semibold"
                >
                  {head}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {entries.map((entry) => (
              <tr
                key={entry.entryId}
                className="border-b border-[#242a33] text-[10px] text-slate-300 hover:bg-white/[0.025]"
              >
                <td className="px-3 py-3">
                  {dateLabel(entry.occurredAt)}
                </td>

                <td className={`px-3 py-3 font-semibold ${typeTone(entry)}`}>
                  {typeLabel(entry)}
                </td>

                <td className="max-w-[260px] px-3 py-3">
                  <strong className="block truncate text-slate-100">
                    {entry.description}
                  </strong>

                  {entry.counterpartyName && (
                    <span className="mt-0.5 block truncate text-[9px] text-slate-500">
                      {entry.counterpartyName}
                    </span>
                  )}
                </td>

                <td className="px-3 py-3">
                  <span
                    data-indesy-tag="true"
                    className="erp-semantic-badge inline-flex px-2 py-1 text-[8px] font-semibold"
                    data-tone="info"
                  >
                    {categoryLabel(entry)}
                  </span>
                </td>

                <td className="px-3 py-3 text-slate-400">
                  {entry.reference || '—'}
                </td>

                <td className={`px-3 py-3 font-semibold ${typeTone(entry)}`}>
                  {entry.entryType === 'income'
                    ? '+ '
                    : '- '}
                  {money(
                    entry.amount,
                    entry.currencyCode,
                  )}
                </td>

                <td className="px-3 py-3 text-slate-400">
                  {entry.isManual
                    ? 'Manuel'
                    : entry.sourceType || 'Métier'}
                </td>

                <td className="px-3 py-3">
                  {isCorrectableManualEntry(
                    entry,
                  ) ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() =>
                          onReverse(entry)
                        }
                        className="erp-action-danger inline-flex items-center gap-1 border px-2 py-1 text-[8px] disabled:opacity-40"
                      >
                        <Undo2 size={11} />
                        Contre-passer
                      </button>

                      {canCorrect && (
                        <button
                          type="button"
                          disabled={
                            saving ||
                            correctingOperationId ===
                              entry.manualOperationId
                          }
                          onClick={() =>
                            onCorrect(entry)
                          }
                          className="erp-action-info inline-flex items-center gap-1 border px-2 py-1 text-[8px] disabled:opacity-40"
                        >
                          <PencilLine size={11} />
                          Corriger
                        </button>
                      )}
                    </div>
                  ) : entry.reversedAt ? (
                    <span className="finance-status erp-semantic-badge text-[8px]" data-tone="danger" data-status="cancelled">
                      Annulée
                    </span>
                  ) : (
                    <span className="finance-status erp-semantic-badge text-[8px]" data-tone="neutral" data-status="posted">
                      Comptabilisée
                    </span>
                  )}
                </td>
              </tr>
            ))}

            {entries.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-12 text-center text-[10px] text-slate-500"
                >
                  Aucun mouvement financier pour le moment.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function CategoriesView({
  categories,
  saving,
  onCreate,
  onRename,
  onArchive,
}: {
  categories: FinanceCategory[];
  saving: boolean;
  onCreate: (
    type: FinanceOperationType,
    name: string,
  ) => Promise<void>;
  onRename: (
    category: FinanceCategory,
  ) => Promise<void>;
  onArchive: (
    category: FinanceCategory,
  ) => Promise<void>;
}) {
  const [type, setType] =
    useState<FinanceOperationType>(
      'expense',
    );

  const [name, setName] =
    useState('');

  async function submit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const nextName = name.trim();

    if (!nextName) return;

    await onCreate(type, nextName);
    setName('');
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[360px_1fr]">
      <section className="border border-[#2d333d] bg-[#11151a] p-4">
        <span className="text-[8px] font-bold uppercase tracking-[0.12em] text-blue-400">
          Catégories personnalisées
        </span>

        <h3 className="mt-1 text-[14px] font-semibold text-white">
          Nouvelle catégorie
        </h3>

        <p className="mt-2 text-[10px] leading-5 text-slate-400">
          Crée tes propres catégories de revenus ou de dépenses.
          Elles seront proposées automatiquement dans la saisie
          d’une nouvelle opération.
        </p>

        <form
          onSubmit={submit}
          className="mt-5 grid gap-3"
        >
          <label className="grid gap-1">
            <span className="text-[9px] font-semibold text-slate-300">
              Type
            </span>

            <select
              value={type}
              onChange={(event) =>
                setType(
                  event.target
                    .value as FinanceOperationType,
                )
              }
              className="h-9 border border-[#36404d] bg-[#171c23] px-2 text-[10px] text-white outline-none focus:border-blue-500"
            >
              <option value="expense">
                Dépense
              </option>
              <option value="income">
                Revenu
              </option>
            </select>
          </label>

          <label className="grid gap-1">
            <span className="text-[9px] font-semibold text-slate-300">
              Nom
            </span>

            <input
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              placeholder="Ex. Transport"
              className="h-9 border border-[#36404d] bg-[#171c23] px-2 text-[10px] text-white outline-none focus:border-blue-500"
            />
          </label>

          <button
            disabled={saving}
            className="finance-primary-action mt-1 inline-flex h-9 items-center justify-center gap-2 px-3 text-[10px] font-semibold text-white disabled:opacity-40"
          >
            <Plus size={13} />
            Ajouter la catégorie
          </button>
        </form>
      </section>

      <section className="border border-[#2d333d] bg-[#11151a]">
        <header className="border-b border-[#2d333d] px-4 py-3">
          <span className="text-[8px] uppercase tracking-[0.12em] text-slate-500">
            Référentiel personnel
          </span>

          <h3 className="text-[12px] font-semibold text-white">
            Catégories actives
          </h3>
        </header>

        <div className="divide-y divide-[#272e38]">
          {categories.map((category) => (
            <div
              key={category.id}
              className="flex items-center gap-3 px-4 py-3"
            >
              <span
                data-indesy-tag="true"
                className="erp-semantic-badge inline-flex min-w-[70px] justify-center px-2 py-1 text-[8px] font-semibold"
                data-tone={category.operationType === 'income' ? 'success' : 'danger'}
              >
                {category.operationType ===
                'income'
                  ? 'Revenu'
                  : 'Dépense'}
              </span>

              <div className="min-w-0 flex-1">
                <strong className="block truncate text-[11px] text-slate-100">
                  {category.name}
                </strong>

                <span className="text-[8px] text-slate-500">
                  Catégorie personnalisée
                </span>
              </div>

              <button
                type="button"
                disabled={saving}
                onClick={() =>
                  void onRename(category)
                }
                className="erp-action-info border px-2 py-1 text-[8px]"
              >
                Renommer
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={() =>
                  void onArchive(category)
                }
                className="erp-action-danger grid h-7 w-7 place-items-center border"
                title="Archiver"
              >
                <Archive size={12} />
              </button>
            </div>
          ))}

          {categories.length === 0 && (
            <div className="px-4 py-12 text-center text-[10px] text-slate-500">
              Aucune catégorie personnalisée.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function OperationDialog({
  mode,
  defaultType,
  defaultCurrencyCode,
  initialValues,
  categories,
  saving,
  error,
  onClose,
  onCreateCategory,
  onSave,
}: {
  mode: OperationDialogMode;
  defaultType: FinanceOperationType;
  defaultCurrencyCode: string;
  initialValues?: SaveFinanceOperationInput;
  categories: FinanceCategory[];
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onCreateCategory: (
    type: FinanceOperationType,
    name: string,
  ) => Promise<string>;
  onSave: (
    input: SaveFinanceOperationInput,
  ) => Promise<void>;
}) {
  const [operationType, setOperationType] =
    useState<FinanceOperationType>(
      defaultType,
    );

  const compatibleCategories =
    categories.filter(
      (item) =>
        item.operationType ===
        operationType,
    );

  const initialActiveCategoryId =
    activeCategoryId(
      initialValues?.categoryId,
      operationType,
      compatibleCategories,
    );

  const preservedCategoryAvailable =
    mode === 'correction' &&
    operationType ===
      initialValues?.operationType &&
    Boolean(initialValues?.categoryName) &&
    !initialActiveCategoryId;

  const [categoryValue, setCategoryValue] =
    useState(
      initialActiveCategoryId ??
        (preservedCategoryAvailable
          ? '__preserved__'
          : ''),
    );

  const [newCategory, setNewCategory] =
    useState('');

  const [localError, setLocalError] =
    useState<string | null>(null);

  const [submitting, setSubmitting] =
    useState(false);

  const submitInFlightRef =
    useRef(false);

  const dialogBusy =
    saving || submitting;

  const creatingCategory =
    categoryValue === '__new__' ||
    (compatibleCategories.length === 0 &&
      categoryValue !== '__preserved__');

  async function submitOperation(
    formElement: HTMLFormElement,
  ) {
    setLocalError(null);

    const form =
      new FormData(formElement);

    let categoryId =
      categoryValue &&
      categoryValue !== '__new__' &&
      categoryValue !== '__preserved__'
        ? categoryValue
        : undefined;

    let categoryName = '';

    if (categoryId) {
      categoryName =
        compatibleCategories.find(
          (item) =>
            item.id === categoryId,
        )?.name ?? '';
    } else if (
      categoryValue === '__preserved__' &&
      preservedCategoryAvailable
    ) {
      categoryName =
        initialValues?.categoryName ?? '';
    } else {
      categoryName =
        newCategory.trim();

      if (!categoryName) {
        throw new Error(
          'Saisissez le nom de la nouvelle catégorie.',
        );
      }

      categoryId =
        await onCreateCategory(
          operationType,
          categoryName,
        );
    }

    await onSave({
      operationType,
      amount: Number(
        form.get('amount') ?? 0,
      ),
      currencyCode:
        String(
          form.get('currencyCode') ??
            defaultCurrencyCode,
        )
          .trim()
          .toUpperCase() ||
        defaultCurrencyCode,
      categoryId,
      categoryName,
      description: String(
        form.get('description') ?? '',
      ),
      occurredAt:
        String(form.get('occurredAt') ?? '') ||
        undefined,
      reference:
        String(form.get('reference') ?? '') ||
        undefined,
      paymentMethod:
        String(form.get('paymentMethod') ?? '') ||
        undefined,
      counterpartyName:
        String(
          form.get('counterpartyName') ??
            '',
        ) || undefined,
      notes:
        String(form.get('notes') ?? '') ||
        undefined,
      receiptPath:
        String(form.get('receiptPath') ?? '') ||
        undefined,
    });
  }

  async function submit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (submitInFlightRef.current) {
      return;
    }

    submitInFlightRef.current = true;
    setSubmitting(true);

    try {
      await submitOperation(
        event.currentTarget,
      );
    } finally {
      submitInFlightRef.current = false;
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[250] grid place-items-center bg-black/80 p-4"
      role="dialog"
      aria-modal="true"
      onMouseDown={(event) => {
        if (
          !dialogBusy &&
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto border border-[#3b4654] bg-[#101419] shadow-2xl">
        <header className="flex items-center justify-between border-b border-[#303844] px-4 py-3">
          <div>
            <span className="text-[8px] font-bold uppercase tracking-[0.13em] text-blue-400">
              {mode === 'correction'
                ? 'Correction financière'
                : 'Nouvelle opération'}
            </span>

            <strong className="mt-0.5 block text-[13px] text-white">
              {mode === 'correction'
                ? 'Corriger l’opération'
                : 'Ajouter un revenu ou une dépense'}
            </strong>
          </div>

          <button
            type="button"
            disabled={dialogBusy}
            onClick={onClose}
            className="grid h-8 w-8 place-items-center border border-[#37404c] text-slate-400 hover:text-white disabled:opacity-40"
          >
            <X size={14} />
          </button>
        </header>

        <form
          onSubmit={(event) => {
            void submit(event).catch(
              (cause) => {
                setLocalError(
                  cause instanceof Error
                    ? cause.message
                    : 'Impossible d’enregistrer l’opération.',
                );
              },
            );
          }}
          className="grid gap-4 p-4"
        >
          {mode === 'correction' && (
            <div className="erp-semantic-alert border-l-2 px-3 py-2 text-[9px] leading-5" data-tone="info">
              La contre-passation est enregistrée. Cet enregistrement
              créera une nouvelle écriture ; fermer ce formulaire ne
              restaurera pas l’opération originale.
            </div>
          )}

          {(error || localError) && (
            <div className="erp-semantic-alert border px-3 py-2 text-[9px]" data-tone="warning">
              {error || localError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setOperationType('income');
                setCategoryValue('');
              }}
              className={`h-11 border text-[10px] font-semibold ${
                operationType === 'income'
                  ? 'border-emerald-500 bg-emerald-950/40 text-emerald-300'
                  : 'border-[#343d49] bg-[#171c23] text-slate-400'
              }`}
            >
              <span className="inline-flex items-center gap-2">
                <ArrowUpRight size={14} />
                Revenu
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setOperationType('expense');
                setCategoryValue('');
              }}
              className={`h-11 border text-[10px] font-semibold ${
                operationType === 'expense'
                  ? 'border-red-500 bg-red-950/30 text-red-300'
                  : 'border-[#343d49] bg-[#171c23] text-slate-400'
              }`}
            >
              <span className="inline-flex items-center gap-2">
                <ArrowDownRight size={14} />
                Dépense
              </span>
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <label className="grid gap-1">
              <span className="text-[9px] font-semibold text-slate-300">
                Montant (Ar) *
              </span>

              <input
                name="amount"
                type="number"
                min="1"
                step="1"
                required
                defaultValue={
                  initialValues?.amount
                }
                className="h-9 border border-[#36404d] bg-[#171c23] px-2.5 text-[11px] text-white outline-none focus:border-blue-500"
              />
            </label>

            <label className="grid gap-1">
              <span className="text-[9px] font-semibold text-slate-300">
                Devise
              </span>

              <input
                name="currencyCode"
                required
                maxLength={3}
                defaultValue={
                  initialValues?.currencyCode ??
                  defaultCurrencyCode
                }
                className="h-9 border border-[#36404d] bg-[#171c23] px-2.5 text-[10px] uppercase text-white outline-none focus:border-blue-500"
              />
            </label>

            <label className="grid gap-1">
              <span className="text-[9px] font-semibold text-slate-300">
                Date
              </span>

              <input
                name="occurredAt"
                type="datetime-local"
                defaultValue={
                  datetimeLocalValue(
                    initialValues?.occurredAt,
                  )
                }
                className="h-9 border border-[#36404d] bg-[#171c23] px-2.5 text-[10px] text-white outline-none focus:border-blue-500"
              />
            </label>
          </div>

          <label className="grid gap-1">
            <span className="text-[9px] font-semibold text-slate-300">
              Catégorie *
            </span>

            <select
              value={
                categoryValue ||
                (compatibleCategories.length === 0
                  ? '__new__'
                  : '')
              }
              onChange={(event) =>
                setCategoryValue(
                  event.target.value,
                )
              }
              className="h-9 border border-[#36404d] bg-[#171c23] px-2.5 text-[10px] text-white outline-none focus:border-blue-500"
            >
              {compatibleCategories.length >
                0 && (
                <option value="">
                  Choisir une catégorie
                </option>
              )}

              {preservedCategoryAvailable && (
                <option value="__preserved__">
                  {initialValues?.categoryName}
                  {' — catégorie d’origine indisponible'}
                </option>
              )}

              {compatibleCategories.map(
                (category) => (
                  <option
                    key={category.id}
                    value={category.id}
                  >
                    {category.name}
                  </option>
                ),
              )}

              <option value="__new__">
                + Créer une catégorie
              </option>
            </select>
          </label>

          {creatingCategory && (
            <label className="grid gap-1 border-l-2 border-blue-500 pl-3">
              <span className="text-[9px] font-semibold text-blue-300">
                Nouvelle catégorie
              </span>

              <input
                value={newCategory}
                onChange={(event) =>
                  setNewCategory(
                    event.target.value,
                  )
                }
                placeholder={
                  operationType === 'income'
                    ? 'Ex. Sponsoring'
                    : 'Ex. Transport'
                }
                className="h-9 border border-blue-800 bg-blue-950/20 px-2.5 text-[10px] text-white outline-none focus:border-blue-500"
              />

              <span className="text-[8px] text-slate-500">
                Elle sera enregistrée et réutilisable dans les prochaines opérations.
              </span>
            </label>
          )}

          <label className="grid gap-1">
            <span className="text-[9px] font-semibold text-slate-300">
              Libellé *
            </span>

            <input
              name="description"
              required
              defaultValue={
                initialValues?.description
              }
              placeholder="Ex. Paiement location de salle"
              className="h-9 border border-[#36404d] bg-[#171c23] px-2.5 text-[10px] text-white outline-none focus:border-blue-500"
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1">
              <span className="text-[9px] font-semibold text-slate-300">
                Moyen
              </span>

              <select
                name="paymentMethod"
                defaultValue={
                  initialValues?.paymentMethod ??
                  ''
                }
                className="h-9 border border-[#36404d] bg-[#171c23] px-2.5 text-[10px] text-white"
              >
                <option value="">
                  Non précisé
                </option>
                <option>Espèces</option>
                <option>Mobile Money</option>
                <option>Virement</option>
                <option>Carte</option>
                <option>Chèque</option>
                <option>Autre</option>
              </select>
            </label>

            <label className="grid gap-1">
              <span className="text-[9px] font-semibold text-slate-300">
                Référence
              </span>

              <input
                name="reference"
                defaultValue={
                  initialValues?.reference
                }
                placeholder="FAC-001 / TRX-..."
                className="h-9 border border-[#36404d] bg-[#171c23] px-2.5 text-[10px] text-white outline-none focus:border-blue-500"
              />
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1">
              <span className="text-[9px] font-semibold text-slate-300">
                Contrepartie
              </span>

              <input
                name="counterpartyName"
                defaultValue={
                  initialValues?.counterpartyName
                }
                placeholder="Client, fournisseur..."
                className="h-9 border border-[#36404d] bg-[#171c23] px-2.5 text-[10px] text-white outline-none focus:border-blue-500"
              />
            </label>

            <label className="grid gap-1">
              <span className="text-[9px] font-semibold text-slate-300">
                Justificatif
              </span>

              <input
                name="receiptPath"
                defaultValue={
                  initialValues?.receiptPath
                }
                placeholder="URL ou chemin du justificatif"
                className="h-9 border border-[#36404d] bg-[#171c23] px-2.5 text-[10px] text-white outline-none focus:border-blue-500"
              />
            </label>
          </div>

          <label className="grid gap-1">
            <span className="text-[9px] font-semibold text-slate-300">
              Notes
            </span>

            <textarea
              name="notes"
              rows={3}
              defaultValue={
                initialValues?.notes
              }
              className="border border-[#36404d] bg-[#171c23] p-2.5 text-[10px] text-white outline-none focus:border-blue-500"
            />
          </label>

          <footer className="flex justify-end gap-2 border-t border-[#303844] pt-4">
            <button
              type="button"
              disabled={dialogBusy}
              onClick={onClose}
              className="h-9 border border-[#39414d] px-4 text-[10px] font-semibold text-slate-300 hover:text-white disabled:opacity-40"
            >
              Annuler
            </button>

            <button
              disabled={dialogBusy}
              data-status={dialogBusy ? 'pending' : undefined}
              className="finance-primary-action h-9 px-4 text-[10px] font-semibold text-white disabled:opacity-40"
            >
              {dialogBusy
                ? 'Enregistrement...'
                : mode === 'correction'
                  ? 'Créer la correction'
                  : 'Enregistrer'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}

export function FinanceWorkspace({
  role,
  initialTab = 'overview',
}: {
  role: string;
  initialTab?: FinanceTab;
}) {
  const dialog = useIndesyDialog();
  const finance = useFinance(role);

  // INDESY FIN-2E1 ROLE-AWARE FINANCE
  const roleCapabilities =
    getFinanceRoleCapabilities(role);

  const safeInitialTab: FinanceTab =
    roleCapabilities.allowedTabs.includes(
      initialTab,
    )
      ? initialTab
      : 'overview';

  const [activeTab, setActiveTab] =
    useState<FinanceTab>(safeInitialTab);

  const [search, setSearch] =
    useState('');

  const [operationDialog, setOperationDialog] =
    useState<OperationDialogState | null>(
      null,
    );

  const [correctingOperationId, setCorrectingOperationId] =
    useState<string | null>(null);

  const correctionInFlightRef =
    useRef<string | null>(null);

  const [correctionNotice, setCorrectionNotice] =
    useState<string | null>(null);

  const filteredEntries = useMemo(() => {
    let items = finance.entries;

    if (activeTab === 'income') {
      items = items.filter(
        (entry) =>
          entry.entryType === 'income',
      );
    }

    if (activeTab === 'expenses') {
      items = items.filter(
        (entry) =>
          entry.entryType === 'expense',
      );
    }

    const query =
      search.trim().toLowerCase();

    if (!query) {
      return items;
    }

    return items.filter((entry) =>
      [
        entry.description,
        entry.reference ?? '',
        entry.categoryName ?? '',
        entry.counterpartyName ?? '',
        entry.sourceType,
      ]
        .join(' ')
        .toLowerCase()
        .includes(query),
    );
  }, [
    activeTab,
    finance.entries,
    search,
  ]);

  const categoryBreakdown = useMemo(() => {
    const totals = new Map<
      string,
      number
    >();

    for (const entry of finance.entries) {
      if (entry.entryType !== 'expense') {
        continue;
      }

      const category =
        categoryLabel(entry);

      totals.set(
        category,
        (totals.get(category) ?? 0) +
          entry.amount,
      );
    }

    return Array.from(totals.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [finance.entries]);

  const maxCategoryAmount =
    categoryBreakdown[0]?.[1] ?? 0;

  function openCreateDialog(
    defaultType: FinanceOperationType,
  ) {
    setCorrectionNotice(null);
    setOperationDialog({
      mode: 'create',
      defaultType,
    });
  }

  function closeOperationDialog() {
    if (operationDialog?.mode === 'correction') {
      setCorrectionNotice(
        'La contre-passation a été enregistrée. Aucune nouvelle opération de correction n’a été créée.',
      );
    }

    setOperationDialog(null);
  }

  async function createCategory(
    type: FinanceOperationType,
    name: string,
  ) {
    return finance.createCategory(
      type,
      name,
    );
  }

  async function saveOperation(
    input: SaveFinanceOperationInput,
  ) {
    await finance.saveOperation(input);
    setCorrectionNotice(null);
    setOperationDialog(null);
  }

  async function renameCategory(
    category: FinanceCategory,
  ) {
    const value = await dialog.prompt({
      title: 'Renommer la catégorie',
      description:
        'Le nouvel intitulé sera utilisé pour les prochaines opérations.',
      label: 'Nom de la catégorie',
      defaultValue: category.name,
      confirmLabel: 'Renommer',
      cancelLabel: 'Annuler',
      validate: (nextValue) =>
        nextValue.trim()
          ? null
          : 'Le nom de la catégorie est requis.',
    });

    if (
      !value ||
      value.trim() === category.name
    ) {
      return;
    }

    await finance.updateCategory(
      category.id,
      value.trim(),
    );
  }

  async function archiveCategory(
    category: FinanceCategory,
  ) {
    const confirmed =
      await dialog.confirm({
        title: `Archiver « ${category.name} » ?`,
        description:
          'La catégorie ne sera plus proposée pour les nouvelles opérations. L’historique restera inchangé.',
        confirmLabel: 'Archiver',
        cancelLabel: 'Annuler',
        tone: 'danger',
      });

    if (!confirmed) return;

    await finance.archiveCategory(
      category.id,
    );
  }

  async function reverseEntry(
    entry: FinanceLedgerEntry,
  ) {
    if (!entry.manualOperationId) {
      return;
    }

    const confirmed =
      await dialog.confirm({
        title:
          'Contre-passer cette opération ?',
        description:
          'L’écriture originale restera dans l’historique et une écriture comptable inverse sera créée.',
        confirmLabel: 'Contre-passer',
        cancelLabel: 'Annuler',
        tone: 'danger',
      });

    if (!confirmed) return;

    const reason = await dialog.prompt({
      title: 'Motif de la contre-passation',
      description:
        'Ce motif accompagnera l’écriture inverse dans l’historique.',
      label: 'Motif',
      placeholder: 'Décrire la raison',
      confirmLabel: 'Continuer',
      cancelLabel: 'Annuler',
    });

    if (reason === null) return;

    try {
      await finance.reverseOperation(
        entry.manualOperationId,
        reason || undefined,
      );
    } catch {
      // useFinance conserve le message original dans l'état d'erreur.
    }
  }

  async function correctEntry(
    entry: FinanceLedgerEntry,
  ) {
    const operationId =
      entry.manualOperationId;

    if (
      !roleCapabilities.canCreateManualOperation ||
      !operationId ||
      !isCorrectableManualEntry(entry) ||
      correctionInFlightRef.current
    ) {
      return;
    }

    correctionInFlightRef.current =
      operationId;
    setCorrectingOperationId(operationId);

    try {
      const displayedSnapshot =
        correctionDraftFromEntry(
          entry,
          finance.categories,
        );

      const confirmed =
        await dialog.confirm({
          title: 'Corriger cette opération ?',
          description:
            'L’opération originale sera d’abord contre-passée. Le formulaire de la nouvelle écriture s’ouvrira uniquement après ce succès.',
          confirmLabel: 'Continuer',
          cancelLabel: 'Annuler',
          tone: 'danger',
        });

      if (!confirmed) return;

      const reason = await dialog.prompt({
        title: 'Motif de la correction',
        description:
          'Ce motif accompagnera la contre-passation dans l’historique.',
        label: 'Motif',
        defaultValue:
          'Correction de l’opération',
        confirmLabel: 'Contre-passer',
        cancelLabel: 'Annuler',
      });

      if (reason === null) return;

      const originalOperation =
        await finance.getManualOperation(
          operationId,
        );

      if (originalOperation?.reversedAt) {
        await finance.refresh();
        return;
      }

      const correctionDraft =
        originalOperation
          ? correctionDraftFromDetails(
              originalOperation,
              finance.categories,
            )
          : displayedSnapshot;

      await finance.reverseOperation(
        operationId,
        reason || undefined,
      );

      setCorrectionNotice(null);
      setOperationDialog({
        mode: 'correction',
        defaultType:
          correctionDraft.operationType,
        initialValues: correctionDraft,
        sourceOperationId: operationId,
      });
    } catch {
      // Le formulaire reste fermé ; useFinance expose l'erreur réelle.
    } finally {
      correctionInFlightRef.current = null;
      setCorrectingOperationId(null);
    }
  }

  if (
    finance.loading &&
    !finance.snapshot
  ) {
    return <FinanceLoader />;
  }

  return (
    <div className="grid min-w-0 gap-4">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-[#303844] pb-4">
        <div>
          <span className="text-[8px] font-bold uppercase tracking-[0.15em] text-blue-400">
            Indesy Finance
          </span>

          <h1 className="mt-1 text-[20px] font-semibold tracking-tight text-white">
            Gestion financière
          </h1>

          <p className="mt-1 max-w-2xl text-[10px] leading-5 text-slate-400">
            Revenus, dépenses, mouvements comptables et catégories dans un même espace.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {finance.owners.length > 1 && (
            <select
              value={
                finance.owner
                  ? ownerContextKey(finance.owner)
                  : ''
              }
              onChange={(event) =>
                finance.selectOwner(
                  event.target.value,
                )
              }
              className="h-9 min-w-[180px] border border-[#394451] bg-[#151a20] px-2 text-[10px] text-white outline-none focus:border-blue-500"
            >
              {finance.owners.map(
                (owner) => (
                  <option
                    key={`${owner.ownerType}:${owner.ownerId}`}
                    value={ownerContextKey(owner)}
                  >
                    {owner.label}
                  </option>
                ),
              )}
            </select>
          )}

          <button
            type="button"
            onClick={() =>
              void finance.refresh()
            }
            className="grid h-9 w-9 place-items-center border border-[#394451] text-slate-400 hover:border-blue-500 hover:text-blue-300"
            title="Actualiser"
          >
            <RefreshCcw size={13} />
          </button>

          <button hidden={!roleCapabilities.canCreateManualOperation}
            type="button"
            onClick={() =>
              openCreateDialog('expense')
            }
            className="finance-primary-action inline-flex h-9 items-center gap-2 px-4 text-[10px] font-semibold text-white"
          >
            <Plus size={13} />
            Nouvelle opération
          </button>
        </div>
      </header>

      {finance.error && (
        <div className="erp-semantic-alert border px-3 py-2 text-[10px]" data-tone="warning">
          {finance.error}
        </div>
      )}

      {correctionNotice && (
        <div
          role="status"
          className="erp-semantic-alert border-l-2 px-3 py-2 text-[10px]"
          data-tone="info"
        >
          {correctionNotice}
        </div>
      )}

      <section className="grid grid-cols-2 border border-[#2d333d] md:grid-cols-4">
        <Metric
          label="Solde"
          value={money(
            finance.snapshot?.balance ?? 0,
          )}
          detail="Position comptable actuelle"
          icon={<WalletCards size={15} />}
          tone={(finance.snapshot?.balance ?? 0) < 0 ? 'danger' : 'info'}
        />

        <Metric
          label={roleCapabilities.consumerMode ? 'Crédits' : 'Revenus'}
          value={money(
            finance.snapshot
              ?.totalRevenue ?? 0,
          )}
          detail={roleCapabilities.consumerMode ? 'Crédits et remboursements comptabilisés' : 'Revenus comptabilisés'}
          icon={<ArrowUpRight size={15} />}
          tone="success"
        />

        <Metric
          label={roleCapabilities.consumerMode ? 'Paiements' : 'Dépenses'}
          value={money(
            finance.snapshot
              ?.totalExpense ?? 0,
          )}
          detail={roleCapabilities.consumerMode ? 'Achats et paiements comptabilisés' : 'Dépenses comptabilisées'}
          icon={
            <ArrowDownRight size={15} />
          }
          tone="danger"
        />

        <Metric
          label="Opérations"
          value={String(
            finance.entries.length,
          )}
          detail="Mouvements du registre"
          icon={
            <CircleDollarSign
              size={15}
            />
          }
          tone="info"
        />
      </section>

      <nav className="finance-tabs flex overflow-x-auto border">
        {[
          [
            'overview',
            'Synthèse',
            BarChart3,
          ],
          [
            'transactions',
            'Opérations',
            FileText,
          ],
          [
            'income',
            'Revenus',
            ArrowUpRight,
          ],
          [
            'expenses',
            'Dépenses',
            ArrowDownRight,
          ],
          [
            'categories',
            'Catégories',
            Tags,
          ],
        ].map(
          ([id, label, Icon]) => {
            if (
              !roleCapabilities.coreTabs.includes(
                id as FinanceTab,
              )
            ) {
              return null;
            }

            const TabIcon =
              Icon as typeof BarChart3;

            return (
              <button
                key={String(id)}
                type="button"
                onClick={() =>
                  setActiveTab(
                    id as FinanceTab,
                  )
                }
                data-active={activeTab === id}
                data-tab={id}
                className="finance-tab flex h-10 flex-none items-center gap-2 border-b-2 px-4 text-[9px] font-semibold"
              >
                <TabIcon size={12} />
                {String(label)}
              </button>
            );
          },
        )}
      </nav>
      {/* INDESY FIN-2E3D1 SELLER FINANCE DOMAIN NAV */}
      {roleCapabilities.normalizedRole === 'vendeur' && (
        <nav className="finance-tabs is-domain flex overflow-x-auto border">
          <span className="flex h-9 items-center border-r border-[#2d333d] px-3 text-[8px] font-bold uppercase tracking-[0.11em] text-slate-600">
            Marketplace
          </span>

          {([
            [
              'seller-summary',
              'Synthèse Marketplace',
            ],
            [
              'seller-revenue',
              'Revenus Marketplace',
            ],
            [
              'seller-transactions',
              'Transactions',
            ],
            [
              'seller-commissions',
              'Commissions',
            ],
            [
              'seller-settlements',
              'Versements',
            ],
          ] as const).map(
            ([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() =>
                  setActiveTab(id)
                }
                data-active={activeTab === id}
                className="finance-tab h-9 flex-none border-b-2 px-4 text-[9px] font-semibold"
              >
                {label}
              </button>
            ),
          )}
        </nav>
      )}

      {/* INDESY FIN-2D2 FINANCE DOMAIN NAV */}
      {role === 'sponsor' && (
        <nav className="finance-tabs is-domain flex overflow-x-auto border">
          <span className="flex h-9 items-center border-r border-[#2d333d] px-3 text-[8px] font-bold uppercase tracking-[0.11em] text-slate-600">
            Sponsor
          </span>

          <button
            type="button"
            onClick={() =>
              setActiveTab('sponsor-budget')
            }
            data-active={activeTab === 'sponsor-budget'}
            className="finance-tab h-9 flex-none border-b-2 px-4 text-[9px] font-semibold"
          >
            Budget
          </button>
        </nav>
      )}

      {role === 'federation' && (
        <nav className="finance-tabs is-domain flex overflow-x-auto border">
          <span className="flex h-9 items-center border-r border-[#2d333d] px-3 text-[8px] font-bold uppercase tracking-[0.11em] text-slate-600">
            Fédération
          </span>

          <button
            type="button"
            onClick={() =>
              setActiveTab('federation-reports')
            }
            data-active={activeTab === 'federation-reports'}
            className="finance-tab h-9 flex-none border-b-2 px-4 text-[9px] font-semibold"
          >
            Rapports financiers
          </button>
        </nav>
      )}

      {role === 'ligue' && (
        <nav className="finance-tabs is-domain flex overflow-x-auto border">
          <span className="flex h-9 items-center border-r border-[#2d333d] px-3 text-[8px] font-bold uppercase tracking-[0.11em] text-slate-600">
            Ligue
          </span>

          <button
            type="button"
            onClick={() =>
              setActiveTab('league-reports')
            }
            data-active={activeTab === 'league-reports'}
            className="finance-tab h-9 flex-none border-b-2 px-4 text-[9px] font-semibold"
          >
            Rapports financiers
          </button>
        </nav>
      )}
      {activeTab === 'overview' && (
        <div className="grid gap-4 xl:grid-cols-[1.45fr_.55fr]">
          <TransactionsTable
            entries={finance.entries.slice(
              0,
              8,
            )}
            onReverse={(entry) => {
              void reverseEntry(entry);
            }}
            onCorrect={(entry) => {
              void correctEntry(entry);
            }}
            canCorrect={
              roleCapabilities.canCreateManualOperation
            }
            correctingOperationId={
              correctingOperationId
            }
            saving={finance.saving}
          />

          <section className="border border-[#2d333d] bg-[#11151a]">
            <header className="border-b border-[#2d333d] px-4 py-3">
              <span className="text-[8px] uppercase tracking-[0.12em] text-slate-500">
                Analyse
              </span>

              <h3 className="text-[12px] font-semibold text-white">
                Dépenses par catégorie
              </h3>
            </header>

            <div className="grid gap-4 p-4">
              {categoryBreakdown.map(
                ([category, amount]) => {
                  const width =
                    maxCategoryAmount > 0
                      ? Math.max(
                          4,
                          (amount /
                            maxCategoryAmount) *
                            100,
                        )
                      : 0;

                  return (
                    <div key={category}>
                      <div className="mb-1.5 flex items-center justify-between gap-2 text-[9px]">
                        <span className="truncate text-slate-400">
                          {category}
                        </span>

                        <strong className="text-slate-200">
                          {money(amount)}
                        </strong>
                      </div>

                      <div className="h-1.5 bg-[#252c35]">
                        <div
                          className="finance-expense-bar h-full"
                          style={{
                            width: `${width}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                },
              )}

              {categoryBreakdown.length ===
                0 && (
                <p className="py-8 text-center text-[9px] text-slate-600">
                  Pas encore de dépenses comptabilisées.
                </p>
              )}
            </div>
          </section>
        </div>
      )}

      {activeTab !== 'overview' &&
        activeTab !== 'categories' &&
        activeTab !== 'seller-summary' &&
        activeTab !== 'seller-revenue' &&
        activeTab !== 'seller-transactions' &&
        activeTab !== 'seller-commissions' &&
        activeTab !== 'seller-settlements' &&
        activeTab !== 'sponsor-budget' &&
        activeTab !== 'federation-reports' &&
        activeTab !== 'league-reports' && (
          <div className="grid gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex h-9 min-w-[240px] flex-1 items-center gap-2 border border-[#36404d] bg-[#151a20] px-3">
                <Search
                  size={13}
                  className="text-slate-500"
                />

                <input
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value,
                    )
                  }
                  placeholder="Rechercher dans les finances..."
                  className="min-w-0 flex-1 bg-transparent text-[10px] text-white outline-none"
                />
              </label>

              {activeTab === 'income' && (
                <button hidden={!roleCapabilities.canCreateManualOperation}
                  type="button"
                  onClick={() =>
                    openCreateDialog('income')
                  }
                  className="finance-income-action inline-flex h-9 items-center gap-2 px-3 text-[10px] font-semibold"
                >
                  <Plus size={13} />
                  Ajouter un revenu
                </button>
              )}

              {activeTab ===
                'expenses' && (
                <button hidden={!roleCapabilities.canCreateManualOperation}
                  type="button"
                  onClick={() =>
                    openCreateDialog('expense')
                  }
                  className="finance-expense-action inline-flex h-9 items-center gap-2 px-3 text-[10px] font-semibold"
                >
                  <Plus size={13} />
                  Ajouter une dépense
                </button>
              )}
            </div>

            <TransactionsTable
              entries={filteredEntries}
              onReverse={(entry) => {
                void reverseEntry(entry);
              }}
              onCorrect={(entry) => {
                void correctEntry(entry);
              }}
              canCorrect={
                roleCapabilities.canCreateManualOperation
              }
              correctingOperationId={
                correctingOperationId
              }
              saving={finance.saving}
            />
          </div>
        )}

      {activeTab === 'categories' && (
        <CategoriesView
          categories={finance.categories}
          saving={finance.saving}
          onCreate={async (
            type,
            name,
          ) => {
            await finance.createCategory(
              type,
              name,
            );
          }}
          onRename={renameCategory}
          onArchive={archiveCategory}
        />
      )}
      {/* INDESY FIN-2E3D1 SELLER FINANCE DOMAIN CONTENT */}
      {roleCapabilities.normalizedRole === 'vendeur' &&
        activeTab === 'seller-summary' && (
          <SellerFinanceAdapter view="summary" />
        )}

      {roleCapabilities.normalizedRole === 'vendeur' &&
        activeTab === 'seller-revenue' && (
          <SellerFinanceAdapter view="revenue" />
        )}

      {roleCapabilities.normalizedRole === 'vendeur' &&
        activeTab === 'seller-transactions' && (
          <SellerFinanceAdapter view="transactions" />
        )}

      {roleCapabilities.normalizedRole === 'vendeur' &&
        activeTab === 'seller-commissions' && (
          <SellerFinanceAdapter view="commissions" />
        )}

      {roleCapabilities.normalizedRole === 'vendeur' &&
        activeTab === 'seller-settlements' && (
          <SellerFinanceAdapter view="settlements" />
        )}
      {/* INDESY FIN-2D2 FINANCE DOMAIN CONTENT */}
      {role === 'sponsor' &&
        activeTab === 'sponsor-budget' && (
          <FinanceDomainAdapter view="sponsor-budget" />
        )}

      {role === 'federation' &&
        activeTab === 'federation-reports' && (
          <FinanceDomainAdapter view="federation-reports" />
        )}

      {role === 'ligue' &&
        activeTab === 'league-reports' && (
          <FinanceDomainAdapter view="league-reports" />
        )}
      {operationDialog && (
        <OperationDialog
          key={`${operationDialog.mode}:${operationDialog.sourceOperationId ?? operationDialog.defaultType}`}
          mode={operationDialog.mode}
          defaultType={
            operationDialog.defaultType
          }
          defaultCurrencyCode={
            finance.snapshot?.currencyCode ??
            'MGA'
          }
          initialValues={
            operationDialog.initialValues
          }
          categories={finance.categories}
          saving={finance.saving}
          error={finance.error}
          onClose={closeOperationDialog}
          onCreateCategory={
            createCategory
          }
          onSave={saveOperation}
        />
      )}
    </div>
  );
}
