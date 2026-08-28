export const dynamic = 'force-dynamic'
import { createClient } from "@/lib/server"

const ALLOWED = ['regions','cities','disciplines'] as const
type AllowedTable = (typeof ALLOWED)[number]
type AdminTableRow = { id: string; name: string; slug?: string | null; region_id?: string | null }
function isAllowedTable(value: string): value is AllowedTable { return ALLOWED.some((table) => table === value) }

export default async function TablePage({ params }: { params: Promise<{ table: string }> }){
  const { table } = await params
  const tableName = table?.toLowerCase()

  if(!isAllowedTable(tableName)){
    return <div className="mx-auto mt-6 max-w-[1500px] border border-red-500/30 bg-red-500/5 p-5 text-sm text-red-300">Table non autorisée : {tableName}</div>
  }
  
  const supabase = await createClient()
  const { data, error } = await supabase.from(tableName).select("*").order("name").limit(200)
  
  if(error) return <div className="mx-auto mt-6 max-w-[1500px] border border-red-500/30 bg-red-500/5 p-5 text-sm text-red-400">{error.message}</div>

  const rows = (data ?? []) as AdminTableRow[]
  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-4 p-4 text-zinc-100 sm:p-6">
      <header className="border-b border-[#303238] pb-3">
        <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#3d92ff]">Registre de données</p>
        <h1 className="mt-1 text-xl font-black uppercase">{tableName} · Indesy Mialy</h1>
        <p className="mt-1 text-[10px] text-zinc-500">{data?.length} lignes</p>
      </header>
      <div className="overflow-hidden border border-[#303238] bg-[#151619]">
        <table className="w-full text-xs">
          <thead className="bg-[#101114] text-[9px] uppercase tracking-[0.08em] text-zinc-500"><tr><th className="p-3 text-left">ID</th><th className="p-3 text-left">Nom</th><th className="p-3 text-left">Slug / Région</th></tr></thead>
          <tbody>{rows.map((row)=><tr key={row.id} className="border-t border-[#303238] hover:bg-white/[0.02]"><td className="p-3 font-mono text-[10px] text-zinc-500">{row.id.slice(0,8)}</td><td className="p-3 font-semibold">{row.name}</td><td className="p-3 text-zinc-500">{row.slug || row.region_id?.slice(0,8) || '-'}</td></tr>)}</tbody>
        </table>
      </div>
    </div>
  )
}
