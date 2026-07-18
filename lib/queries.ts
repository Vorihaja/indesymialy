import { createClient } from "./server"

export async function getDisciplines(){
  const supabase = await createClient()
  const { data } = await supabase.from("disciplines").select("id,name,slug").order("name")
  return data || []
}
export async function getRegions(){
  const supabase = await createClient()
  const { data } = await supabase.from("regions").select("id,name").order("name")
  return data || []
}
export async function getRegionsWithCities(){
  const supabase = await createClient()
  const { data } = await supabase.from("regions").select("id,name, cities(id,name)").order("name")
  return data || []
}
export async function getCitiesByRegion(regionId: string){
  const supabase = await createClient()
  const { data } = await supabase.from("cities").select("id,name").eq("region_id", regionId).order("name")
  return data || []
}