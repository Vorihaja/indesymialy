import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/infrastructure/supabase/database.types";
import { BackendError, normalizeBackendError } from "@/shared/errors/backend-error";
import { FightLiveMemoryRepository } from "./fight-live-memory.repository";
import type {
  FightActionKind,
  FightCorner,
  FightDecisionMethod,
  FightJudgeCard,
  FightLiveAction,
  FightLiveDecision,
  FightLiveSnapshot,
  FightLiveStatistics,
  FightLiveStatus,
  PublicFightLiveSnapshot,
} from "../types";

type FightRow = Database["public"]["Tables"]["fights"]["Row"];

function liveStatus(value: string | null): FightLiveStatus {
  return ["scheduled", "ready", "live", "paused", "recovery", "completed", "published"].includes(value ?? "")
    ? value as FightLiveStatus
    : "scheduled";
}

function decisionMethod(value: string): FightDecisionMethod {
  return [
    "unanimous_decision", "split_decision", "majority_decision", "ko", "tko",
    "submission", "disqualification", "retirement", "no_contest", "draw",
  ].includes(value) ? value as FightDecisionMethod : "unanimous_decision";
}

function actionKind(value: string): FightActionKind {
  return [
    "strike", "takedown", "knockdown", "submission", "warning", "penalty",
    "incident", "interruption", "resume", "medical_stoppage",
    "disqualification", "retirement",
  ].includes(value) ? value as FightActionKind : "strike";
}

export class FightLiveSupabaseRepository extends FightLiveMemoryRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {
    super();
  }

  override async list(): Promise<FightLiveSnapshot[]> {
    const { data, error } = await this.supabase
      .from("fights")
      .select("id")
      .order("fight_order");
    if (error) throw normalizeBackendError(error);
    return Promise.all((data ?? []).map((fight) => this.get(fight.id)));
  }

  override async get(fightId: string): Promise<FightLiveSnapshot> {
    try {
      const [
        fightResult,
        roundsResult,
        timerResult,
        officialsResult,
        cardsResult,
        actionsResult,
        statisticsResult,
        decisionsResult,
        penaltiesResult,
        incidentsResult,
      ] = await Promise.all([
        this.supabase.from("fights").select("*").eq("id", fightId).maybeSingle(),
        this.supabase.from("fight_rounds").select("*").eq("fight_id", fightId).order("round_number"),
        this.supabase.from("fight_timer_events").select("*").eq("fight_id", fightId).order("created_at"),
        this.supabase.from("fight_official_assignments").select("*").eq("fight_id", fightId),
        this.supabase.from("fight_judge_cards").select("*").eq("fight_id", fightId).order("created_at"),
        this.supabase.from("fight_live_actions").select("*").eq("fight_id", fightId).order("recorded_at", { ascending: false }),
        this.supabase.from("fight_statistics").select("*").eq("fight_id", fightId),
        this.supabase.from("fight_decisions").select("*").eq("fight_id", fightId).order("created_at", { ascending: false }),
        this.supabase.from("fight_penalties").select("*").eq("fight_id", fightId).order("issued_at", { ascending: false }),
        this.supabase.from("fight_incidents").select("*").eq("fight_id", fightId).order("detected_at", { ascending: false }),
      ]);
      const firstError = [
        fightResult.error, roundsResult.error, timerResult.error, officialsResult.error,
        cardsResult.error, actionsResult.error, statisticsResult.error,
        decisionsResult.error, penaltiesResult.error, incidentsResult.error,
      ].find(Boolean);
      if (firstError) throw firstError;
      const fight = fightResult.data;
      if (!fight) throw new BackendError("NOT_FOUND", "Le combat est introuvable.");

      const [eventResult, disciplineResult, redResult, blueResult] = await Promise.all([
        fight.event_id
          ? this.supabase.from("events").select("id,title").eq("id", fight.event_id).maybeSingle()
          : Promise.resolve({ data: null, error: null }),
        this.supabase.from("disciplines").select("id,name").eq("id", fight.discipline_id).maybeSingle(),
        fight.fighter_red_id
          ? this.supabase.from("fighters").select("id,full_name,nickname").eq("id", fight.fighter_red_id).maybeSingle()
          : Promise.resolve({ data: null, error: null }),
        fight.fighter_blue_id
          ? this.supabase.from("fighters").select("id,full_name,nickname").eq("id", fight.fighter_blue_id).maybeSingle()
          : Promise.resolve({ data: null, error: null }),
      ]);
      const contextError = [eventResult.error, disciplineResult.error, redResult.error, blueResult.error].find(Boolean);
      if (contextError) throw contextError;

      const officialProfileIds = Array.from(new Set([
        ...(officialsResult.data ?? []).map((item) => item.user_id),
        ...(cardsResult.data ?? []).map((card) => card.judge_id),
      ].filter(Boolean)));
      const { data: profiles, error: profileError } = officialProfileIds.length
        ? await this.supabase.from("profiles").select("id,full_name").in("id", officialProfileIds)
        : { data: [], error: null };
      if (profileError) throw profileError;
      const profileNames = new Map((profiles ?? []).map((profile) => [profile.id, profile.full_name]));

      const cards = await Promise.all((cardsResult.data ?? []).map(async (card): Promise<FightJudgeCard> => {
        const { data: scores, error: scoreError } = await this.supabase
          .from("fight_judge_round_scores")
          .select("*")
          .eq("judge_card_id", card.id)
          .order("round_number");
        if (scoreError) throw scoreError;
        return {
          id: card.id,
          judgeId: card.judge_id,
          judgeName: profileNames.get(card.judge_id) ?? "Juge",
          scores: (scores ?? []).map((score) => ({
            roundNumber: score.round_number,
            red: score.red_score,
            blue: score.blue_score,
            warnings: [],
            penalties: [],
            locked: card.card_status === "submitted" || card.card_status === "locked",
          })),
          submitted: Boolean(card.submitted_at) || card.card_status === "submitted",
          locked: card.card_status === "submitted" || card.card_status === "locked",
          submittedAt: card.submitted_at ?? undefined,
        };
      }));

      const rounds = roundsResult.data ?? [];
      const currentRound = [...rounds].reverse().find((round) => round.status !== "completed") ?? rounds.at(-1);
      const roundDuration = currentRound?.duration_seconds ?? 300;
      const latestTimer = timerResult.data?.at(-1);
      const elapsed = latestTimer?.duration_seconds ?? 0;
      const actions: FightLiveAction[] = [
        ...(actionsResult.data ?? []).map((action) => this.mapAction(
          action.id,
          action.action_type,
          this.corner(fight, action.fighter_id),
          action.round_number,
          0,
          action.recorded_at,
          true
        )),
        ...(penaltiesResult.data ?? []).map((penalty) => this.mapAction(
          penalty.id,
          "penalty",
          this.corner(fight, penalty.fighter_id),
          rounds.find((round) => round.id === penalty.round_id)?.round_number ?? currentRound?.round_number ?? 1,
          0,
          penalty.issued_at,
          true
        )),
        ...(incidentsResult.data ?? []).map((incident) => this.mapAction(
          incident.id,
          "incident",
          undefined,
          currentRound?.round_number ?? 1,
          0,
          incident.detected_at,
          false
        )),
      ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

      return {
        fightId: fight.id,
        eventId: fight.event_id ?? "",
        eventName: eventResult.data?.title ?? "Événement",
        disciplineId: fight.discipline_id,
        disciplineName: disciplineResult.data?.name ?? "Discipline",
        redFighter: {
          id: fight.fighter_red_id ?? "",
          name: redResult.data?.full_name ?? "Coin rouge",
          nickname: redResult.data?.nickname ?? undefined,
          corner: "red",
        },
        blueFighter: {
          id: fight.fighter_blue_id ?? "",
          name: blueResult.data?.full_name ?? "Coin bleu",
          nickname: blueResult.data?.nickname ?? undefined,
          corner: "blue",
        },
        status: liveStatus(fight.status),
        timer: {
          roundNumber: currentRound?.round_number ?? 1,
          totalRounds: fight.scheduled_rounds ?? Math.max(rounds.length, 1),
          roundDurationSeconds: roundDuration,
          recoveryDurationSeconds: 60,
          remainingSeconds: Math.max(0, roundDuration - elapsed),
          elapsedSeconds: elapsed,
          status: liveStatus(fight.status),
        },
        officials: (officialsResult.data ?? [])
          .filter((official) =>
            ["referee", "judge", "timekeeper", "doctor", "supervisor"].includes(official.role) &&
            official.status !== "cancelled"
          )
          .sort((left, right) => {
            const roleOrder: Record<string, number> = {
              referee: 0,
              judge: 1,
              timekeeper: 2,
              doctor: 3,
              supervisor: 4,
            };
            return (roleOrder[left.role] ?? 99) - (roleOrder[right.role] ?? 99) ||
              Number(left.position ?? 0) - Number(right.position ?? 0);
          })
          .map((official) => ({
            id: official.user_id,
            name: profileNames.get(official.user_id) ?? "Officiel",
            role: official.role as "referee" | "judge" | "timekeeper" | "doctor" | "supervisor",
            available: official.status !== "declined",
            status: official.status === "confirmed"
              ? "confirmed"
              : official.status === "declined"
                ? "declined"
                : official.status === "completed"
                  ? "completed"
                  : "assigned",
          })),
        rules: [
          { code: "rounds", label: "Rounds", value: String(fight.scheduled_rounds ?? rounds.length) },
          { code: "duration", label: "Durée", value: `${roundDuration} secondes` },
          { code: "weight", label: "Catégorie", value: fight.weight_category?.trim() || "Non définie" },
        ],
        judgeCards: cards,
        actions,
        statistics: this.mapStatistics(fight, statisticsResult.data ?? [], actions),
        decision: this.mapDecision(fight, decisionsResult.data?.[0], cards),
      };
    } catch (reason) {
      throw normalizeBackendError(reason);
    }
  }

  override async getPublic(fightId: string): Promise<PublicFightLiveSnapshot> {
    const fight = await this.get(fightId);
    return {
      fightId: fight.fightId,
      eventName: fight.eventName,
      disciplineName: fight.disciplineName,
      redFighter: fight.redFighter,
      blueFighter: fight.blueFighter,
      status: fight.status,
      timer: fight.timer,
      actions: fight.actions.filter((action) => action.public),
      statistics: fight.statistics,
      result: fight.status === "published" ? fight.decision : null,
    };
  }

  override async updateTimer(
    fightId: string,
    action: "start" | "pause" | "resume" | "end_round" | "next_round" | "end_fight"
  ): Promise<FightLiveSnapshot> {
    const fight = await this.get(fightId);
    const round = await this.currentRound(fightId);
    try {
      const nextStatus: FightLiveStatus =
        action === "pause" ? "paused" :
        action === "end_round" ? "recovery" :
        action === "end_fight" ? "completed" : "live";
      const { error: timerError } = await this.supabase.from("fight_timer_events").insert({
        fight_id: fightId,
        round_id: round?.id ?? null,
        event_type: action,
        duration_seconds: fight.timer.elapsedSeconds,
        started_at: action === "start" || action === "resume" || action === "next_round"
          ? new Date().toISOString()
          : null,
        ended_at: action === "pause" || action === "end_round" || action === "end_fight"
          ? new Date().toISOString()
          : null,
      });
      if (timerError) throw timerError;

      if (action === "end_round" && round) {
        const { error } = await this.supabase.from("fight_rounds").update({
          status: "completed",
          ended_at: new Date().toISOString(),
        }).eq("id", round.id);
        if (error) throw error;
      }
      if (action === "next_round") {
        const { error } = await this.supabase.from("fight_rounds").insert({
          fight_id: fightId,
          round_number: Math.min(fight.timer.roundNumber + 1, fight.timer.totalRounds),
          duration_seconds: fight.timer.roundDurationSeconds,
          status: "live",
          started_at: new Date().toISOString(),
        });
        if (error) throw error;
      }
      const { error: fightError } = await this.supabase
        .from("fights")
        .update({ status: nextStatus, updated_at: new Date().toISOString() })
        .eq("id", fightId);
      if (fightError) throw fightError;
      return this.get(fightId);
    } catch (reason) {
      throw normalizeBackendError(reason);
    }
  }

  override async recordAction(
    fightId: string,
    kind: FightActionKind,
    corner?: FightCorner
  ): Promise<FightLiveSnapshot> {
    const fight = await this.get(fightId);
    const fighterId = corner === "red" ? fight.redFighter.id : corner === "blue" ? fight.blueFighter.id : null;
    try {
      if (kind === "incident") {
        const { error } = await this.supabase.from("fight_incidents").insert({
          fight_id: fightId,
          incident_type: "incident",
          severity: "medium",
        });
        if (error) throw error;
      } else if (kind === "penalty") {
        if (!fighterId) throw new BackendError("VALIDATION_ERROR");
        const round = await this.currentRound(fightId);
        const { error } = await this.supabase.from("fight_penalties").insert({
          fight_id: fightId,
          fighter_id: fighterId,
          round_id: round?.id ?? null,
          penalty_type: "penalty",
          points_deducted: 1,
          status: "issued",
        });
        if (error) throw error;
      } else {
        const { error } = await this.supabase.from("fight_live_actions").insert({
          fight_id: fightId,
          fighter_id: fighterId,
          action_type: kind,
          round_number: fight.timer.roundNumber,
          points_delta: kind === "knockdown" ? 1 : 0,
        });
        if (error) throw error;
      }
      return this.get(fightId);
    } catch (reason) {
      throw normalizeBackendError(reason);
    }
  }

  override async assignOfficial(fightId: string, officialId: string): Promise<FightLiveSnapshot> {
    try {
      const { data: existing, error: readError } = await this.supabase
        .from("fight_official_assignments")
        .select("id")
        .eq("fight_id", fightId)
        .eq("user_id", officialId)
        .maybeSingle();
      if (readError) throw readError;
      if (!existing) {
        throw new BackendError(
          "NOT_FOUND",
          "Cet officiel n’est pas affecté à ce combat dans Fight Center."
        );
      }
      const result = await this.supabase
        .from("fight_official_assignments")
        .update({ status: "confirmed" })
        .eq("id", existing.id);
      if (result.error) throw result.error;
      return this.get(fightId);
    } catch (reason) {
      throw normalizeBackendError(reason);
    }
  }

  override async saveRoundScore(
    fightId: string,
    cardId: string,
    roundNumber: number,
    red: number,
    blue: number
  ): Promise<FightLiveSnapshot> {
    try {
      const { data: card, error: cardError } = await this.supabase
        .from("fight_judge_cards")
        .select("id,card_status")
        .eq("id", cardId)
        .eq("fight_id", fightId)
        .maybeSingle();
      if (cardError) throw cardError;
      if (!card) throw new BackendError("NOT_FOUND");
      if (card.card_status === "submitted" || card.card_status === "locked") {
        throw new BackendError("FORBIDDEN", "Cette carte est verrouillée.");
      }
      const { data: existing, error: scoreReadError } = await this.supabase
        .from("fight_judge_round_scores")
        .select("id")
        .eq("judge_card_id", cardId)
        .eq("round_number", roundNumber)
        .maybeSingle();
      if (scoreReadError) throw scoreReadError;
      const result = existing
        ? await this.supabase.from("fight_judge_round_scores").update({
            red_score: red,
            blue_score: blue,
          }).eq("id", existing.id)
        : await this.supabase.from("fight_judge_round_scores").insert({
            judge_card_id: cardId,
            round_number: roundNumber,
            red_score: red,
            blue_score: blue,
          });
      if (result.error) throw result.error;
      return this.get(fightId);
    } catch (reason) {
      throw normalizeBackendError(reason);
    }
  }

  override async submitCard(fightId: string, cardId: string): Promise<FightLiveSnapshot> {
    const { error } = await this.supabase
      .from("fight_judge_cards")
      .update({ card_status: "submitted", submitted_at: new Date().toISOString() })
      .eq("id", cardId)
      .eq("fight_id", fightId);
    if (error) throw normalizeBackendError(error);
    return this.get(fightId);
  }

  override async decide(
    fightId: string,
    winnerId: string | null,
    method: FightDecisionMethod
  ): Promise<FightLiveSnapshot> {
    const fight = await this.get(fightId);
    const loserId = winnerId === fight.redFighter.id
      ? fight.blueFighter.id
      : winnerId === fight.blueFighter.id
        ? fight.redFighter.id
        : null;
    try {
      const { error: decisionError } = await this.supabase.from("fight_decisions").insert({
        fight_id: fightId,
        decision_type: method,
        winner_id: winnerId,
        loser_id: loserId,
        round_number: fight.timer.roundNumber,
        time_of_end: String(fight.timer.elapsedSeconds),
      });
      if (decisionError) throw decisionError;
      const { error: fightError } = await this.supabase.from("fights").update({
        winner_id: winnerId,
        method,
        ending_round: fight.timer.roundNumber,
        ending_time: String(fight.timer.elapsedSeconds),
        status: "completed",
        updated_at: new Date().toISOString(),
      }).eq("id", fightId);
      if (fightError) throw fightError;
      return this.get(fightId);
    } catch (reason) {
      throw normalizeBackendError(reason);
    }
  }

  override async publish(fightId: string): Promise<FightLiveSnapshot> {
    const fight = await this.get(fightId);
    if (!fight.decision) throw new BackendError("VALIDATION_ERROR", "La décision doit être validée avant publication.");
    const { error } = await this.supabase
      .from("fights")
      .update({ status: "published", updated_at: new Date().toISOString() })
      .eq("id", fightId);
    if (error) throw normalizeBackendError(error);
    return this.get(fightId);
  }

  private async currentRound(fightId: string) {
    const { data, error } = await this.supabase
      .from("fight_rounds")
      .select("*")
      .eq("fight_id", fightId)
      .order("round_number", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw normalizeBackendError(error);
    return data;
  }

  private corner(fight: FightRow, fighterId: string | null): FightCorner | undefined {
    if (fighterId === fight.fighter_red_id) return "red";
    if (fighterId === fight.fighter_blue_id) return "blue";
    return undefined;
  }

  private mapAction(
    id: string,
    kind: string,
    corner: FightCorner | undefined,
    roundNumber: number,
    elapsedSeconds: number,
    createdAt: string | null,
    isPublic: boolean
  ): FightLiveAction {
    return {
      id,
      kind: actionKind(kind),
      corner,
      roundNumber,
      elapsedSeconds,
      label: kind.replaceAll("_", " "),
      public: isPublic,
      createdAt: createdAt ?? new Date(0).toISOString(),
    };
  }

  private mapStatistics(
    fight: FightRow,
    rows: Database["public"]["Tables"]["fight_statistics"]["Row"][],
    actions: FightLiveAction[]
  ): FightLiveStatistics {
    const side = (fighterId: string | null, corner: FightCorner) => {
      const row = rows.find((item) => item.fighter_id === fighterId);
      const cornerActions = actions.filter((action) => action.corner === corner);
      return {
        actions: cornerActions.length,
        efficiency: row?.total_strikes
          ? Math.round(((row.successful_strikes ?? 0) / row.total_strikes) * 100)
          : 0,
        penalties: row?.penalties ?? cornerActions.filter((action) => action.kind === "penalty").length,
        controlSeconds: row?.control_time_seconds ?? 0,
        knockdowns: cornerActions.filter((action) => action.kind === "knockdown").length,
        submissions: row?.submission_successful ?? 0,
        estimatedScore: row?.points_scored ?? 0,
      };
    };
    const rounds = [...new Set(actions.map((action) => action.roundNumber))];
    return {
      red: side(fight.fighter_red_id, "red"),
      blue: side(fight.fighter_blue_id, "blue"),
      byRound: rounds.map((roundNumber) => ({
        roundNumber,
        redActions: actions.filter((action) => action.roundNumber === roundNumber && action.corner === "red").length,
        blueActions: actions.filter((action) => action.roundNumber === roundNumber && action.corner === "blue").length,
      })),
    };
  }

  private mapDecision(
    fight: FightRow,
    row: Database["public"]["Tables"]["fight_decisions"]["Row"] | undefined,
    cards: FightJudgeCard[]
  ): FightLiveDecision | null {
    if (!row) return null;
    return {
      winnerId: row.winner_id,
      method: decisionMethod(row.decision_type),
      roundNumber: row.round_number ?? fight.ending_round ?? 0,
      timeSeconds: Number.parseInt(row.time_of_end ?? fight.ending_time ?? "0", 10) || 0,
      finalScore: cards.map((card) =>
        `${card.scores.reduce((sum, score) => sum + score.red, 0)}-${card.scores.reduce((sum, score) => sum + score.blue, 0)}`
      ).join(" / "),
      validated: true,
      published: fight.status === "published",
      history: row.created_at ? [`Décision — ${row.created_at}`] : [],
    };
  }
}
