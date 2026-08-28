"use client";

import { useEffect, useState } from "react";
import { BadgeCheck, FileCheck2, FileUp, LoaderCircle, Save, Send, ShieldCheck } from "lucide-react";
import type { IdentityOrganization, PrivateProfile } from "@/modules/identity-core/types";
import { useProfileVerification, type RequiredVerificationDocument, type VerificationDetails } from "@/modules/profile-verification";
import { organizerButtonClass, organizerPrimaryButtonClass } from "./OrganizerFeedback";

const documents: RequiredVerificationDocument[] = [
  { type: "legal", label: "Statuts ou acte constitutif", required: true, expires: false },
  { type: "rcs", label: "Extrait du registre du commerce (RCS)", required: true, expires: true },
  { type: "nif", label: "Carte fiscale et justificatif NIF", required: true, expires: true },
  { type: "stat", label: "Carte statistique STAT", required: true, expires: true },
  { type: "tax_clearance", label: "Attestation de régularité fiscale", required: true, expires: true },
  { type: "representative_identity", label: "CIN ou passeport du représentant", required: true, expires: true },
];

const fieldClass = "h-9 w-full border border-[#343840] bg-[#101114] px-2.5 text-[11px] text-white outline-none focus:border-[#087cff]";
const labelClass = "grid gap-1 text-[9px] font-semibold uppercase tracking-[0.08em] text-zinc-500";
const labels = { draft: "Brouillon", submitted: "Soumis", in_review: "En examen", verified: "Vérifié", rejected: "Refusé", needs_changes: "À corriger" } as const;

export function OrganizerVerificationView({ profile, organization, onProfileEdit }: { profile: PrivateProfile; organization?: IdentityOrganization; onProfileEdit(): void }) {
  const api = useProfileVerification();
  const [form, setForm] = useState<VerificationDetails>({ subjectType: "organization", organizationId: organization?.id, legalName: organization?.name ?? "", identityNumber: "", nif: "", statNumber: "", registeredAddress: "" });
  const [expiry, setExpiry] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (api.data) setForm({ subjectType: api.data.subjectType, organizationId: api.data.organizationId, legalName: api.data.legalName, identityNumber: api.data.identityNumber ?? "", nif: api.data.nif, statNumber: api.data.statNumber ?? "", registeredAddress: api.data.registeredAddress });
    else setForm(current => ({ ...current, organizationId: organization?.id, legalName: current.legalName || organization?.name || "", registeredAddress: current.registeredAddress || organization?.address || "" }));
  }, [api.data, organization]);

  const editable = !api.data || ["draft", "rejected", "needs_changes"].includes(api.data.status);
  const uploaded = new Map(api.data?.documents.map(item => [item.type, item]) ?? []);
  const progressParts = [form.legalName, form.identityNumber, form.nif, form.statNumber, form.registeredAddress, ...documents.map(item => uploaded.has(item.type) ? item.type : "")];
  const progress = Math.round(progressParts.filter(Boolean).length / progressParts.length * 100);
  const complete = Boolean(profile.onboardingComplete && form.legalName.trim() && form.identityNumber.trim() && form.nif.trim() && form.statNumber.trim() && form.registeredAddress.trim() && documents.every(item => uploaded.has(item.type)));

  const save = async () => { setNotice(null); try { await api.save(form); setNotice("Informations du dossier enregistrées."); } catch { /* le hook expose le message */ } };
  const upload = async (type: string, file: File | undefined) => {
    if (!file) return;
    setNotice(null);
    try {
      const requestId = api.data?.id ?? await api.save(form);
      await api.upload(requestId, type, file, expiry[type]);
      setNotice("Document téléversé dans l’espace privé.");
    } catch { /* le hook expose le message */ }
  };
  const submit = async () => { if (!api.data?.id || !complete) return; setNotice(null); try { await api.submit(api.data.id); setNotice("Dossier soumis. La vérification peut maintenant commencer."); } catch { /* le hook expose le message */ } };

  if (api.loading) return <div className="grid min-h-52 place-items-center border border-[#303238] bg-[#151619]"><span className="flex gap-2 text-[11px] text-zinc-400"><LoaderCircle size={15} className="animate-spin"/>Chargement du dossier…</span></div>;

  return <div className="grid gap-3">
    <header className="flex flex-wrap items-start justify-between gap-3 border border-[#303238] bg-[#151619] p-4"><div><span className="text-[8px] font-bold uppercase tracking-[0.14em] text-[#3d92ff]">Vérification volontaire</span><h2 className="mt-1 text-[15px] font-semibold">Dossier officiel de l’organisation</h2><p className="mt-1 max-w-3xl text-[11px] leading-5 text-zinc-400">Votre organisation reste active et peut créer des événements, vendre et effectuer ses opérations sans vérification. Le badge facultatif est accordé après contrôle et donne accès à une commission réduite, une visibilité renforcée et des avantages de confiance.</p></div><span className={`inline-flex h-8 items-center gap-2 border px-3 text-[10px] font-semibold ${api.data?.status === "verified" ? "border-emerald-600 text-emerald-400" : "border-[#343840] text-zinc-300"}`}>{api.data?.status === "verified" ? <BadgeCheck size={14}/> : <ShieldCheck size={14}/>} {api.data ? labels[api.data.status] : "Non vérifié"}</span></header>

    <section className="grid border border-[#303238] bg-[#151619] lg:grid-cols-[1fr_300px]"><div className="border-b border-[#303238] p-4 lg:border-b-0 lg:border-r"><div className="grid gap-3 sm:grid-cols-2"><label className={labelClass}>Nom légal *<input disabled={!editable} value={form.legalName} onChange={event => setForm(current => ({ ...current, legalName: event.target.value }))} className={fieldClass}/></label><label className={labelClass}>NIF *<input disabled={!editable} value={form.nif} onChange={event => setForm(current => ({ ...current, nif: event.target.value }))} className={fieldClass}/></label><label className={labelClass}>Numéro STAT *<input disabled={!editable} value={form.statNumber} onChange={event => setForm(current => ({ ...current, statNumber: event.target.value }))} className={fieldClass}/></label><label className={labelClass}>CIN / passeport du représentant *<input disabled={!editable} value={form.identityNumber} onChange={event => setForm(current => ({ ...current, identityNumber: event.target.value }))} className={fieldClass}/></label><label className={labelClass + " sm:col-span-2"}>Adresse officielle enregistrée *<input disabled={!editable} value={form.registeredAddress} onChange={event => setForm(current => ({ ...current, registeredAddress: event.target.value }))} className={fieldClass}/></label></div><div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[#303238] pt-3"><p className="text-[10px] text-zinc-500">Organisation concernée : <strong className="text-zinc-300">{organization?.name ?? "À créer dans l’onglet Organisation"}</strong></p><button type="button" disabled={!organization || !editable || api.mutating} onClick={() => void save()} className={organizerButtonClass}><Save size={13}/>Enregistrer les informations</button></div></div><aside className="p-4"><div className="flex justify-between text-[9px] uppercase text-zinc-500"><span>Complétude du dossier</span><strong className="text-zinc-200">{progress} %</strong></div><div className="mt-2 h-1.5 bg-[#292c31]"><div className="h-full bg-[#087cff]" style={{ width: `${progress}%` }}/></div><div className="mt-4 grid gap-2 text-[10px]"><p className={profile.onboardingComplete ? "text-emerald-400" : "text-amber-400"}>{profile.onboardingComplete ? "✓ Profil personnel complété" : "Profil personnel incomplet"}</p><button type="button" onClick={onProfileEdit} className={organizerButtonClass}>Compléter mes coordonnées</button></div></aside></section>

    <section className="border border-[#303238] bg-[#151619]"><header className="border-b border-[#303238] px-4 py-3"><h3 className="text-[12px] font-semibold">Documents justificatifs officiels</h3><p className="mt-1 text-[10px] text-zinc-500">PDF, JPG, PNG ou WebP · 10 Mo maximum · stockage privé · documents lisibles et complets.</p></header><div className="overflow-x-auto"><div className="min-w-[760px]"><div className="grid grid-cols-[1fr_120px_150px_170px] bg-[#101114] px-4 py-2 text-[8px] font-bold uppercase text-zinc-500"><span>Document</span><span>État</span><span>Expiration</span><span>Fichier</span></div>{documents.map(document => { const current = uploaded.get(document.type); return <div key={document.type} className="grid grid-cols-[1fr_120px_150px_170px] items-center border-t border-[#303238] px-4 py-2.5"><div><strong className="text-[10px]">{document.label}</strong><span className="ml-2 text-[8px] text-[#ff4058]">Obligatoire</span></div><span className={`text-[9px] ${current ? "text-blue-400" : "text-zinc-600"}`}>{current ? current.status === "accepted" ? "Validé" : current.status === "rejected" ? "Refusé" : "Téléversé" : "Manquant"}</span>{document.expires ? <input type="date" disabled={!editable} value={expiry[document.type] ?? current?.expiresAt ?? ""} onChange={event => setExpiry(values => ({ ...values, [document.type]: event.target.value }))} className={fieldClass}/> : <span className="text-[9px] text-zinc-600">Sans échéance</span>}<label className={`inline-flex h-8 items-center justify-center gap-2 border border-[#343840] px-2 text-[9px] ${editable ? "cursor-pointer hover:border-[#087cff]" : "opacity-50"}`}><FileUp size={12}/><span className="max-w-[120px] truncate">{current?.fileName ?? "Choisir un fichier"}</span><input type="file" disabled={!organization || !editable || api.mutating} accept=".pdf,.jpg,.jpeg,.png,.webp" className="sr-only" onChange={event => void upload(document.type, event.target.files?.[0])}/></label></div>; })}</div></div><footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[#303238] bg-[#101114] p-4"><div>{api.error && <p role="alert" className="text-[10px] text-red-400">{api.error}</p>}{notice && <p className="text-[10px] text-emerald-400">{notice}</p>}<p className="mt-1 text-[9px] text-zinc-600">Après soumission, les informations et fichiers restent verrouillés pendant le contrôle.</p></div><button type="button" disabled={!complete || !api.data?.id || !editable || api.mutating} onClick={() => void submit()} className={organizerPrimaryButtonClass}><Send size={13}/>{api.data?.status === "submitted" ? "Dossier soumis" : "Soumettre à la vérification"}</button></footer></section>
  </div>;
}
