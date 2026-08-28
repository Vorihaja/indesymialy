"use client";
import { useMemo } from "react";
import { createNotificationsStatusUseCase } from "../factories";
export function useNotificationsStatus() { const useCase = useMemo(() => createNotificationsStatusUseCase(), []); return useCase.execute(); }
