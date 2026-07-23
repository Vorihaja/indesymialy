import { BaseEntity } from "./common";


export interface CombatEvent extends BaseEntity {


 title:string;


 description?:string;


 poster_url?:string;


 location?:string;


 city_id?:number;


 start_date:string;


 end_date?:string;


 organizer_id:string;


 status:
 | "draft"
 | "published"
 | "live"
 | "finished"
 | "cancelled";


}