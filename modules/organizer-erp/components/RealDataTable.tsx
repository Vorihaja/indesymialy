"use client";
import { DisciplineSelect } from "@/modules/disciplines";
import { useMemo, useState } from "react";
import { ArrowDownToLine, ArrowUpDown, ChevronLeft, ChevronRight, Eye, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import type { RealErpData } from "@/modules/erp-core/real-data";
import { OrganizerDialog, OrganizerToast, organizerButtonClass, organizerPrimaryButtonClass, type OrganizerToastState } from "./OrganizerFeedback";

const toneBorder = { red: "border-l-[#ff1638]", blue: "border-l-[#087cff]", green: "border-l-emerald-500", amber: "border-l-amber-500" };
const csvCell = (value: string) => `"${value.replaceAll('"', '""')}"`;
type Mode = "create" | "edit" | "view" | "delete" | null;
type Values = Record<string, string | number | null>;

export function RealDataTable({
  data,
  tab,
  mutating,
  onCreate,
  onUpdate,
  onDelete,
  onCreateRequest,
  onEditRequest,
}: {
  data: RealErpData;
  tab: string;
  mutating: boolean;
  onCreate: (values: Values) => Promise<void>;
  onUpdate: (id: string, values: Values) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onCreateRequest?: () => void;
  onEditRequest?: (id: string) => void | Promise<void>;
}) {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<Mode>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [values, setValues] = useState<Values>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [toast, setToast] = useState<OrganizerToastState>(null);
  const [sortColumn, setSortColumn] = useState(0);
  const [sortAscending, setSortAscending] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const matchedRows = useMemo(() => data.rows.map((row, index) => ({ row, index })).filter(({ row }) =>
    !query.trim() || row.some((cell) => cell.toLocaleLowerCase("fr").includes(query.trim().toLocaleLowerCase("fr"))),
  ).sort((left, right) => {
    const comparison = left.row[sortColumn]?.localeCompare(right.row[sortColumn] ?? "", "fr", { numeric: true }) ?? 0;
    return sortAscending ? comparison : -comparison;
  }), [data.rows, query, sortAscending, sortColumn]);
  const pageCount = Math.max(1, Math.ceil(matchedRows.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const visibleRows = matchedRows.slice((safePage - 1) * pageSize, safePage * pageSize);
  const selectedRow = selectedIndex === null ? null : data.rows[selectedIndex];
  const selectedRecord = selectedIndex === null ? null : data.records[selectedIndex];

  const defaults = () => Object.fromEntries(data.fields.map((field) => [
    field.name,
    field.options?.[0]?.value ?? (field.type === "date" ? new Date().toISOString().slice(0, 10) : field.type === "number" ? 0 : ""),
  ]));

  const openCreate = () => {
    if (onCreateRequest) { onCreateRequest(); return; }
    setValues(defaults());
    setSelectedIndex(null);
    setFormError(null);
    setMode("create");
  };

  const openRecord = (nextMode: Exclude<Mode, "create" | null>, index: number) => {
    if (nextMode === "edit" && onEditRequest && data.records[index]) {
      const recordId = data.records[index].id;
      setMode(null);
      setSelectedIndex(null);
      setFormError(null);
      void onEditRequest(recordId);
      return;
    }
    setSelectedIndex(index);
    setValues({ ...data.records[index]?.values });
    setFormError(null);
    setMode(nextMode);
  };

  const close = () => {
    if (mutating) return;
    setMode(null);
    setSelectedIndex(null);
    setFormError(null);
  };

  const save = async () => {
    const missing = data.fields.find((field) => field.required && String(values[field.name] ?? "").trim() === "");
    if (missing) {
      setFormError(`${missing.label} est obligatoire.`);
      return;
    }
    try {
      setFormError(null);
      if (mode === "edit" && selectedRecord) {
        await onUpdate(selectedRecord.id, values);
        setToast({ message: "Modification enregistrée.", tone: "info" });
      } else {
        await onCreate(values);
        setToast({ message: "Création enregistrée.", tone: "info" });
      }
      close();
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "L’opération a échoué.";
      setFormError(message);
      setToast({ message, tone: "error" });
    }
  };

  const remove = async () => {
    if (!selectedRecord) return;
    try {
      setFormError(null);
      await onDelete(selectedRecord.id);
      setToast({ message: "Élément supprimé.", tone: "warning" });
      close();
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "La suppression a échoué.";
      setFormError(message);
      setToast({ message, tone: "error" });
    }
  };

  const exportCsv = () => {
    const lines = [data.columns, ...matchedRows.map(({ row }) => row)].map((row) => row.map(csvCell).join(";")).join("\n");
    const blob = new Blob([`\uFEFF${lines}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${data.label.toLocaleLowerCase("fr").replaceAll(/[^a-z0-9]+/gi, "-")}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return <div className="grid gap-3">
    <OrganizerToast toast={toast} onClose={() => setToast(null)} />

    <section className="grid grid-cols-2 gap-px overflow-hidden border border-[#303238] bg-[#303238] xl:grid-cols-5">
      {data.kpis.map((kpi) => <article key={kpi.label} className={`min-h-[76px] border-l-2 bg-[#151619] px-3 py-2 ${kpi.tone ? toneBorder[kpi.tone] : "border-l-transparent"}`}>
        <span className="text-[8px] font-bold uppercase tracking-[0.1em] text-zinc-500">{kpi.label}</span>
        <strong className="mt-1.5 block truncate text-[18px] font-semibold tracking-[-0.03em]">{kpi.value}</strong>
        <span className="mt-0.5 block truncate text-[9px] text-zinc-500">{kpi.detail}</span>
      </article>)}
    </section>

    <section className="border border-[#303238] bg-[#151619]">
      <header className="flex min-h-12 flex-wrap items-center justify-between gap-2 border-b border-[#303238] px-3 py-2">
        <div><h2 className="text-[11px] font-semibold text-zinc-100">{data.label} · {tab}</h2></div>
        <div className="flex flex-wrap items-center gap-1.5">
          <label className="flex h-8 items-center border border-[#343840] bg-[#101114] px-2">
            <Search size={13} className="text-zinc-600" />
            <input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Rechercher…" className="h-full w-40 bg-transparent px-2 text-[10px] text-white outline-none placeholder:text-zinc-600" />
            {query && <button type="button" onClick={() => setQuery("")} aria-label="Effacer"><X size={12} /></button>}
          </label>
          <button type="button" onClick={exportCsv} className={organizerButtonClass}><ArrowDownToLine size={13} />Exporter</button>
          {data.capabilities.create && <button type="button" onClick={openCreate} className={organizerPrimaryButtonClass}><Plus size={13} />Créer</button>}
        </div>
      </header>

      <div className="overflow-x-auto"><table className="w-full min-w-[760px] border-collapse text-left text-[11px]">
        <thead className="bg-[#101114] text-[9px] uppercase tracking-[0.09em] text-zinc-500"><tr>{data.columns.map((column, index) => <th key={column} className="h-8 border-b border-[#292c31] px-3 font-semibold"><button type="button" onClick={() => { if (sortColumn === index) setSortAscending((current) => !current); else { setSortColumn(index); setSortAscending(true); } }} className="inline-flex items-center gap-1 hover:text-zinc-200">{column}<ArrowUpDown size={10} aria-hidden="true" /></button></th>)}<th className="w-28 border-b border-[#292c31]" /></tr></thead>
        <tbody className="divide-y divide-[#292c31]">
          {visibleRows.map(({ row, index }) => <tr key={data.rowIds[index] ?? `${row[0]}-${index}`} className="hover:bg-white/[0.025]">
            {row.map((cell, cellIndex) => <td key={`${cellIndex}-${cell}`} className={`h-10 whitespace-nowrap px-3 ${cellIndex === 0 ? "font-semibold text-zinc-200" : "text-zinc-400"}`}>{cell}</td>)}
            <td><div className="flex justify-end gap-1 pr-2">
              <button type="button" onClick={() => openRecord("view", index)} className="grid h-8 w-8 place-items-center text-zinc-500 hover:text-white" aria-label={`Consulter ${row[0]}`}><Eye size={14} /></button>
              {data.capabilities.update && <button type="button" onClick={() => openRecord("edit", index)} className="grid h-8 w-8 place-items-center text-[#3d92ff] hover:bg-blue-500/10" aria-label={`Modifier ${row[0]}`}><Pencil size={14} /></button>}
              {data.capabilities.delete && <button type="button" onClick={() => openRecord("delete", index)} className="grid h-8 w-8 place-items-center text-red-400 hover:bg-red-500/10" aria-label={`Supprimer ${row[0]}`}><Trash2 size={14} /></button>}
            </div></td>
          </tr>)}
          {visibleRows.length === 0 && <tr><td colSpan={data.columns.length + 1} className="h-28 px-3 text-center text-[11px] text-zinc-500">{data.emptyMessage}</td></tr>}
        </tbody>
      </table></div>
      <footer className="flex min-h-9 flex-wrap items-center justify-between gap-2 border-t border-[#303238] px-3 py-1.5 text-[9px] text-zinc-500">
        <span>{matchedRows.length} résultat(s)</span>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1">Par page<select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }} className="h-6 border border-[#343840] bg-[#101114] px-1 text-[9px] text-zinc-300"><option value={10}>10</option><option value={25}>25</option><option value={50}>50</option></select></label>
          <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={safePage === 1} className="grid h-6 w-6 place-items-center border border-[#343840] disabled:opacity-30" aria-label="Page précédente"><ChevronLeft size={12} /></button>
          <span>Page {safePage} / {pageCount}</span>
          <button type="button" onClick={() => setPage((current) => Math.min(pageCount, current + 1))} disabled={safePage === pageCount} className="grid h-6 w-6 place-items-center border border-[#343840] disabled:opacity-30" aria-label="Page suivante"><ChevronRight size={12} /></button>
        </div>
      </footer>
    </section>

    <OrganizerDialog open={mode === "view"} eyebrow="Détail" title={selectedRow?.[0] ?? "Détail"} description={tab} onClose={close} footer={<><button type="button" onClick={close} className={organizerButtonClass}>Fermer</button>{data.capabilities.update && selectedIndex !== null && <button type="button" onClick={() => openRecord("edit", selectedIndex)} className={organizerPrimaryButtonClass}><Pencil size={13} />Modifier</button>}</>}>
      <dl className="grid border border-[#303238] sm:grid-cols-2">{data.columns.map((column, index) => <div key={column} className="border-b border-[#292c31] p-3 sm:odd:border-r"><dt className="text-[8px] font-bold uppercase tracking-[0.1em] text-zinc-600">{column}</dt><dd className="mt-1 text-[11px] font-semibold text-zinc-200">{selectedRow?.[index] ?? "—"}</dd></div>)}</dl>
    </OrganizerDialog>

    <OrganizerDialog open={mode === "create" || mode === "edit"} eyebrow={data.label} title={mode === "edit" ? "Modifier" : "Créer"} description="Les données seront enregistrées immédiatement." onClose={close} footer={<><button type="button" onClick={close} disabled={mutating} className={organizerButtonClass}>Annuler</button><button type="button" onClick={() => void save()} disabled={mutating} className={organizerPrimaryButtonClass}>{mutating ? "Enregistrement…" : "Enregistrer"}</button></>}>
      <form className="grid gap-3 sm:grid-cols-2" onSubmit={(event) => { event.preventDefault(); void save(); }}>
        {data.fields.map((field, index) => <label key={field.name} className={`grid gap-1 ${field.type === "textarea" || index === 0 ? "sm:col-span-2" : ""}`}>
          <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-zinc-500">{field.label}{field.required ? " *" : ""}</span>
          {field.type === "select" ? (
            field.name === "discipline_id" ? (
              <DisciplineSelect
                mode="single"
                valueMode="id"
                value={String(values[field.name] ?? "")}
                emptyLabel={field.options?.find((option) => option.value === "")?.label ?? "Sélectionner une discipline"}
                onValueChange={(value) =>
                  setValues((current) => ({
                    ...current,
                    [field.name]: value,
                  }))
                }
                className="h-9 w-full border border-[#343840] bg-[#101114] px-2.5 text-[11px] text-white outline-none focus:border-[#087cff]"
                aria-label={field.label}
              />
            ) : (
              <select
                value={String(values[field.name] ?? "")}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    [field.name]: event.target.value,
                  }))
                }
                className="h-9 border border-[#343840] bg-[#101114] px-2.5 text-[11px] text-white outline-none focus:border-[#087cff]"
              >
                {field.options?.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )
          )
            : field.type === "textarea" ? <textarea value={String(values[field.name] ?? "")} onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))} className="min-h-24 border border-[#343840] bg-[#101114] p-2.5 text-[11px] text-white outline-none focus:border-[#087cff]" />
            : <input type={field.type} value={String(values[field.name] ?? "")} onChange={(event) => setValues((current) => ({ ...current, [field.name]: field.type === "number" ? event.target.valueAsNumber : event.target.value }))} required={field.required} className="h-9 border border-[#343840] bg-[#101114] px-2.5 text-[11px] text-white outline-none focus:border-[#087cff]" />}
        </label>)}
        {formError && <p className="border border-red-500/30 bg-red-500/10 p-2 text-[10px] text-red-300 sm:col-span-2">{formError}</p>}
      </form>
    </OrganizerDialog>

    <OrganizerDialog open={mode === "delete"} eyebrow="Confirmation" title="Supprimer définitivement ?" description="Cette action supprimera définitivement l’enregistrement." onClose={close} footer={<><button type="button" onClick={close} disabled={mutating} className={organizerButtonClass}>Conserver</button><button type="button" onClick={() => void remove()} disabled={mutating} className={organizerPrimaryButtonClass}><Trash2 size={13} />{mutating ? "Suppression…" : "Supprimer"}</button></>}>
      <p className="text-[11px] leading-5 text-zinc-400">{selectedRow?.[0] ?? "Cet élément"} sera supprimé si vos permissions RLS l’autorisent.</p>
      {formError && <p className="mt-3 border border-red-500/30 bg-red-500/10 p-2 text-[10px] text-red-300">{formError}</p>}
    </OrganizerDialog>
  </div>;
}
