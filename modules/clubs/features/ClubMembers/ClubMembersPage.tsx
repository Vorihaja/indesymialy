"use client";

import { useState } from "react";
import { useIndesyDialog } from "@/components/ui/indesy-dialog";
import { ContextualMessageAction } from "@/modules/communication-core";
import { useClubMembers } from "../../hooks/useClubMembers";

const panelClass = "rounded-[2px] border border-[#303238] bg-[#151619] p-4";
const controlClass = "h-10 w-full rounded-[2px] border border-[#303238] bg-[#0f1012] px-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-[#3d92ff]";
const primaryActionClass = "h-10 rounded-[2px] border border-[#ff1638] bg-[#ff1638] px-4 text-sm font-bold text-white transition hover:bg-[#d91d35]";
const secondaryActionClass = "rounded-[2px] border border-[#3d92ff] bg-[#3d92ff]/10 px-4 py-2 text-sm font-semibold text-[#78b5ff] transition hover:bg-[#3d92ff]/20 hover:text-white";
const roleLabels: Record<string, string> = { fighter: "Combattant", coach: "Coach", manager: "Responsable" };

export default function ClubMembersPage({ organizationId }: { organizationId: string }) {
  const dialog = useIndesyDialog();
  const { members, loading, error, refresh, addMember, removeMember } = useClubMembers(organizationId);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState("fighter");
  const [message, setMessage] = useState<string | null>(null);

  async function submit() {
    try {
      await addMember({ organization_id: organizationId, first_name: firstName, last_name: lastName, role, member_status: "active" });
      setFirstName("");
      setLastName("");
      setMessage("Membre ajouté.");
    } catch (cause: unknown) {
      setMessage(cause instanceof Error ? cause.message : "Erreur d’ajout");
    }
  }

  async function requestMemberRemoval(
    memberId: string,
  ) {
    const confirmed = await dialog.confirm({
      title: "Retirer ce membre ?",
      description:
        "Le membre sera retiré de l’organisation.",
      confirmLabel: "Retirer",
      cancelLabel: "Annuler",
      tone: "danger",
    });

    if (!confirmed) return;

    try {
      await removeMember(memberId);
    } catch (cause: unknown) {
      setMessage(
        cause instanceof Error
          ? cause.message
          : "Impossible de retirer ce membre.",
      );
    }
  }

  return (
    <section className="space-y-4 text-zinc-100">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[#303238] pb-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#3d92ff]">Espace club</p>
          <h1 className="mt-1 text-2xl font-bold">Membres</h1>
          <p className="mt-1 text-sm text-zinc-400">Gestion des membres du club.</p>
        </div>
        <button className={secondaryActionClass} onClick={refresh}>Actualiser</button>
      </div>
      <div className={`grid gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_180px_auto] ${panelClass}`}>
        <label className="grid gap-1.5 text-xs font-semibold text-zinc-300">Prénom<input className={controlClass} value={firstName} onChange={(event) => setFirstName(event.target.value)} placeholder="Prénom"/></label>
        <label className="grid gap-1.5 text-xs font-semibold text-zinc-300">Nom<input className={controlClass} value={lastName} onChange={(event) => setLastName(event.target.value)} placeholder="Nom"/></label>
        <label className="grid gap-1.5 text-xs font-semibold text-zinc-300">Rôle<select className={controlClass} value={role} onChange={(event) => setRole(event.target.value)}><option value="fighter">Combattant</option><option value="coach">Coach</option><option value="manager">Responsable</option></select></label>
        <button className={`${primaryActionClass} self-end`} onClick={() => void submit()}>Ajouter</button>
      </div>
      {message && <p role="status" className="rounded-[2px] border border-[#303238] bg-[#151619] p-3 text-sm text-zinc-300">{message}</p>}
      {loading ? (
        <p className={panelClass}>Chargement...</p>
      ) : error ? (
        <p role="alert" className="rounded-[2px] border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-300">{error}</p>
      ) : (
        <ul className="space-y-2">
          {members.map((member) => (
            <li className="flex flex-wrap items-center justify-between gap-3 rounded-[2px] border border-[#303238] bg-[#151619] p-3" key={member.id}>
              <span className="text-sm">{member.full_name ?? `${member.first_name} ${member.last_name}`} · <span className="text-zinc-400">{roleLabels[member.role ?? ""] ?? member.role ?? "Membre"}</span></span>
              <div className="flex flex-wrap items-center gap-2">
                {member.profile_id && (
                  <ContextualMessageAction
                    recipientProfileId={member.profile_id}
                  />
                )}
                <button className="rounded-[2px] border border-red-500/30 bg-red-500/5 px-3 py-1.5 text-sm font-semibold text-red-300 transition hover:bg-red-500/10" onClick={() => void requestMemberRemoval(member.id)}>Retirer</button>
              </div>
            </li>
          ))}
          {members.length === 0 && <li className="rounded-[2px] border border-dashed border-[#303238] bg-[#151619] p-4 text-sm text-zinc-500">Aucun membre enregistré.</li>}
        </ul>
      )}
    </section>
  );
}
