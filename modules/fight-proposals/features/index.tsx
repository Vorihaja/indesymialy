"use client";
import { ProposalFeature } from "@/modules/communication-core";
import { FightProposalsBoundary } from "../components";
import { useFightProposalsStatus } from "../hooks";
export function FightProposalsFeature() { const status = useFightProposalsStatus(); return <FightProposalsBoundary><span className="sr-only">{status.domain} {status.storage}</span><ProposalFeature kind="fight" /></FightProposalsBoundary>; }
