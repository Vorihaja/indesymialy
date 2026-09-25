import type { Database } from "@/infrastructure/supabase/database.types";

export type FightRow = Database["public"]["Tables"]["fights"]["Row"];
export type FightRoundRow = Database["public"]["Tables"]["fight_rounds"]["Row"];
export type FightScoreRow = Database["public"]["Tables"]["fight_scores"]["Row"];
export type FightJudgeCardRow = Database["public"]["Tables"]["fight_judge_cards"]["Row"];
export type FightJudgeRoundScoreRow = Database["public"]["Tables"]["fight_judge_round_scores"]["Row"];
export type FightOfficialRow = Database["public"]["Tables"]["fight_official_assignments"]["Row"];
export type FightTimerEventRow = Database["public"]["Tables"]["fight_timer_events"]["Row"];
export type FightEventLogRow = Database["public"]["Tables"]["fight_event_log"]["Row"];
export type FightStatisticRow = Database["public"]["Tables"]["fight_statistics"]["Row"];
export type FightResultRow = Database["public"]["Tables"]["fight_results"]["Row"];

export type FightLiveMode = "organizer" | "referee" | "judge" | "fighter" | "public" | "admin";
export type FightLiveAccessMode = "public-viewer" | "authorized-participant" | "organizer-manager" | "platform-manager" | "assigned-official" | "assigned-judge";
export type RoleLiveRole = "admin" | "super-admin" | "club" | "coach" | "fan" | "federation" | "league" | "seller" | "sponsor";
export interface FightLiveCapabilities { accessMode: FightLiveAccessMode; canViewPublicLive: boolean; canViewOperationalLive: boolean; canControlTimer: boolean; canRecordOfficialAction: boolean; canScoreJudgeCard: boolean; canDecideFight: boolean; canPublishResult: boolean; canRecalculateStatistics: boolean; }
export type FightLiveSection = "overview" | "setup" | "officials" | "control" | "statistics" | "result" | "scorecard";
export type FightLiveStatus = "scheduled" | "ready" | "live" | "paused" | "recovery" | "completed" | "published";
export type FightTimerAction = "start" | "pause" | "timeout" | "medical_timeout" | "technical_pause" | "resume" | "end_round" | "next_round" | "end_fight";
export type FightCorner = "red" | "blue";
export type FightDecisionMethod = "unanimous_decision" | "split_decision" | "majority_decision" | "ko" | "tko" | "submission" | "disqualification" | "medical_stoppage" | "no_contest" | "draw";
export type FightActionKind = "strike" | "takedown" | "knockdown" | "submission" | "warning" | "penalty" | "incident" | "interruption" | "resume" | "medical_stoppage" | "disqualification" | "retirement";
export type FightTimelineKind = FightActionKind | "timer" | "score" | "decision" | "system";

export interface FightLiveFighter { id: string; name: string; nickname?: string; club?: string; corner: FightCorner; }
export interface FightLiveOfficial { id: string; name: string; role: "referee" | "judge" | "timekeeper" | "doctor" | "supervisor"; available: boolean; status: "assigned" | "confirmed" | "declined" | "completed"; }
export interface FightRuleSummary { code: string; label: string; value: string; }
export interface FightTimerState { roundNumber: number; totalRounds: number; roundDurationSeconds: number; recoveryDurationSeconds: number; remainingSeconds: number; elapsedSeconds: number; status: FightLiveStatus; }
export interface FightTimerLog { id: string; action: "start" | "pause" | "resume" | "end_round" | "recovery" | "next_round" | "end_fight"; roundNumber: number; occurredAt: string; }
export interface FightRoundScore { roundNumber: number; red: number; blue: number; warnings: FightCorner[]; penalties: Array<{ corner: FightCorner; points: number; reason: string }>; locked: boolean; }
export interface FightJudgeCard { id: string; judgeId: string; judgeName: string; status?: string; scores: FightRoundScore[]; submitted: boolean; locked: boolean; submittedAt?: string; }
export interface FightLiveAction { id: string; kind: FightTimelineKind; corner?: FightCorner; roundNumber: number; elapsedSeconds: number; label: string; public: boolean; createdAt: string; }
export interface FightLiveStatistics { red: { actions: number; efficiency: number; penalties: number; controlSeconds: number; knockdowns: number; submissions: number; estimatedScore: number }; blue: { actions: number; efficiency: number; penalties: number; controlSeconds: number; knockdowns: number; submissions: number; estimatedScore: number }; byRound: Array<{ roundNumber: number; redActions: number; blueActions: number }>; }
export interface FightLiveDecision { winnerId: string | null; method: FightDecisionMethod; roundNumber: number; timeSeconds: number; finalScore: string; validated: boolean; published: boolean; history: string[]; }
export interface FightLiveSnapshot { fightId: string; eventId: string; eventName: string; eventStartsAt?: string; fightOrder?: number; weightCategory?: string; assignmentStatus?: string; scorecardStatus?: string; currentOperatorRoles: FightLiveOfficial["role"][]; disciplineId: string; disciplineName: string; redFighter: FightLiveFighter; blueFighter: FightLiveFighter; status: FightLiveStatus; timer: FightTimerState; officials: FightLiveOfficial[]; rules: FightRuleSummary[]; judgeCards: FightJudgeCard[]; actions: FightLiveAction[]; statistics: FightLiveStatistics; decision: FightLiveDecision | null; }
export interface PublicFightLiveSnapshot { fightId: string; eventName: string; eventStartsAt?: string; fightOrder?: number; weightCategory?: string; assignmentStatus?: string; scorecardStatus?: string; disciplineName: string; redFighter: FightLiveFighter; blueFighter: FightLiveFighter; status: FightLiveStatus; timer: FightTimerState; actions: FightLiveAction[]; statistics: FightLiveStatistics; result: FightLiveDecision | null; }
