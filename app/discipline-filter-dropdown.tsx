"use client"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/client"

export function DisciplineFilterDropdown({ value, onChange }: { value: string; onChange: (v: string) => void }){
  const [items, setItems] = useState<any[]>([])
  useEffect(()=>{
    const supabase = createClient()
    supabase.from("disciplines").select("id,name,slug").order("name").then(({data})=> setItems(data||[]))
  },[])
  return (
    <select value={value} onChange={e=>onChange(e.target.value)} className="bg-black border border-slate-800 rounded px-3 py-2 text-sm w-full">
      <option value="">Toutes disciplines ({items.length})</option>
      {items.map((d:any)=> <option key={d.id} value={d.slug}>{d.name}</option>)}
    </select>
  )
}