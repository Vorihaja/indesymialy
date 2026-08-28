"use client"; import { useSocialCrud } from "@/modules/social-core"; import { SOCIAL_MODULES } from "@/modules/social-modules"; export const useNews = () => useSocialCrud(SOCIAL_MODULES.news);
