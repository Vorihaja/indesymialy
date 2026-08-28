"use client";
import { useEffect, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

const CHANNEL_NAME = "breaking_news_live_home";

const FALLBACK = [
  "Gala Open MMA Mahajanga : Inscriptions ouvertes jusqu'au 15 juillet.",
  "Championnat National de Judo : Primes de cashprize augmentées de 20% cette saison.",
  "Fédération : Nouvelle réglementation sur les protections homologuées.",
  "Marketplace : Arrivée imminente du nouveau système de location de tatamis.",
];

export default function BreakingNews() {
  const [items, setItems] = useState<string[]>(FALLBACK);
  useEffect(() => {
    let isMounted = true;
    let channel: RealtimeChannel | null = null;

    const loadBreakingNews = async () => {
      const { data } = await supabase.from("breaking_news").select("text").order("created_at", { ascending: false }).limit(20);
      if (isMounted && data && data.length > 0) {
        setItems(data.map((item) => item.text));
      }
    };

    // temps réel : mise à jour en temps réel sans rechargement
    const setupRealtime = async () => {
      await loadBreakingNews();

      const topic = `realtime:${CHANNEL_NAME}`;
      const existingChannel = supabase.getChannels().find((candidate) => candidate.topic === topic);
      if (existingChannel) {
        await supabase.removeChannel(existingChannel);
      }

      if (!isMounted) return;

      channel = supabase
        .channel(CHANNEL_NAME)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "breaking_news" },
          () => {
            void loadBreakingNews();
          },
        )
        .subscribe();
    };

    void setupRealtime();

    return () => {
      isMounted = false;
      if (channel) {
        void supabase.removeChannel(channel);
      }
    };
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
