"use client";

import { useState } from "react";
import { useClub } from "../../hooks/useClub";

const panelClass = "rounded-[2px] border border-[#303238] bg-[#151619] p-4";
const controlClass = "mt-1.5 w-full rounded-[2px] border border-[#303238] bg-[#0f1012] px-3 py-2 text-sm text-white outline-none transition focus:border-[#3d92ff]";
const primaryActionClass = "rounded-[2px] border border-[#ff1638] bg-[#ff1638] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#d91d35]";
const secondaryActionClass = "rounded-[2px] border border-[#3d92ff] bg-[#3d92ff]/10 px-4 py-2 text-sm font-semibold text-[#78b5ff] transition hover:bg-[#3d92ff]/20 hover:text-white";

export default function ClubProfilePage({ clubId }: { clubId: string }) {
  const { club, loading, error, refreshClub, updateClub } = useClub(clubId);
  const [name, setName] = useState<string | undefined>();
  const [description, setDescription] = useState<string | undefined>();
  const [address, setAddress] = useState<string | undefined>();
  const [message, setMessage] = useState<string | null>(null);

  async function submit() {
    try {
      await updateClub({
        name: name ?? club?.name,
        description: description === undefined ? club?.description : description || null,
        address: address === undefined ? club?.address : address || null,
      });
      setMessage("Profil enregistré.");
    } catch (cause: unknown) {
      setMessage(cause instanceof Error ? cause.message : "Erreur d’enregistrement");
    }
  }

  if (loading) return <p className={panelClass}>Chargement du profil...</p>;
  if (error) return <p role="alert" className="rounded-[2px] border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-300">{error}</p>;
  if (!club) return <p className={panelClass}>Club introuvable.</p>;

  return (
    <section className="space-y-4 text-zinc-100">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[#303238] pb-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#3d92ff]">Espace club</p>
          <h1 className="mt-1 text-2xl font-bold">Profil du club</h1>
          <p className="mt-1 text-sm text-zinc-400">Informations réelles de votre club.</p>
        </div>
        <button className={secondaryActionClass} onClick={refreshClub}>Actualiser</button>
      </div>
      <div className={`grid max-w-xl gap-3 ${panelClass}`}>
        <label className="text-xs font-semibold text-zinc-300">Nom<input className={controlClass} value={name ?? club.name} onChange={(event) => setName(event.target.value)}/></label>
        <label className="text-xs font-semibold text-zinc-300">Description<textarea className={controlClass} value={description ?? club.description ?? ""} onChange={(event) => setDescription(event.target.value)}/></label>
        <label className="text-xs font-semibold text-zinc-300">Adresse<input className={controlClass} value={address ?? club.address ?? ""} onChange={(event) => setAddress(event.target.value)}/></label>
        <button className={primaryActionClass} onClick={() => void submit()}>Enregistrer</button>
        {message && <p role="status" className="rounded-[2px] border border-[#303238] bg-[#0f1012] p-3 text-sm text-zinc-300">{message}</p>}
      </div>
    </section>
  );
}
