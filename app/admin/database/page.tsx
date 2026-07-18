import Link from "next/link"
export default function DatabaseIndex(){
  const tables = [
    { id: 'regions', name: 'Régions', expected: 24 },
    { id: 'cities', name: 'Villes', expected: 106 },
    { id: 'disciplines', name: 'Disciplines', expected: 42 },
  ]
  return (
    <div className="p-8 bg-black min-h-screen text-white">
      <h1 className="text-2xl font-black mb-6">Base Indesy Mialy</h1>
      <div className="grid gap-3">
        {tables.map(t=>(
          <Link key={t.id} href={`/admin/database/${t.id}`} className="border border-slate-800 p-4 rounded bg-zinc-900 hover:bg-zinc-800 flex justify-between">
            <span>{t.name}</span><span className="text-slate-400">{t.expected} attendus → gérer</span>
          </Link>
        ))}
      </div>
    </div>
  )
}