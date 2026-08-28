"use client";
import { useMemo } from "react";
import { createMessagesStatusUseCase } from "../factories";
export function useMessagesStatus() { const useCase = useMemo(() => createMessagesStatusUseCase(), []); return useCase.execute(); }
