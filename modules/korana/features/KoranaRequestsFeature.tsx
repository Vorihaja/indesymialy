"use client";

import {
  ProposalFeature,
} from "@/modules/communication-core/features/CommunicationFeatures";

export function KoranaRequestsFeature() {
  return (
    <div className="h-full min-h-0 overflow-y-auto bg-[#090a0c] text-zinc-100">
      <header className="sticky top-0 z-20 border-b border-white/[0.07] bg-[#090a0c]/95 px-4 py-4 backdrop-blur-xl sm:px-6">
        <h1 className="text-lg font-black tracking-[-0.025em]">
          Requêtes
        </h1>

        <p className="mt-1 text-[11px] text-zinc-500">
          Invitations, demandes et propositions qui nécessitent une décision.
        </p>
      </header>

      <div className="grid gap-4 p-4 sm:p-6 xl:grid-cols-2">
        <section className="min-w-0 border border-white/[0.07] bg-[#101216] p-4">
          <div className="mb-4 border-b border-white/[0.06] pb-3">
            <span className="text-[9px] font-black uppercase tracking-[0.14em] text-[#ff4058]">
              Combat
            </span>

            <h2 className="mt-1 text-sm font-black">
              Propositions de combat
            </h2>

            <p className="mt-1 text-[10px] leading-5 text-zinc-600">
              Examiner, accepter, refuser ou contre-proposer.
            </p>
          </div>

          <ProposalFeature kind="fight" />
        </section>

        <section className="min-w-0 border border-white/[0.07] bg-[#101216] p-4">
          <div className="mb-4 border-b border-white/[0.06] pb-3">
            <span className="text-[9px] font-black uppercase tracking-[0.14em] text-[#ff4058]">
              Partenariat
            </span>

            <h2 className="mt-1 text-sm font-black">
              Offres de sponsoring
            </h2>

            <p className="mt-1 text-[10px] leading-5 text-zinc-600">
              Examiner les propositions de partenariat qui vous concernent.
            </p>
          </div>

          <ProposalFeature kind="sponsor" />
        </section>
      </div>
    </div>
  );
}