import { supabase } from "@/lib/supabase";

import type {
  Fighter,
  FighterStats,
  FighterRecord,
  FighterDashboardData,
} from "../types";


/**
 * Repository Supabase pour les données combattant.
 * Seul point d'accès à la base de données pour ce module.
 */
export class FighterRepository {


  /**
   * Récupère le profil combattant par user_id.
   */
  async getByUserId(
    userId: string
  ): Promise<Fighter | null> {


    const { data, error } = await supabase

      .from("fighters")

      .select("*")

      .eq("user_id", userId)

      .single();



    if (error) return null;


    return data as Fighter;

  }




  /**
   * Récupère un combattant par ID.
   */
  async getById(
    id: string
  ): Promise<Fighter | null> {


    const { data, error } = await supabase

      .from("fighters")

      .select("*")

      .eq("id", id)

      .single();



    if (error) return null;


    return data as Fighter;

  }




  /**
   * Liste tous les combattants.
   */
  async getAll(): Promise<Fighter[]> {


    const { data, error } = await supabase

      .from("fighters")

      .select("*");



    if (error) throw error;


    return (data ?? []) as Fighter[];

  }




  /**
   * Création d'un combattant.
   * Utilisé par FighterRegistration.
   */
  async create(
    fighter: Partial<Fighter>
  ): Promise<Fighter | null> {


    const { data, error } = await supabase

      .from("fighters")

      .insert(fighter)

      .select()

      .single();



    if (error) {

      throw error;

    }



    return data as Fighter;

  }




  /**
   * Statistiques du combattant.
   */
  async getStats(
    fighterId: string
  ): Promise<FighterStats> {


    const { data: statsData } = await supabase

      .from("fighter_stats")

      .select("*")

      .eq("fighter_id", fighterId)

      .single();



    if (statsData) {

      return statsData as FighterStats;

    }



    const records = await this.getRecords(
      fighterId
    );



    const wins =
      records.filter(
        (r) => r.result === "win"
      ).length;



    const losses =
      records.filter(
        (r) => r.result === "loss"
      ).length;



    const draws =
      records.filter(
        (r) => r.result === "draw"
      ).length;



    const knockouts =
      records.filter(
        (r) =>
          r.result === "win" &&
          (
            r.method === "KO" ||
            r.method === "TKO"
          )
      ).length;



    const submissions =
      records.filter(
        (r) =>
          r.result === "win" &&
          r.method === "Submission"
      ).length;



    const decisions =
      records.filter(
        (r) =>
          r.result === "win" &&
          r.method === "Decision"
      ).length;



    let winStreak = 0;


    for (const record of records) {

      if (record.result === "win") {

        winStreak++;

      } else {

        break;

      }

    }



    return {

      fighter_id: fighterId,

      fights: records.length,

      wins,

      losses,

      draws,

      knockouts,

      submissions,

      decisions,

      win_streak: winStreak,

    };

  }




  /**
   * Historique combats.
   */
  async getRecords(
    fighterId: string
  ): Promise<FighterRecord[]> {


    const { data, error } = await supabase

      .from("fighter_records")

      .select("*")

      .eq(
        "fighter_id",
        fighterId
      )

      .order(
        "fight_date",
        {
          ascending:false,
        }
      );



    if (error) return [];



    return data as FighterRecord[];

  }




  /**
   * Prochain combat.
   */
  async getNextFight(
    fighterId: string
  ): Promise<
    FighterDashboardData["nextFight"] | undefined
  > {


    const today =
      new Date()
        .toISOString()
        .split("T")[0];



    const { data } = await supabase

      .from("fighter_records")

      .select(
        "event_id, opponent_id, fight_date"
      )

      .eq(
        "fighter_id",
        fighterId
      )

      .gte(
        "fight_date",
        today
      )

      .order(
        "fight_date",
        {
          ascending:true,
        }
      )

      .limit(1)

      .single();



    if (
      !data?.event_id ||
      !data?.fight_date
    ) {

      return undefined;

    }



    return {

      event_id: data.event_id,

      opponent_id:
        data.opponent_id ?? undefined,

      date: data.fight_date,

    };

  }




  /**
   * Mise à jour profil.
   */
  async updateProfile(
    fighterId:string,
    updates:Partial<Fighter>
  ):Promise<Fighter | null>{


    const { data,error } = await supabase

      .from("fighters")

      .update(updates)

      .eq(
        "id",
        fighterId
      )

      .select()

      .single();



    if(error) return null;



    return data as Fighter;

  }




  async countContracts(
    fighterId:string
  ):Promise<number>{


    const { count } = await supabase

      .from("fighter_contracts")

      .select("*", {
        count:"exact",
        head:true,
      })

      .eq(
        "fighter_id",
        fighterId
      );



    return count ?? 0;

  }




  async countSponsors(
    fighterId:string
  ):Promise<number>{


    const { count } = await supabase

      .from("fighter_sponsors")

      .select("*", {
        count:"exact",
        head:true,
      })

      .eq(
        "fighter_id",
        fighterId
      );



    return count ?? 0;

  }




  async countDocuments(
    fighterId:string
  ):Promise<number>{


    const { count } = await supabase

      .from("fighter_documents")

      .select("*", {
        count:"exact",
        head:true,
      })

      .eq(
        "fighter_id",
        fighterId
      );



    return count ?? 0;

  }


}