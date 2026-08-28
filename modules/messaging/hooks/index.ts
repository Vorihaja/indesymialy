"use client";
import { useMemo } from "react";
import { createMessagingStatusUseCase } from "../factories";
export function useMessagingStatus() { const useCase = useMemo(() => createMessagingStatusUseCase(), []); return useCase.execute(); }
