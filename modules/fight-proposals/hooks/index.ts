"use client";
import { useMemo } from "react";
import { createFightProposalsStatusUseCase } from "../factories";
export function useFightProposalsStatus() { const useCase = useMemo(() => createFightProposalsStatusUseCase(), []); return useCase.execute(); }
