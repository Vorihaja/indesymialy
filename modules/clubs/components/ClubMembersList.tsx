"use client";

import type { ClubMember } from "../types";

interface ClubMembersListProps {
  members: ClubMember[];
  onSelect?: (member: ClubMember) => void;
}

const roleLabels: Record<string, string> = {
  fighter: "Combattant",
  coach: "Coach",
  manager: "Responsable",
  member: "Membre",
};

export default function ClubMembersList({
  members,
  onSelect,
}: ClubMembersListProps) {
  if (!members.length) {
    return (
      <div className="rounded-[2px] border border-dashed border-[#303238] bg-[#151619] p-4 text-center text-sm text-zinc-500">
        Aucun membre enregistré.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {members.map((member) => (
        <div
          key={member.id}
          onClick={() => onSelect?.(member)}
          className="cursor-pointer rounded-[2px] border border-[#303238] bg-[#151619] p-3 transition hover:border-[#3d92ff]/60 hover:bg-[#3d92ff]/5"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <h4 className="font-semibold text-zinc-100">
                {member.full_name ?? `${member.first_name ?? ""} ${member.last_name ?? ""}`}
              </h4>
              <p className="mt-1 text-sm text-zinc-500">
                {member.primary_discipline ?? "Discipline non définie"}
              </p>
            </div>
            <span className="rounded-[2px] border border-[#3d92ff]/30 bg-[#3d92ff]/10 px-2 py-1 text-xs font-semibold text-[#78b5ff]">
              {roleLabels[member.role ?? ""] ?? member.role ?? "Membre"}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
