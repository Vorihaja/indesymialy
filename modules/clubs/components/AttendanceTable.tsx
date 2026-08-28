"use client";

import type { Attendance } from "../types";

interface AttendanceTableProps {
  attendances: Attendance[];
  onSelect?: (attendance: Attendance) => void;
}

const statusLabels: Record<string, string> = {
  present: "Présent",
  absent: "Absent",
  late: "En retard",
};

const statusClasses: Record<string, string> = {
  present: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
  absent: "border-red-500/30 bg-red-500/10 text-red-200",
  late: "border-amber-500/30 bg-amber-500/10 text-amber-200",
};

export default function AttendanceTable({
  attendances,
  onSelect,
}: AttendanceTableProps) {
  if (!attendances.length) {
    return (
      <div className="rounded-[2px] border border-dashed border-[#303238] bg-[#151619] p-4 text-center text-sm text-zinc-500">
        Aucune présence enregistrée.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-[2px] border border-[#303238] bg-[#151619]">
      <table className="w-full min-w-[620px] text-sm">
        <thead className="bg-[#101114] text-[11px] uppercase tracking-[.08em] text-zinc-500">
          <tr className="border-b border-[#303238] text-left">
            <th className="px-3 py-2.5">Date</th>
            <th className="px-3 py-2.5">Heure</th>
            <th className="px-3 py-2.5">Discipline</th>
            <th className="px-3 py-2.5">Statut</th>
          </tr>
        </thead>
        <tbody>
          {attendances.map((attendance) => {
            const attendanceStatus = attendance.status ?? "";
            return (
              <tr
                key={attendance.id}
                onClick={() => onSelect?.(attendance)}
                className="cursor-pointer border-b border-[#303238] text-zinc-300 transition last:border-b-0 hover:bg-[#3d92ff]/5"
              >
                <td className="px-3 py-2.5">{attendance.session_date}</td>
                <td className="px-3 py-2.5">{attendance.session_time}</td>
                <td className="px-3 py-2.5">{attendance.discipline ?? "-"}</td>
                <td className="px-3 py-2.5">
                  <span className={`inline-flex rounded-[2px] border px-2 py-1 text-xs font-semibold ${statusClasses[attendanceStatus] ?? "border-zinc-500/30 bg-zinc-500/10 text-zinc-300"}`}>
                    {statusLabels[attendanceStatus] ?? attendance.status ?? "-"}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
