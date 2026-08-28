"use client";
import { useMemo } from "react";
import { createSponsorOffersStatusUseCase } from "../factories";
export function useSponsorOffersStatus() { const useCase = useMemo(() => createSponsorOffersStatusUseCase(), []); return useCase.execute(); }
