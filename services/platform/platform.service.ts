import { supabase } from "@/lib/supabase";


export async function getPlatformStats() {

  const [
    fightersResult,
    eventsResult,
    disciplinesResult,
    clubsResult
  ] = await Promise.all([

    supabase
      .from("fighters")
      .select("*", {
        count: "exact",
        head: true
      }),


    supabase
      .from("events")
      .select("*", {
        count: "exact",
        head: true
      }),


    supabase
      .from("disciplines")
      .select("*", {
        count: "exact",
        head: true
      }),


    supabase
      .from("clubs")
      .select("*", {
        count: "exact",
        head: true
      })

  ]);


  return {

    fighters:
      fightersResult.count ?? 0,

    events:
      eventsResult.count ?? 0,

    disciplines:
      disciplinesResult.count ?? 0,

    clubs:
      clubsResult.count ?? 0

  };

}