"use client";
import { useMemo } from "react";
import { createNotificationPreferencesStatusUseCase } from "../factories";
export function useNotificationPreferencesStatus() { const useCase = useMemo(() => createNotificationPreferencesStatusUseCase(), []); return useCase.execute(); }
