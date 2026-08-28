"use client";
import { ProposalFeature } from "@/modules/communication-core";
import { SponsorOffersBoundary } from "../components";
import { useSponsorOffersStatus } from "../hooks";
export function SponsorOffersFeature() { const status = useSponsorOffersStatus(); return <SponsorOffersBoundary><span className="sr-only">{status.domain} {status.storage}</span><ProposalFeature kind="sponsor" /></SponsorOffersBoundary>; }
