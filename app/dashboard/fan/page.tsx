"use client";

import ErpAuthGuard from "@/app/components/ErpAuthGuard";

export default function TemporaryFanPage() {
  return (
    <ErpAuthGuard>
      <div className="p-8 text-white bg-black min-h-screen">
        <h1 className="text-amber-500 font-bold">Espace Fan Temporel</h1>
        <p className="text-xs text-zinc-400">Si tu vois cette page, ton utilisateur a le rôle "Fan" dans Supabase.</p>
      </div>
    </ErpAuthGuard>
  );
}