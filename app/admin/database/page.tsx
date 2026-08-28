import Link from "next/link"
export default function DatabaseIndex(){
  const tables = [
    { id: 'regions', name: 'Régions', expected: 24 },
    { id: 'cities', name: 'Villes', expected: 106 },
    { id: 'disciplines', name: 'Disciplines', expected: 42 },
  ]
  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-4 p-4 text-zinc-100 sm:p-6">
      <header className="border-b border-[#303238] pb-3">
        <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#3d92ff]">Administration système</p>
        <h1 className="mt-1 text-xl font-black">Base Indesy Mialy</h1>
      </header>
      <div className="grid gap-2">
        {tables.map(t=>(
          <Link key={t.id} href={`/admin/database/${t.id}`} className="flex justify-between border border-[#303238] bg-[#151619] p-3 text-xs hover:border-[#2588ff]">
            <span className="font-semibold">{t.name}</span><span className="text-zinc-500">{t.expected} attendus → gérer</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
