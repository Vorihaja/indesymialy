import { FightLiveRealtimeRepository } from "../repositories/fight-live-realtime.repository"
import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js"

type RealtimeRow = Record<string, unknown>



export class FightLiveRealtimeService {

  constructor(
    private readonly realtimeRepository: FightLiveRealtimeRepository
  ) {}



  /**
   * Écouter les événements officiels du combat
   */
  subscribeToFightEvents(
    fightId: string,
    callback: (payload: RealtimePostgresChangesPayload<RealtimeRow>) => void
  ) {

    if (!fightId) {
      throw new Error(
        "Fight ID obligatoire"
      )
    }


    return this.realtimeRepository
      .subscribeToFightEvents(
        fightId,
        callback
      )

  }




  /**
   * Écouter le chrono du combat
   */
  subscribeToTimer(
    fightId: string,
    callback: (payload: RealtimePostgresChangesPayload<RealtimeRow>) => void
  ) {

    if (!fightId) {
      throw new Error(
        "Fight ID obligatoire"
      )
    }


    return this.realtimeRepository
      .subscribeToTimer(
        fightId,
        callback
      )

  }

  subscribeToScores(fightId: string, callback: (payload: RealtimePostgresChangesPayload<RealtimeRow>) => void) { if (!fightId) throw new Error("Fight ID obligatoire"); return this.realtimeRepository.subscribeToScores(fightId, callback) }
  subscribeToLiveActions(fightId: string, callback: (payload: RealtimePostgresChangesPayload<RealtimeRow>) => void) { if (!fightId) throw new Error("Fight ID obligatoire"); return this.realtimeRepository.subscribeToLiveActions(fightId, callback) }
  subscribeToStatistics(fightId: string, callback: (payload: RealtimePostgresChangesPayload<RealtimeRow>) => void) { if (!fightId) throw new Error("Fight ID obligatoire"); return this.realtimeRepository.subscribeToStatistics(fightId, callback) }
  subscribeToJudgeCards(fightId: string, callback: (payload: RealtimePostgresChangesPayload<RealtimeRow>) => void) { if (!fightId) throw new Error("Fight ID obligatoire"); return this.realtimeRepository.subscribeToJudgeCards(fightId, callback) }
  subscribeToStatus(fightId: string, callback: (payload: RealtimePostgresChangesPayload<RealtimeRow>) => void) { if (!fightId) throw new Error("Fight ID obligatoire"); return this.realtimeRepository.subscribeToStatus(fightId, callback) }
  subscribeToResult(fightId: string, callback: (payload: RealtimePostgresChangesPayload<RealtimeRow>) => void) { if (!fightId) throw new Error("Fight ID obligatoire"); return this.realtimeRepository.subscribeToResult(fightId, callback) }




  /**
   * Désabonnement Realtime
   */
  async unsubscribe(
    channel: RealtimeChannel
  ) {

    return this.realtimeRepository
      .unsubscribe(
        channel
      )

  }

}
