import type { Database } from "@/infrastructure/supabase/database.types";
type Tables = Database["public"]["Tables"];
export type Club = Tables["clubs"]["Row"]; export type ClubInsert = Tables["clubs"]["Insert"]; export type ClubUpdate = Tables["clubs"]["Update"];
export type Organization = Tables["organizations"]["Row"]; export type OrganizationInsert = Tables["organizations"]["Insert"]; export type OrganizationMemberInsert = Tables["organization_members"]["Insert"];
export type ClubMember = Pick<Tables["club_members"]["Row"], "id" | "organization_id" | "profile_id" | "fighter_id" | "first_name" | "last_name" | "full_name" | "email" | "phone" | "primary_discipline" | "member_status" | "role" | "joined_at" | "left_at" | "created_at" | "updated_at">; export type ClubMemberInsert = Tables["club_members"]["Insert"]; export type ClubMemberUpdate = Tables["club_members"]["Update"];
export type Attendance = Tables["attendances"]["Row"]; export type AttendanceInsert = Tables["attendances"]["Insert"]; export type AttendanceUpdate = Tables["attendances"]["Update"];
export type ClubTransaction = Tables["club_transactions"]["Row"]; export type ClubTransactionInsert = Tables["club_transactions"]["Insert"]; export type ClubTransactionUpdate = Tables["club_transactions"]["Update"];
export type ClubEvent = Tables["club_events"]["Row"];
export interface ActiveClub { club: Club; clubs: Club[]; clubId: string; organizationId: string; }
export interface ClubStats { members_count: number; fighters_count: number; coaches_count: number; attendance_rate: number; revenue: number; }
export interface ClubDashboard { club: Club; stats: ClubStats; }