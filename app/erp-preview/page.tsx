"use client"
import { useState } from "react"
export default function Preview(){
  const [sec,setSec]=useState("finances")
  const [showModal,setShowModal]=useState(false)
  return (
    <div className="min-h-screen bg-black text-white font-mono p-6">
      <div className="max-w-7xl mx-auto flex gap-6">
        <aside className="w- space-y-1">
          {["overview","members","finances","stock"].map(s=>(
            <button key={s} onClick={()=>setSec(s)} className={`w-full h-9 px-3 rounded-full text-xs uppercase text-left ${sec===s?'bg-white text-black font-bold':'hover:bg-neutral-900 text-neutral-400'}`}>{s}</button>
          ))}
        </aside>
        <main className="flex-1">
          {sec==="finances" && (
            <div className="space-y-6">
              <div className="flex justify-between"><h1 className="text-2xl font-black tracking-widest">FINANCES • TITAN</h1><button onClick={()=>setShowModal(true)} className="h-9 px-5 bg-white text-black text-xs font-bold uppercase rounded-full">+ Transaction</button></div>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6"><div className="text- uppercase text-neutral-500">Encaissements</div><div className="text-xl font-black text-green-400 mt-2">+1 700 000 Ar</div></div>
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6"><div className="text- uppercase text-neutral-500">Dépenses</div><div className="text-xl font-black text-red-400 mt-2">-450 000 Ar</div></div>
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6"><div className="text- uppercase text-neutral-500">Marge</div><div className="text-xl font-black mt-2">1 250 000 Ar</div></div>
              </div>
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">Table transactions ici - utilise ton code finances actuel, il s'intègre tel quel</div>
            </div>
          )}
          {sec!=="finances" && <div className="text-neutral-500 text-sm uppercase">Section {sec} - à brancher</div>}
        </main>
      </div>
      {showModal && <div className="fixed inset-0 bg-black/80 grid place-items-center p-4"><div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 w-full max-w-md"><h3 className="font-bold text-sm uppercase mb-4">Nouvelle transaction</h3><button onClick={()=>setShowModal(false)} className="w-full h-10 bg-white text-black rounded-xl font-bold text-xs uppercase">Fermer (test)</button></div></div>}
    </div>
  )
}