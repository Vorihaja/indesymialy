import {
  createSupabaseBrowserClient
} from "@/infrastructure/supabase"



export function makeSupabaseClient(){

  return createSupabaseBrowserClient()

}