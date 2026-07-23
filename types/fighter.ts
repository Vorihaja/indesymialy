import { BaseEntity } from "./common";


export interface Fighter extends BaseEntity {


  user_id: string;


  first_name: string;


  last_name: string;


  nickname?: string;


  gender?: string;


  birth_date?: string;


  nationality?: string;


  height?: number;


  weight?: number;


  category?: string;


  fighting_style?: string;


  guard?: string;


  reach?: number;


  club_id?: string;


  coach_id?: string;


  wins:number;


  losses:number;


  draws:number;


}