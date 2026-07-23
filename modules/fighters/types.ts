import type { UUID, Timestamp } from "@/types/common";


/**
 * Profil principal combattant
 */
export interface Fighter {

  id: UUID;

  user_id: UUID;


  first_name: string;

  last_name: string;

  nickname?: string;


  avatar_url?: string;

  cover_url?: string;


  gender?: "male" | "female";


  birth_date?: string;


  nationality?: string;


  region_id?: number;

  city_id?: number;



  height?: number;

  weight?: number;

  reach?: number;



  fighting_style?: string;

  guard?: 
    | "orthodox"
    | "southpaw"
    | "switch"
    | string;



  category?: string;


  club_id?: UUID;

  coach_id?: UUID;



  bio?: string;



  status:
    | "active"
    | "inactive"
    | "suspended"
    | "pending";



  created_at: Timestamp;

  updated_at?: Timestamp;

}





/**
 * Statistiques sportives
 */
export interface FighterStats {


  fighter_id: UUID;


  fights: number;


  wins: number;


  losses: number;


  draws: number;



  knockouts: number;


  submissions: number;


  decisions: number;



  win_streak: number;


  ranking_position?: number;



  updated_at?: Timestamp;

}





/**
 * Historique de combat
 */
export interface FighterRecord {


  id: UUID;


  fighter_id: UUID;


  opponent_id?: UUID;


  event_id?: UUID;



  result:
    | "win"
    | "loss"
    | "draw"
    | "no_contest";



  method?:
    | "KO"
    | "TKO"
    | "Submission"
    | "Decision"
    | string;



  round?: number;


  fight_date?: string;



  created_at: Timestamp;

}





/**
 * Filtres recherche combattants
 */
export interface FighterSearchFilters {


  search?: string;


  gender?: string;


  category?: string;


  discipline?: string;


  region_id?: number;


  city_id?: number;


  club_id?: UUID;



  status?: Fighter["status"];

}





/**
 * Données dashboard ERP
 */
export interface FighterDashboardData {


  fighter: Fighter;


  stats: FighterStats;



  nextFight?: {

    event_id: UUID;

    opponent_id?: UUID;

    date: string;

  };



  contractsCount: number;


  sponsorsCount: number;


  documentsCount: number;



}