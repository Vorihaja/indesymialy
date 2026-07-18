export const dynamic = 'force-dynamic'
import { createClient } from "@/lib/server"

const ALLOWED = ['regions','cities','disciplines'] as const

export default async function TablePage({ params }: { params: Promise<{ table: string }> }){
  const { table } = await params
  const tableName = table?.toLowerCase()

  if(!ALLOWED.includes(tableName as any)){
    return <div className="p-8 bg-black min-h-screen text-white">Table non autorisée : {tableName}</div>
  }
  
  const supabase = await createClient()
  const { data, error } = await supabase.from(tableName).select("*").order("name").limit(200)
  
  if(error) return <div className="p-8 bg-black min-h-screen text-red-400">{error.message}</div>

  return (
    <div className="p-8 bg-black min-h-screen text-white">
      <h1 className="text-2xl font-black mb-2 uppercase">{tableName} - Indesy Mialy</h1>
      <p className="text-slate-400 mb-6">{data?.length} lignes</p>
      <div className="border border-slate-800 rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-900 text-slate-400"><tr><th className="p-3 text-left">ID</th><th className="p-3 text-left">Name</th><th className="p-3 text-left">Slug / Region</th></tr></thead>
          <tbody>{data?.map((row:any)=><tr key={row.id} className="border-t border-slate-800"><td className="p-3 font-mono text-xs">{row.id.slice(0,8)}</td><td className="p-3">{row.name}</td><td className="p-3 text-slate-400">{row.slug || row.region_id?.slice(0,8) || '-'}</td></tr>)}</tbody>
        </table>
      </div>
    </div>
  )
}