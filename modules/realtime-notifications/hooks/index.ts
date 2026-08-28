"use client";
import { useMemo } from "react";
import { createRealtimeNotificationsStatusUseCase } from "../factories";
export function useRealtimeNotificationsStatus() { const useCase = useMemo(() => createRealtimeNotificationsStatusUseCase(), []); return useCase.execute(); }
