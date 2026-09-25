import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/infrastructure/supabase/database.types";
import { BackendError, normalizeBackendError } from "@/shared/errors/backend-error";
import type { FightLiveRepositoryPort } from "../services/fight-live-integration.service";
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
  FightTimelineKind,
  FightTimerAction,
  PublicFightLiveSnapshot,
} from "../types";

type FightRow = Database["public"]["Tables"]["fights"]["Row"];
type FightParticipantRow = Pick<FightRow, "fighter_red_id" | "fighter_blue_id">;
type DecisionFightRow = Pick<FightRow, "status"> &
  Partial<Pick<FightRow, "ending_round" | "ending_time">>;
type PublicFightRow = Pick<
  FightRow,
  | "id"
  | "event_id"
  | "fight_order"
  | "fighter_red_id"
  | "fighter_blue_id"
  | "weight_category"
  | "scheduled_rounds"
  | "status"
  | "discipline_id"
>;

function liveStatus(value: string | null): FightLiveStatus {
  return ["scheduled", "ready", "live", "paused", "recovery", "completed", "published"].includes(value ?? "")
    ? value as FightLiveStatus
    : "scheduled";
}

function decisionMethod(value: string): FightDecisionMethod {
  return [
    "unanimous_decision", "split_decision", "majority_decision", "ko", "tko",
    "submission", "disqualification", "medical_stoppage", "no_contest", "draw",
  ].includes(value) ? value as FightDecisionMethod : "unanimous_decision";
}

function actionKind(value: string): FightActionKind {
  return [
    "strike", "takedown", "knockdown", "submission", "warning", "penalty",
    "incident", "interruption", "resume", "medical_stoppage",
    "disqualification", "retirement",
  ].includes(value) ? value as FightActionKind : "strike";
}

function timelineKind(eventType: string, description: string | null): FightTimelineKind {
  const normalized = (description ?? "").trim().toLowerCase().replaceAll(" ", "_");
  if ([
    "strike", "takedown", "knockdown", "submission", "warning", "penalty",
    "incident", "interruption", "resume", "medical_stoppage",
    "disqualification", "retirement",
  ].includes(normalized)) return actionKind(normalized);
  if (eventType === "score") return "score";
  if (eventType === "decision") return "decision";
  if (eventType === "system" || eventType === "medical") return "timer";
  return "system";
}

export class FightLiveSupabaseRepository implements FightLiveRepositoryPort {
  constructor(private readonly supabase: SupabaseClient<Database>) {
  }

  async list(scope: "public" | "organizer" | "official" | "fighter"): Promise<Array<FightLiveSnapshot | PublicFightLiveSnapshot>> {
    const { data, error } = await this.supabase.rpc("fight_live_list_ids", {
      p_scope: scope,
    });
    if (error) throw normalizeBackendError(error);
    return Promise.all((data ?? []).map((fight) =>
      scope === "public" ? this.getPublic(fight.fight_id) : this.get(fight.fight_id)
    ));
  }

  async listJudgeAssignments(): Promise<FightLiveSnapshot[]> {
    try {
      const userId = await this.authenticatedUserId();
      const { data, error } = await this.supabase
        .from("fight_official_assignments")
        .select("fight_id,status")
        .eq("user_id", userId)
        .eq("role", "judge")
        .or("status.is.null,status.in.(assigned,confirmed,completed)");
      if (error) throw error;

      return Promise.all((data ?? []).map(async (assignment) => {
        const fight = await this.get(assignment.fight_id, userId);
        const judgeCards = fight.judgeCards.filter(
          (card) => card.judgeId === userId,
        );

        return {
          ...fight,
          assignmentStatus: assignment.status ?? "assigned",
          scorecardStatus: judgeCards[0]?.status,
          judgeCards,
        };
      }));
    } catch (reason) {
      throw normalizeBackendError(reason);
    }
  }

  async getJudgeScorecard(fightId: string): Promise<FightLiveSnapshot> {
    try {
      const userId = await this.authenticatedUserId();
      const assignmentStatus = await this.requireJudgeAssignment(
        fightId,
        userId,
      );
      const fight = await this.get(fightId, userId);
      const judgeCards = fight.judgeCards.filter(
        (card) => card.judgeId === userId,
      );

      return {
        ...fight,
        assignmentStatus,
        scorecardStatus: judgeCards[0]?.status,
        judgeCards,
      };
    } catch (reason) {
      throw normalizeBackendError(reason);
    }
  }

  async get(fightId: string, judgeId?: string): Promise<FightLiveSnapshot> {
    try {
      const cardsQuery = this.supabase
        .from("fight_judge_cards")
        .select("*")
        .eq("fight_id", fightId);
      const cardsRequest = judgeId
        ? cardsQuery.eq("judge_id", judgeId).order("created_at")
        : cardsQuery.order("created_at");
      const [
        fightResult,
        roundsResult,
        timerResult,
        officialsResult,
        cardsResult,
        timelineResult,
        statisticsResult,
        decisionsResult,
      ] = await Promise.all([
        this.supabase.from("fights").select("*").eq("id", fightId).maybeSingle(),
        this.supabase.from("fight_rounds").select("*").eq("fight_id", fightId).order("round_number"),
        this.supabase.from("fight_timer_events").select("*").eq("fight_id", fightId).order("created_at"),
        this.supabase.from("fight_official_assignments").select("*").eq("fight_id", fightId),
        cardsRequest,
        this.supabase.from("fight_events_timeline").select("*").eq("fight_id", fightId).order("created_at", { ascending: false }),
        this.supabase.from("fight_statistics").select("*").eq("fight_id", fightId),
        this.supabase.from("fight_decisions").select("*").eq("fight_id", fightId).order("created_at", { ascending: false }),
      ]);
      const firstError = [
        fightResult.error, roundsResult.error, timerResult.error, officialsResult.error,
        cardsResult.error, timelineResult.error, statisticsResult.error,
        decisionsResult.error,
      ].find(Boolean);
      if (firstError) throw firstError;
      const fight = fightResult.data;
      if (!fight) throw new BackendError("NOT_FOUND", "Le combat est introuvable.");

      const [eventResult, disciplineResult, redResult, blueResult] = await Promise.all([
        fight.event_id
          ? this.supabase.from("events").select("id,title,starts_at").eq("id", fight.event_id).maybeSingle()
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
      const { data: authData } = await this.supabase.auth.getUser();
      const currentOperatorRoles = (officialsResult.data ?? [])
        .filter((official) =>
          official.user_id === authData.user?.id &&
          official.status !== "cancelled" && official.status !== "declined"
        )
        .map((official) => official.role)
        .filter((role): role is FightLiveSnapshot["currentOperatorRoles"][number] =>
          ["referee", "judge", "timekeeper", "doctor", "supervisor"].includes(role)
        );

      const rounds = roundsResult.data ?? [];
      const scorableRoundNumbers = rounds
        .filter((round) => round.status === "completed")
        .map((round) => round.round_number);
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
          status: card.card_status ?? undefined,
          scores: scorableRoundNumbers.map((roundNumber) => {
            const score = (scores ?? []).find((item) => item.round_number === roundNumber);
            return {
            roundNumber,
            red: score?.red_score ?? 10,
            blue: score?.blue_score ?? 10,
            warnings: [],
            penalties: [],
            locked: card.card_status === "submitted" || card.card_status === "locked",
          }; }),
          submitted: Boolean(card.submitted_at) || card.card_status === "submitted",
          locked: card.card_status === "submitted" || card.card_status === "locked",
          submittedAt: card.submitted_at ?? undefined,
        };
      }));

      const currentRound = [...rounds].reverse().find((round) => round.status !== "completed") ?? rounds.at(-1);
      const roundDuration = currentRound?.duration_seconds ?? 300;
      const remainingResult = currentRound
        ? await this.supabase.rpc("get_round_remaining_time", { p_round_id: currentRound.id })
        : { data: roundDuration, error: null };
      if (remainingResult.error) throw remainingResult.error;
      const remaining = Math.max(0, Number(remainingResult.data ?? roundDuration));
      const elapsed = Math.max(0, roundDuration - remaining);
      const actions = (timelineResult.data ?? []).map((item) => this.mapTimeline(
        fight,
        rounds,
        item,
      ));

      return {
        fightId: fight.id,
        eventId: fight.event_id ?? "",
        eventName: eventResult.data?.title ?? "Événement",
        eventStartsAt: eventResult.data?.starts_at ?? undefined,
        fightOrder: fight.fight_order,
        weightCategory: fight.weight_category ?? undefined,
        currentOperatorRoles,
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
          remainingSeconds: remaining,
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

  async getPublic(fightId: string): Promise<PublicFightLiveSnapshot> {
    try {
      const [fightResult, roundsResult, timelineResult, statisticsResult, decisionsResult] = await Promise.all([
        this.supabase.from("fights")
          .select("id,event_id,fight_order,weight_category,scheduled_rounds,status,discipline_id,fighter_red_id,fighter_blue_id")
          .eq("id", fightId)
          .maybeSingle(),
        this.supabase.from("fight_rounds")
          .select("id,fight_id,round_number,duration_seconds,started_at,ended_at,status,winner_id,created_at")
          .eq("fight_id", fightId)
          .order("round_number"),
        this.supabase.from("fight_events_timeline")
          .select("id,fight_id,round_id,fighter_id,action_type_id,event_type,event_time,description,created_at")
          .eq("fight_id", fightId)
          .order("created_at", { ascending: false }),
        this.supabase.from("fight_statistics").select("*").eq("fight_id", fightId),
        this.supabase.from("fight_decisions")
          .select("id,fight_id,winner_id,loser_id,decision_type,victory_method_id,round_number,time_of_end,description,created_at")
          .eq("fight_id", fightId)
          .order("created_at", { ascending: false })
          .limit(1),
      ]);
      const firstError = [
        fightResult.error, roundsResult.error, timelineResult.error,
        statisticsResult.error, decisionsResult.error,
      ].find(Boolean);
      if (firstError) throw firstError;
      if (!fightResult.data) throw new BackendError("NOT_FOUND", "Le combat est introuvable.");
      const fight: PublicFightRow = fightResult.data;

      const [eventResult, disciplineResult, redResult, blueResult] = await Promise.all([
        fight.event_id
          ? this.supabase.from("events").select("id,title,starts_at").eq("id", fight.event_id).maybeSingle()
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

      const rounds = roundsResult.data ?? [];
      const currentRound = [...rounds].reverse().find((round) => round.status !== "completed") ?? rounds.at(-1);
      const roundDuration = currentRound?.duration_seconds ?? 300;
      const remainingResult = currentRound
        ? await this.supabase.rpc("get_round_remaining_time", { p_round_id: currentRound.id })
        : { data: roundDuration, error: null };
      if (remainingResult.error) throw remainingResult.error;
      const remaining = Math.max(0, Number(remainingResult.data ?? roundDuration));
      const actions = (timelineResult.data ?? []).map((item) => this.mapTimeline(
        fight,
        rounds,
        item as Database["public"]["Tables"]["fight_events_timeline"]["Row"],
      ));
      const decision = decisionsResult.data?.[0] as Database["public"]["Tables"]["fight_decisions"]["Row"] | undefined;

      return {
        fightId: fight.id,
        eventName: eventResult.data?.title ?? "Événement",
        eventStartsAt: eventResult.data?.starts_at ?? undefined,
        fightOrder: fight.fight_order,
        weightCategory: fight.weight_category ?? undefined,
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
          remainingSeconds: remaining,
          elapsedSeconds: Math.max(0, roundDuration - remaining),
          status: liveStatus(fight.status),
        },
        actions,
        statistics: this.mapStatistics(fight, statisticsResult.data ?? [], actions),
        result: fight.status === "published" ? this.mapDecision(fight, decision, []) : null,
      };
    } catch (reason) {
      throw normalizeBackendError(reason);
    }
  }

  async updateTimer(
    fightId: string,
    action: FightTimerAction
  ): Promise<FightLiveSnapshot> {
    try {
      const { error } = await this.supabase.rpc("fight_live_timer_action", {
        p_action: action,
        p_fight_id: fightId,
      });
      if (error) throw error;
      return this.get(fightId);
    } catch (reason) {
      throw normalizeBackendError(reason);
    }
  }

  async recordAction(
    fightId: string,
    kind: FightActionKind,
    corner?: FightCorner
  ): Promise<FightLiveSnapshot> {
    try {
      const { error } = await this.supabase.rpc("fight_live_record_action", {
        p_corner: corner,
        p_fight_id: fightId,
        p_action_type: kind,
      });
      if (error) throw error;
      return this.get(fightId);
    } catch (reason) {
      throw normalizeBackendError(reason);
    }
  }

  async saveRoundScore(
    fightId: string,
    cardId: string,
    roundNumber: number,
    red: number,
    blue: number
  ): Promise<FightLiveSnapshot> {
    try {
      const { error } = await this.supabase.rpc("fight_live_save_judge_score", {
        p_blue_score: blue,
        p_fight_id: fightId,
        p_judge_card_id: cardId,
        p_red_score: red,
        p_round_number: roundNumber,
      });
      if (error) throw error;
      return this.getJudgeScorecard(fightId);
    } catch (reason) {
      throw normalizeBackendError(reason);
    }
  }

  async submitCard(fightId: string, cardId: string): Promise<FightLiveSnapshot> {
    try {
      const { error } = await this.supabase.rpc("fight_live_submit_judge_card", {
        p_judge_card_id: cardId,
      });
      if (error) throw error;
      return this.getJudgeScorecard(fightId);
    } catch (reason) {
      throw normalizeBackendError(reason);
    }
  }

  private async authenticatedUserId(): Promise<string> {
    const { data, error } = await this.supabase.auth.getUser();
    if (error) throw error;
    if (!data.user) {
      throw new BackendError("UNAUTHENTICATED");
    }
    return data.user.id;
  }

  private async requireJudgeAssignment(
    fightId: string,
    userId: string,
  ): Promise<string> {
    const { data, error } = await this.supabase
      .from("fight_official_assignments")
      .select("status")
      .eq("fight_id", fightId)
      .eq("user_id", userId)
      .eq("role", "judge")
      .or("status.is.null,status.in.(assigned,confirmed,completed)")
      .maybeSingle();
    if (error) throw error;
    if (!data) {
      throw new BackendError(
        "FORBIDDEN",
        "Cette scorecard ne fait pas partie de vos désignations de juge.",
      );
    }
    return data.status ?? "assigned";
  }

  async decide(
    fightId: string,
    winnerId: string | null,
    method: FightDecisionMethod
  ): Promise<FightLiveSnapshot> {
    try {
      const { error } = await this.supabase.rpc("fight_live_decide", {
        p_fight_id: fightId,
        p_method: method,
        p_winner_id: winnerId,
      });
      if (error) throw error;
      return this.get(fightId);
    } catch (reason) {
      throw normalizeBackendError(reason);
    }
  }

  async publish(fightId: string): Promise<FightLiveSnapshot> {
    const { error } = await this.supabase.rpc("fight_live_publish_result", {
      p_fight_id: fightId,
    });
    if (error) throw normalizeBackendError(error);
    return this.get(fightId);
  }

  async recalculateStatistics(fightId: string): Promise<FightLiveSnapshot> {
    const { error } = await this.supabase.rpc("update_fight_statistics", {
      p_fight_id: fightId,
    });
    if (error) throw normalizeBackendError(error);
    return this.get(fightId);
  }

  private corner(fight: FightParticipantRow, fighterId: string | null): FightCorner | undefined {
    if (fighterId === fight.fighter_red_id) return "red";
    if (fighterId === fight.fighter_blue_id) return "blue";
    return undefined;
  }

  private mapTimeline(
    fight: FightParticipantRow,
    rounds: Array<{ id: string; round_number: number }>,
    item: Database["public"]["Tables"]["fight_events_timeline"]["Row"],
  ): FightLiveAction {
    const parsedTime = Number.parseInt(item.event_time ?? "0", 10);
    return {
      id: item.id,
      kind: timelineKind(item.event_type, item.description),
      corner: this.corner(fight, item.fighter_id),
      roundNumber: rounds.find((round) => round.id === item.round_id)?.round_number ?? 0,
      elapsedSeconds: Number.isFinite(parsedTime) ? parsedTime : 0,
      label: item.description?.trim() || item.event_type.replaceAll("_", " "),
      public: true,
      createdAt: item.created_at ?? new Date(0).toISOString(),
    };
  }

  private mapStatistics(
    fight: FightParticipantRow,
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
    fight: DecisionFightRow,
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
