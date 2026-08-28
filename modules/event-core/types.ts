import type { Database } from "@/infrastructure/supabase/database.types";
export type EventRow = Database["public"]["Tables"]["events"]["Row"];
export type ChecklistRow = Database["public"]["Tables"]["event_checklists"]["Row"];
export type EventSponsorRow = Database["public"]["Tables"]["event_sponsors"]["Row"];
export type StaffAssignmentRow = Database["public"]["Tables"]["staff_assignments"]["Row"];
export type TicketTypeRow = Database["public"]["Tables"]["ticket_types"]["Row"];
export type TicketRow = Database["public"]["Tables"]["tickets"]["Row"];
export type TicketSaleRow = Database["public"]["Tables"]["ticket_sales"]["Row"];
export type FightCardRow = Database["public"]["Tables"]["fight_card"]["Row"];
export type FightResultRow = Database["public"]["Tables"]["fight_results"]["Row"];
export type EventStatus = "draft" | "published" | "completed" | "cancelled" | "archived";
export type EventVisibility = "public" | "private" | "unlisted";
export type CompetitionKind = "tournament" | "gala" | "championship" | "camp" | "demonstration" | "weigh_in" | "press_conference";
export type RegistrationStatus = "pending" | "validated" | "refused" | "waiting_list";
export type ChecklistCategory = "security" | "medical" | "logistics" | "venue" | "equipment" | "officials" | "participants" | "ticketing" | "sponsors" | "communication" | "broadcast" | "administration";
export type EventSection = "overview" | "form" | "competitions" | "registrations" | "participants" | "staff" | "checklists" | "sponsors" | "tickets" | "access" | "planning" | "fight-card" | "results" | "reports" | "search" | "calendar" | "admin";
export type EventMode = "public" | "organizer" | "club" | "fighter" | "official" | "admin";
export interface EventRecord { id:string; title:string; description:string; discipline:string; organizerId:string; organizerName:string; venue:string; region:string; city:string; capacity:number; startsAt:string; endsAt:string; budget:number; status:EventStatus; visibility:EventVisibility; imageUrl?:string; rulesUrl?:string; contacts:Array<{name:string;email:string;phone?:string}>; statistics:{registrations:number;ticketsSold:number;fights:number;revenue:number}; }
export interface Competition { id:string; eventId:string; name:string; kind:CompetitionKind; categories:string[]; rules:string; participantIds:string[]; ranking:string[]; resultSummary?:string; }
export interface FightCardEntry { id:string; eventId:string; order:number; billing:"main_event"|"co_main_event"|"preliminary"; redFighter:string; blueFighter:string; discipline:string; weightCategory:string; rounds:number; roundDurationSeconds:number; status:"planned"|"confirmed"|"replacement_needed"|"cancelled"|"completed"; plannedMethod?:string; fightLiveId?:string; }
export interface EventRegistration { id:string; eventId:string; applicantType:"fighter"|"club"; applicantName:string; category:string; weightKg?:number; licenceNumber?:string; medicalCertificate:boolean; documents:string[]; paymentStatus:"not_required"|"prepared"|"pending"|"paid"; status:RegistrationStatus; history:string[]; }
export interface EventParticipant { id:string; eventId:string; name:string; kind:"fighter"|"club"|"coach"|"organizer"|"referee"|"judge"|"volunteer"|"staff"|"sponsor"|"seller"|"media"; status:string; }
export interface EventStaffAssignment { id:string; eventId:string; name:string; role:string; availability:string; schedule:string; mission:string; status:"invited"|"confirmed"|"declined"|"completed"; compensationPrepared?:number; documents:string[]; email:string; phone?:string; }
export interface EventChecklistItem { id:string; eventId:string; category:ChecklistCategory; title:string; assignee:string; dueAt:string; priority:"low"|"normal"|"high"|"critical"; status:"todo"|"in_progress"|"validated"; comment?:string; attachmentPrepared?:string; }
export interface EventSponsor { id:string; eventId:string; name:string; level:"title"|"partner"|"supplier"; packageName:string; amount:number; benefits:string[]; visibility:string[]; contractPrepared:boolean; deliverables:string[]; status:"prospect"|"negotiating"|"confirmed"|"completed"; history:string[]; }
export interface EventTicketType { id:string; eventId:string; name:string; category:string; price:number; quota:number; sold:number; reserved:number; active:boolean; }
export interface EventTicket { id:string; eventId:string; ticketTypeId:string; holderName:string; code:string; qrPrepared:boolean; status:"reserved"|"sold"|"cancelled"|"refunded"|"used"; paymentStatus:"prepared"|"pending"|"paid"|"refunded"; }
export interface AccessLog { id:string; ticketId:string; result:"accepted"|"used"|"refused"|"duplicate"|"exit"; occurredAt:string; operator:string; zone:string; manual:boolean; }
export interface ScheduleItem { id:string; eventId:string; kind:"weigh_in"|"briefing"|"fight"|"break"|"ceremony"|"media"|"sponsor"|"closing"; title:string; startsAt:string; endsAt:string; location:string; notificationPrepared:boolean; }
export interface EventResult { id:string; eventId:string; fightId?:string; title:string; winner:string; podium:string[]; decision:string; statistics:Record<string,number>; published:boolean; officialReportPrepared:boolean; exportPrepared:boolean; source:"fight_live"|"manual"; }
export interface EventReport { id:string; eventId:string; kind:"financial"|"ticketing"|"participants"|"incidents"|"medical"|"official"|"sponsors"|"audience"|"fight_live"; title:string; status:"draft"|"ready"|"published"; generatedAt?:string; exportPrepared:boolean; }
export interface EventPlatformSnapshot { events:EventRecord[]; competitions:Competition[]; fightCard:FightCardEntry[]; registrations:EventRegistration[]; participants:EventParticipant[]; staff:EventStaffAssignment[]; checklists:EventChecklistItem[]; sponsors:EventSponsor[]; ticketTypes:EventTicketType[]; tickets:EventTicket[]; accessLogs:AccessLog[]; schedule:ScheduleItem[]; results:EventResult[]; reports:EventReport[]; }
