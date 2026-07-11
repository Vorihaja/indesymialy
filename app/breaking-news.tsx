"use client";

export default function BreakingNews() {
  const newsItems = [
    "Gala Open MMA Mahajanga : Inscriptions ouvertes jusqu'au 15 juillet.",
    "Championnat National de Judo : Primes de cashprize augmentées de 20% cette saison.",
    "Fédération : Nouvelle réglementation sur les protections homologuées en compétition.",
    "Marketplace : Arrivée imminente du nouveau système de location de tatamis professionnels.",
  ];

  const scrollingText = newsItems.join(" • ");

  return (
    <div className="h-7 w-full border-b border-neutral-900 bg-neutral-950 flex items-center font-mono text-[10px] uppercase tracking-wider select-none overflow-hidden relative z-50">
      
      {/* CSS d'animation brut injecté proprement pour contourner les bugs de build */}
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
        .custom-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>

      {/* Badge Fixe Flash Info */}
      <div className="h-full px-3 bg-red-700 text-white font-black flex items-center shrink-0 z-20 border-r border-neutral-900 shadow-[4px_0_10px_rgba(0,0,0,0.4)]">
        Flash
      </div>

      {/* Zone de défilement */}
      <div className="w-full h-full flex items-center overflow-hidden relative bg-neutral-950 z-10">
        <div className="custom-marquee text-neutral-400 font-bold pl-4">
          <span className="inline-block pr-8">{scrollingText}</span>
          <span className="inline-block pr-8">{scrollingText}</span>
        </div>
      </div>
    </div>
  );
}