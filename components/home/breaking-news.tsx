"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/client";

const FALLBACK = [
  "Gala Open MMA Mahajanga : Inscriptions ouvertes jusqu'au 15 juillet.",
  "Championnat National de Judo : Primes de cashprize augmentées de 20% cette saison.",
  "Fédération : Nouvelle réglementation sur les protections homologuées.",
  "Marketplace : Arrivée imminente du nouveau système de location de tatamis.",
];

export default function BreakingNews() {
  const [items, setItems] = useState<string[]>(FALLBACK);
  const supabase = createClient();

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("breaking_news").select("text").order("created_at", { ascending: false }).limit(20);
      if (data && data.length > 0) {
        setItems(data.map((d: any) => d.text));
      }
    })();

    // temps réel : dès que tu ajoutes une news dans Supabase, ça update sans refresh
    const channel = supabase.channel("breaking_news_live").on("postgres_changes", { event: "*", schema: "public", table: "breaking_news" }, async () => {
      const { data } = await supabase.from("breaking_news").select("text").order("created_at", { ascending: false }).limit(20);
      if (data?.length) setItems(data.map((d: any) => d.text));
    }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const scrollingText = items.join(" • ");

  return (
    <div className="h-7 w-full border-b border-neutral-900 bg-neutral-950 flex items-center font-mono text-[10px] uppercase tracking-wider select-none overflow-hidden relative z-50">
      <style>{`
        @keyframes marquee {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
       .custom-marquee {
          display: inline-block;
          white-space: nowrap;
          animation: marquee 45s linear infinite;
        }
       .custom-marquee:hover { animation-play-state: paused; }
      `}</style>

      <div className="h-full px-3 bg-red-700 text-white font-black flex items-center shrink-0 z-20 border-r border-neutral-900 shadow-[4px_0_10px_rgba(0,0,0,0.4)]">
        Flash
      </div>

      <div className="w-full h-full flex items-center overflow-hidden relative bg-neutral-950 z-10">
        <div className="custom-marquee text-white-400 font-bold pl-4">
          <span className="inline-block pr-8">{scrollingText}</span>
          <span className="inline-block pr-8">{scrollingText}</span>
        </div>
      </div>
    </div>
  );
}