import { supabase } from "@/lib/supabase";
import type { Fighter } from "@/modules/fighters/types";


export async function getFighters(): Promise<Fighter[]> {


  const { data, error } = await supabase
    .from("fighters")
    .select("*");


  if (error) {

    throw error;

  }


  return data as Fighter[];

}




export async function getFighterById(
  id:string
):Promise<Fighter | null>{


  const { data,error } = await supabase
    .from("fighters")
    .select("*")
    .eq("id",id)
    .single();



  if(error){

    return null;

  }


  return data as Fighter;


}