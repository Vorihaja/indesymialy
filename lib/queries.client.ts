import { createClient } from "./client"

export async function getDisciplinesClient(){
  const supabase = createClient()
  const { data } = await supabase.from("disciplines").select("id,name,slug").order("name")
  return data || []
}