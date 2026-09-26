"use client";

import {
  ProposalFeature,
} from "@/modules/communication-core/features/CommunicationFeatures";

import {
  KORANA_REQUEST_SOURCES,
} from "../requests/request-sources";
import {
  KoranaEventCoorganizationRequests,
} from "./KoranaEventCoorganizationRequests";
import {
  KoranaOfficialAssignmentRequests,
} from "./KoranaOfficialAssignmentRequests";

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

      <div className="p-4 sm:p-6">
        <div className="mb-3">
          <span className="text-[9px] font-black uppercase tracking-[0.14em] text-zinc-600">
            Reçues
          </span>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          {KORANA_REQUEST_SOURCES.map((source) => (
            <section
              key={source.id}
              data-request-authority={source.authority}
              className="min-w-0 border border-white/[0.07] bg-[#101216] p-4"
            >
              <div className="mb-4 border-b border-white/[0.06] pb-3">
                <span className="text-[9px] font-black uppercase tracking-[0.14em] text-[#ff4058]">
                  {source.category}
                </span>

                <h2 className="mt-1 text-sm font-black">
                  {source.title}
                </h2>

                <p className="mt-1 text-[10px] leading-5 text-zinc-600">
                  {source.description}
                </p>
              </div>

              {source.renderStrategy === "proposal" ? (
                <ProposalFeature
                  kind={source.kind}
                  actionableOnly
                />
              ) : source.renderStrategy === "official-assignments" ? (
                <KoranaOfficialAssignmentRequests />
              ) : (
                <KoranaEventCoorganizationRequests />
              )}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}