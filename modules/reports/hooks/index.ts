"use client"; import { useSocialCrud } from "@/modules/social-core"; import { SOCIAL_MODULES } from "@/modules/social-modules"; export const useReports = () => useSocialCrud(SOCIAL_MODULES.reports);
