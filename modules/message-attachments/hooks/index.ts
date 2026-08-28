"use client";
import { useMemo } from "react";
import { createMessageAttachmentsStatusUseCase } from "../factories";
export function useMessageAttachmentsStatus() { const useCase = useMemo(() => createMessageAttachmentsStatusUseCase(), []); return useCase.execute(); }
