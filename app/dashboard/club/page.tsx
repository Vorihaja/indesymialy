"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/client"
export default function ClubList(){
  const supabase=createClient(); const router=useRouter(); const [orgs,setOrgs]=useState<any[]>([])
  useEffect(()=>{ supabase.from("organizations").select("*").then(({data})=>setOrgs(data||[])) },[])
  return <div className="min-h-screen bg-black text-white p-10"><h1 className="text- mono font-black mb-6">MES CLUBS • {orgs.length}</h1><div className="grid grid-cols-3 gap-4">{orgs.map(o=><button key={o.id} onClick={()=>router.push(`/dashboard/club/${o.id}`)} className="h- bg-[#0b1226] border border-white/10 rounded-2xl p-5 text-left hover:border-[#1230ff] transition"><div className="text- font-bold mono">{o.name}</div><div className="text- text-zinc-500 mono mt-1">{o.region} • {o.ville}</div></button>)}</div></div>
}