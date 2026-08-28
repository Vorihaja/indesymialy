import type { UUID } from "@/types/common";
import type { ClubMember } from "../types";
import { ClubMemberService } from "../services/club-member.service";
export type AddMemberInput = Omit<ClubMember, "id">;
export class AddMemberUseCase {
  constructor(private readonly service: ClubMemberService) {}
  async execute(input: AddMemberInput): Promise<ClubMember> {
    if (!input.organization_id) throw new Error("Le club est obligatoire");
    if (!input.first_name || !input.last_name) throw new Error("Nom et prÃ©nom obligatoires");
    return this.service.addMember(input);
  }
  async remove(memberId: UUID): Promise<void> { await this.service.removeMember(memberId); }
}