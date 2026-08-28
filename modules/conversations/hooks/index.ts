"use client";
import { useMemo } from "react";
import { createConversationsStatusUseCase } from "../factories";
export function useConversationsStatus() { const useCase = useMemo(() => createConversationsStatusUseCase(), []); return useCase.execute(); }
