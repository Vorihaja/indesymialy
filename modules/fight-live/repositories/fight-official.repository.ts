import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/infrastructure/supabase/database.types";
import { normalizeBackendError } from "@/shared/errors/backend-error";

export class FightOfficialRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async recordOfficialAction(params: {
    fightId: string;
    roundId: string;
    fighterId: string;
    actionTypeId: string;
    recordedBy?: string;
    notes?: string;
  }) {
    const { data, error } = await this.supabase.rpc("record_official_action", {
      p_fight_id: params.fightId,
      p_round_id: params.roundId,
      p_fighter_id: params.fighterId,
      p_action_type_id: params.actionTypeId,
      p_recorded_by: undefined,
      p_notes: params.notes ?? undefined,
    });

    if (error) throw normalizeBackendError(error);
    return data;
  }

  async getOfficials(fightId: string) {
    const { data, error } = await this.supabase
      .from("fight_official_assignments")
      .select("*")
      .eq("fight_id", fightId)
      .order("assigned_at", { ascending: true });

    if (error) throw normalizeBackendError(error);
    return data;
  }
}
