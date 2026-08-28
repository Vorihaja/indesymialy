import type { UUID } from "@/types/common";
import type { Attendance } from "../types";
import { AttendanceService } from "../services/attendance.service";
export type RecordAttendanceInput = Omit<Attendance, "id">;
export class RecordAttendanceUseCase {
  constructor(private readonly service: AttendanceService) {}
  async execute(input: RecordAttendanceInput): Promise<Attendance> {
    if (!input.organization_id) throw new Error("Le club est obligatoire");
    if (!input.member_id) throw new Error("Le membre est obligatoire");
    if (!input.status) throw new Error("Le statut de prÃ©sence est obligatoire");
    return this.service.recordAttendance(input);
  }
  async update(id: UUID, input: Partial<Attendance>): Promise<Attendance> { return this.service.updateAttendance(id, input); }
  async remove(id: UUID): Promise<void> { await this.service.deleteAttendance(id); }
}