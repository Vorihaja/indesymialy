"use client";
import { useEffect, useMemo, useState } from "react";
import { Check, RefreshCw, X } from "lucide-react";
import { createOrganizerEventWorkflowUseCase } from "../real-data/organizer-event-workflow.factory";
import { organizerButtonClass, organizerPrimaryButtonClass } from "./OrganizerFeedback";

type Invitation = { id: string; event_id: string; event_title: string; organization_id: string; organization_name: string; role: string; status: string; invited_at: string };
export function CoorganizationView({ onChanged }: { onChanged: () => Promise<unknown> }) {
  const useCase = useMemo(() => createOrganizerEventWorkflowUseCase(), []);
  const [items, setItems] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const load = async () => { setLoading(true); try { setItems(await useCase.invitations()); setError(null); } catch (reason) { setError(reason instanceof Error ? reason.message : "Chargement impossible"); } finally { setLoading(false); } };
  useEffect(() => { void load(); }, []);
  const respond = async (id: string, accept: boolean) => { await useCase.respond(id, accept); await Promise.all([load(), onChanged()]); };
  return <section className="border border-[#303238] bg-[#151619]">
    <header className="flex min-h-12 items-center justify-between border-b border-[#303238] px-3"><div><span className="text-[8px] font-bold uppercase tracking-[.12em] text-blue-400">Événements partagés</span><h2 className="text-[11px] font-semibold">Invitations de coorganisation</h2></div><button type="button" onClick={() => void load()} className={organizerButtonClass}><RefreshCw size={12} />Actualiser</button></header>
    {error && <p className="m-3 border border-red-500/30 p-3 text-[10px] text-red-300">{error}</p>}
    <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-[11px]"><thead className="bg-[#101114] text-[9px] uppercase text-zinc-500"><tr>{["Événement","Organisation invitée","Rôle","Invitation","Statut",""] .map(label => <th key={label} className="h-8 border-b border-[#292c31] px-3">{label}</th>)}</tr></thead><tbody className="divide-y divide-[#292c31]">{items.map(item => <tr key={item.id}><td className="h-11 px-3 font-semibold">{item.event_title}</td><td className="px-3 text-zinc-400">{item.organization_name}</td><td className="px-3 text-zinc-400">{item.role}</td><td className="px-3 text-zinc-500">{new Date(item.invited_at).toLocaleDateString("fr-FR")}</td><td className="px-3"><span className="border border-[#3a3d43] px-2 py-1 text-[9px]">{item.status}</span></td><td className="px-3"><div className="flex justify-end gap-1">{item.status === "pending" && <><button type="button" onClick={() => void respond(item.id,true)} className={organizerPrimaryButtonClass}><Check size={12} />Accepter</button><button type="button" onClick={() => void respond(item.id,false)} className={organizerButtonClass}><X size={12} />Refuser</button></>}</div></td></tr>)}{!loading && !items.length && <tr><td colSpan={6} className="h-28 text-center text-zinc-500">Aucune invitation de coorganisation.</td></tr>}</tbody></table></div>
  </section>;
}