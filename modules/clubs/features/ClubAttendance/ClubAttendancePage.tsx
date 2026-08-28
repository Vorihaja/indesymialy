"use client";

import { useState } from "react";
import { useAttendances } from "../../hooks/useAttendances";
import { useClubMembers } from "../../hooks/useClubMembers";
import AttendanceTable from "../../components/AttendanceTable";

const panelClass = "rounded-[2px] border border-[#303238] bg-[#151619] p-4";
const controlClass = "h-10 w-full rounded-[2px] border border-[#303238] bg-[#0f1012] px-3 text-sm text-white outline-none transition focus:border-[#3d92ff]";
const primaryActionClass = "h-10 rounded-[2px] border border-[#ff1638] bg-[#ff1638] px-4 text-sm font-bold text-white transition hover:bg-[#d91d35]";
const secondaryActionClass = "rounded-[2px] border border-[#3d92ff] bg-[#3d92ff]/10 px-4 py-2 text-sm font-semibold text-[#78b5ff] transition hover:bg-[#3d92ff]/20 hover:text-white";

export default function ClubAttendancePage({ organizationId }: { organizationId: string }) {
  const { attendances, attendanceRate, loading, error, refresh, recordAttendance } = useAttendances(organizationId);
  const { members } = useClubMembers(organizationId);
  const [memberId, setMemberId] = useState("");
  const [status, setStatus] = useState("present");

  async function submit() {
    if (!memberId) return;
    await recordAttendance({ organization_id: organizationId, member_id: memberId, session_date: new Date().toISOString().slice(0, 10), session_time: new Date().toTimeString().slice(0, 5), status });
  }

  return (
    <section className="space-y-4 text-zinc-100">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[#303238] pb-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#3d92ff]">Espace club</p>
          <h1 className="mt-1 text-2xl font-bold">Présences</h1>
          <p className="mt-1 text-sm text-zinc-400">Taux global : <strong className="text-white">{attendanceRate}%</strong></p>
        </div>
        <button className={secondaryActionClass} onClick={refresh}>Actualiser</button>
      </div>
      <div className={`grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_auto] ${panelClass}`}>
        <label className="grid gap-1.5 text-xs font-semibold text-zinc-300">Membre<select className={controlClass} value={memberId} onChange={(event) => setMemberId(event.target.value)}><option value="">Sélectionner un membre</option>{members.map((member) => <option key={member.id} value={member.id}>{member.full_name ?? `${member.first_name} ${member.last_name}`}</option>)}</select></label>
        <label className="grid gap-1.5 text-xs font-semibold text-zinc-300">Statut<select className={controlClass} value={status} onChange={(event) => setStatus(event.target.value)}><option value="present">Présent</option><option value="absent">Absent</option><option value="late">En retard</option></select></label>
        <button className={`${primaryActionClass} self-end`} onClick={() => void submit()}>Enregistrer</button>
      </div>
      {loading ? <p className={panelClass}>Chargement...</p> : error ? <p role="alert" className="rounded-[2px] border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-300">{error}</p> : <AttendanceTable attendances={attendances}/>}
    </section>
  );
}
